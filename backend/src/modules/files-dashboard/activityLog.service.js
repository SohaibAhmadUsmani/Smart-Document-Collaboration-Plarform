import mongoose from 'mongoose';
import { ActivityLogModel } from './activityLog.model.js';

export async function logActivity({ action, entityType = 'file', entityId, entityName, workspaceId, userId, metadata = {} }) {
  if (mongoose.connection?.readyState !== 1) {
    return;
  }
  try {
    await ActivityLogModel.create({
      action,
      entityType,
      entityId,
      entityName,
      workspaceId,
      userId,
      metadata,
    });
  } catch (error) {
    // Activity logging should never break the actual file operation.
    console.error('Failed to write activity log:', error.message);
  }
}

export async function getRecentActivity({ workspaceId, limit = 20 }) {
  if (mongoose.connection?.readyState !== 1) {
    return [];
  }
  return ActivityLogModel.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 100))
    .lean()
    .exec();
}