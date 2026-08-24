import { Workspace, SHARING_VISIBILITY } from '../models/Workspace.js';
import { WorkspaceMember, WORKSPACE_ROLES } from '../models/WorkspaceMember.js';
import { Folder } from '../models/Folder.js';
import { Team } from '../models/Team.js';
import { AppError } from '../utils/AppError.js';

async function createWorkspace({ name, description, ownerId }) {
  const workspace = await Workspace.create({
    name,
    description: description ?? '',
    owner: ownerId,
    sharing: { visibility: SHARING_VISIBILITY.PRIVATE, shareToken: null },
  });

  try {
    await WorkspaceMember.create({
      workspace: workspace._id,
      user: ownerId,
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
  const memberships = await WorkspaceMember.find({ user: userId })
    .populate('workspace')
    .sort({ updatedAt: -1 })
    .lean();

  return memberships
    .filter((membership) => membership.workspace) 
    .map((membership) => ({
      ...membership.workspace,
      myRole: membership.role,
    }));
}

async function getWorkspaceById(workspaceId) {
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }
  return workspace;
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
