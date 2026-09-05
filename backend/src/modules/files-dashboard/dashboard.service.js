import mongoose from 'mongoose';
import { DocumentModel } from '../documents/document.model.js';
import { WorkspaceMember } from '../workspaces/models/WorkspaceMember.js';
import { DocumentPermission } from '../workspaces/models/DocumentPermission.js';
import { FileModel } from './file.model.js';
import { getRecentActivity } from './activityLog.service.js';
import { isMongoConnectivityError } from '../../config/database.js';

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function getOfflineMockDocument(workspaceId, userId) {
  return {
    _id: 'doc-offline-sample-1',
    id: 'doc-offline-sample-1',
    title: 'Welcome to DocSync Pro (Offline Mode)',
    workspaceId: workspaceId || 'test-workspace-1',
    folderId: null,
    icon: '📝',
    coverImage: null,
    tags: ['offline', 'guide'],
    favoritedBy: [],
    attachments: [],
    createdBy: userId || 'anonymous-user',
    lastModifiedBy: userId || 'anonymous-user',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isArchived: false,
    version: 1,
  };
}

function getOfflineMockWorkspaces(workspaceId) {
  const wsId = workspaceId || 'test-workspace-1';
  return [
    {
      _id: wsId,
      id: wsId,
      name: 'Engineering Core',
      description: 'Default local workspace (Offline Mode)',
      role: 'owner',
    },
  ];
}

// Returns workspace IDs the user actually belongs to. Empty until real
// auth provides a valid Mongo ObjectId user id.
async function getUserWorkspaceIds(userId) {
  try {
    if (mongoose.connection?.readyState !== 1 || !isValidObjectId(userId)) return [];
    const memberships = await WorkspaceMember.find({ user: userId }).select('workspace').lean();
    return memberships.map((m) => m.workspace.toString());
  } catch (err) {
    if (isMongoConnectivityError(err)) return [];
    throw err;
  }
}

export async function getMyDocuments(userId, limit = 10) {
  try {
    if (mongoose.connection?.readyState !== 1) {
      return [getOfflineMockDocument('test-workspace-1', userId)];
    }
    return await DocumentModel.find({ createdBy: userId, isArchived: false })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  } catch (err) {
    if (isMongoConnectivityError(err)) {
      console.warn('[Dashboard Notice]: Falling back to cached documents on transient DB timeout:', err.message);
      return [getOfflineMockDocument('test-workspace-1', userId)];
    }
    throw err;
  }
}

export async function getRecentDocuments(userId, limit = 10) {
  try {
    if (mongoose.connection?.readyState !== 1) {
      return [getOfflineMockDocument('test-workspace-1', userId)];
    }
    const workspaceIds = await getUserWorkspaceIds(userId);
    const query = workspaceIds.length
      ? { workspaceId: { $in: workspaceIds }, isArchived: false }
      : { createdBy: userId, isArchived: false };
    return await DocumentModel.find(query).sort({ updatedAt: -1 }).limit(limit).lean().exec();
  } catch (err) {
    if (isMongoConnectivityError(err)) {
      return [getOfflineMockDocument('test-workspace-1', userId)];
    }
    throw err;
  }
}

export async function getSharedWithMe(userId, limit = 10) {
  try {
    if (mongoose.connection?.readyState !== 1) return [];
    const workspaceIds = await getUserWorkspaceIds(userId);
    let directDocIds = [];
    try {
      if (isValidObjectId(userId)) {
        const perms = await DocumentPermission.find({ user: userId }).select('document').lean();
        directDocIds = perms.map((p) => p.document);
      }
    } catch (_) {}

    const conditions = [];
    if (workspaceIds.length) {
      conditions.push({ workspaceId: { $in: workspaceIds } });
    }
    if (directDocIds.length) {
      conditions.push({ _id: { $in: directDocIds } });
    }

    if (!conditions.length) return [];

    return await DocumentModel.find({
      $or: conditions,
      createdBy: { $ne: userId },
      isArchived: false,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  } catch (err) {
    if (isMongoConnectivityError(err)) return [];
    throw err;
  }
}

export async function getFavorites(userId, limit = 10) {
  try {
    if (mongoose.connection?.readyState !== 1) return [];
    return await DocumentModel.find({ favoritedBy: userId, isArchived: false })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  } catch (err) {
    if (isMongoConnectivityError(err)) return [];
    throw err;
  }
}

export async function getMyWorkspaces(userId) {
  try {
    if (mongoose.connection?.readyState !== 1) {
      return getOfflineMockWorkspaces();
    }
    if (!isValidObjectId(userId)) return [];
    const memberships = await WorkspaceMember.find({ user: userId })
      .populate('workspace')
      .lean();
    return memberships
      .filter((m) => m.workspace)
      .map((m) => ({ ...m.workspace, role: m.role }));
  } catch (err) {
    if (isMongoConnectivityError(err)) {
      return getOfflineMockWorkspaces();
    }
    throw err;
  }
}

export async function getDashboardOverview(userId, workspaceId) {
  try {
    if (mongoose.connection?.readyState !== 1) {
      const mockDoc = getOfflineMockDocument(workspaceId, userId);
      return {
        recentDocuments: [mockDoc],
        myDocuments: [mockDoc],
        sharedWithMe: [],
        favorites: [],
        workspaces: getOfflineMockWorkspaces(workspaceId),
        recentActivity: [
          {
            _id: 'act-offline-1',
            action: 'document.viewed',
            entityType: 'document',
            entityName: 'Welcome to DocSync Pro (Offline Mode)',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }

    const [recentDocuments, myDocuments, sharedWithMe, favorites, workspaces, recentActivity] =
      await Promise.all([
        getRecentDocuments(userId, 10),
        getMyDocuments(userId, 10),
        getSharedWithMe(userId, 10),
        getFavorites(userId, 10),
        getMyWorkspaces(userId),
        workspaceId ? getRecentActivity({ workspaceId, limit: 15 }) : Promise.resolve([]),
      ]);

    return { recentDocuments, myDocuments, sharedWithMe, favorites, workspaces, recentActivity };
  } catch (err) {
    if (isMongoConnectivityError(err)) {
      const mockDoc = getOfflineMockDocument(workspaceId, userId);
      return {
        recentDocuments: [mockDoc],
        myDocuments: [mockDoc],
        sharedWithMe: [],
        favorites: [],
        workspaces: getOfflineMockWorkspaces(workspaceId),
        recentActivity: [],
      };
    }
    throw err;
  }
}