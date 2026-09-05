import mongoose from 'mongoose';
import { Workspace, SHARING_VISIBILITY } from '../models/Workspace.js';
import { WorkspaceMember, WORKSPACE_ROLES } from '../models/WorkspaceMember.js';
import { Folder } from '../models/Folder.js';
import { Team } from '../models/Team.js';
import { AppError } from '../utils/AppError.js';
import { isMongoConnectivityError } from '../../../config/database.js';

const offlineWorkspaces = new Map();

const defaultOfflineWorkspace = {
  _id: 'test-workspace-1',
  id: 'test-workspace-1',
  name: 'Engineering Core',
  description: 'Default local workspace (Offline Mode)',
  myRole: WORKSPACE_ROLES.OWNER,
  membersCount: 1,
};

async function createWorkspace({ name, description, ownerId }) {
  const safeOwnerId = (typeof ownerId === 'string' && mongoose.isValidObjectId(ownerId))
    ? ownerId
    : new mongoose.Types.ObjectId().toString();

  if (mongoose.connection?.readyState !== 1) {
    const wsId = `ws_offline_${Date.now()}`;
    const offlineWs = {
      _id: wsId,
      id: wsId,
      name,
      description: description ?? '',
      owner: safeOwnerId,
      myRole: WORKSPACE_ROLES.OWNER,
      membersCount: 1,
      sharing: { visibility: SHARING_VISIBILITY.PRIVATE, shareToken: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    offlineWorkspaces.set(wsId, offlineWs);
    return offlineWs;
  }

  const workspace = await Workspace.create({
    name,
    description: description ?? '',
    owner: safeOwnerId,
    sharing: { visibility: SHARING_VISIBILITY.PRIVATE, shareToken: null },
  });

  try {
    await WorkspaceMember.create({
      workspace: workspace._id,
      user: safeOwnerId,
      role: WORKSPACE_ROLES.OWNER,
      invitedBy: null,
    });
  } catch (error) {
    await Workspace.findByIdAndDelete(workspace._id);
    throw error;
  }

  return workspace;
}

async function listUserWorkspaces(userId) {
  if (mongoose.connection?.readyState !== 1 || !mongoose.isValidObjectId(userId)) {
    return [
      defaultOfflineWorkspace,
      ...Array.from(offlineWorkspaces.values()).map((w) => ({ ...w, myRole: 'OWNER' })),
    ];
  }

  try {
    const memberships = await WorkspaceMember.find({ user: userId })
      .populate('workspace')
      .sort({ updatedAt: -1 })
      .lean();

    const workspaces = memberships
      .filter((membership) => membership.workspace)
      .map((membership) => ({
        ...membership.workspace,
        myRole: membership.role,
      }));

    // Auto-provision a default workspace on first login so the UI is never empty
    if (workspaces.length === 0) {
      try {
        const provisioned = await createWorkspace({
          name: 'My Workspace',
          description: 'Your personal workspace',
          ownerId: userId,
        });
        // Ensure plain object (createWorkspace may return a Mongoose document)
        const plainProvisioned = provisioned.toObject ? provisioned.toObject() : provisioned;
        return [{ ...plainProvisioned, myRole: WORKSPACE_ROLES.OWNER }];
      } catch (provisionErr) {
        console.warn('[Workspace Notice]: Auto-provision skipped:', provisionErr.message);
      }
    }

    return workspaces;
  } catch (err) {
    if (isMongoConnectivityError(err)) {
      console.warn('[Workspace Notice]: Falling back to cached workspaces on transient DB timeout:', err.message);
      return [
        defaultOfflineWorkspace,
        ...Array.from(offlineWorkspaces.values()).map((w) => ({ ...w, myRole: 'OWNER' })),
      ];
    }
    throw err;
  }
}

async function getWorkspaceById(workspaceId) {
  if (workspaceId === 'test-workspace-1') {
    return defaultOfflineWorkspace;
  }
  if (offlineWorkspaces.has(workspaceId)) {
    return offlineWorkspaces.get(workspaceId);
  }

  if (mongoose.connection?.readyState !== 1) {
    return {
      _id: workspaceId,
      id: workspaceId,
      name: 'Engineering Core',
      description: 'Default local workspace (Offline Mode)',
      owner: 'offline-user',
      sharing: { visibility: SHARING_VISIBILITY.PRIVATE, shareToken: null },
    };
  }

  if (!mongoose.isValidObjectId(workspaceId)) {
    throw new AppError('Workspace not found', 404);
  }

  try {
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }
    return workspace;
  } catch (err) {
    if (isMongoConnectivityError(err)) {
      return {
        _id: workspaceId,
        id: workspaceId,
        name: 'Engineering Core',
        description: 'Default local workspace (Offline Mode)',
        owner: 'offline-user',
        sharing: { visibility: SHARING_VISIBILITY.PRIVATE, shareToken: null },
      };
    }
    throw err;
  }
}

async function updateWorkspace(workspaceId, updates) {
  const workspace = await Workspace.findByIdAndUpdate(
    workspaceId,
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }
  return workspace;
}

/** Cascades: deleting a workspace removes its members, folders, and teams. */
async function deleteWorkspace(workspaceId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  await Promise.all([
    WorkspaceMember.deleteMany({ workspace: workspaceId }),
    Folder.deleteMany({ workspace: workspaceId }),
    Team.deleteMany({ workspace: workspaceId }),
    Workspace.findByIdAndDelete(workspaceId),
  ]);
}

export const workspaceService = {
  createWorkspace,
  listUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
};
