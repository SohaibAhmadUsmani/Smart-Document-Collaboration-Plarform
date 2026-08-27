import mongoose from 'mongoose';
import { DocumentModel } from '../documents/document.model.js';
import { WorkspaceMember } from '../workspaces/models/WorkspaceMember.js';
import { FileModel } from './file.model.js';
import { getRecentActivity } from './activityLog.service.js';

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

// Returns workspace IDs the user actually belongs to. Empty until real
// auth provides a valid Mongo ObjectId user id.
async function getUserWorkspaceIds(userId) {
  if (!isValidObjectId(userId)) return [];
  const memberships = await WorkspaceMember.find({ user: userId }).select('workspace').lean();
  return memberships.map((m) => m.workspace.toString());
}

export async function getMyDocuments(userId, limit = 10) {
  return DocumentModel.find({ createdBy: userId, isArchived: false })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getRecentDocuments(userId, limit = 10) {
  const workspaceIds = await getUserWorkspaceIds(userId);
  const query = workspaceIds.length
    ? { workspaceId: { $in: workspaceIds }, isArchived: false }
    : { createdBy: userId, isArchived: false };
  return DocumentModel.find(query).sort({ updatedAt: -1 }).limit(limit).lean().exec();
}

export async function getSharedWithMe(userId, limit = 10) {
  const workspaceIds = await getUserWorkspaceIds(userId);
  if (!workspaceIds.length) return [];
  return DocumentModel.find({
    workspaceId: { $in: workspaceIds },
    createdBy: { $ne: userId },
    isArchived: false,
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getFavorites(userId, limit = 10) {
  return DocumentModel.find({ favoritedBy: userId, isArchived: false })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getMyWorkspaces(userId) {
  if (!isValidObjectId(userId)) return [];
  const memberships = await WorkspaceMember.find({ user: userId })
    .populate('workspace')
    .lean();
  return memberships
    .filter((m) => m.workspace)
    .map((m) => ({ ...m.workspace, role: m.role }));
}

export async function getDashboardOverview(userId, workspaceId) {
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
}