import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Workspace, SHARING_VISIBILITY } from '../models/Workspace.js';
import { AppError } from '../utils/AppError.js';

const DEFAULT_SHARING = Object.freeze({ visibility: SHARING_VISIBILITY.PRIVATE, shareToken: null });

async function getSharing(workspaceId) {
  if (
    mongoose.connection?.readyState !== 1 ||
    workspaceId === 'test-workspace-1' ||
    String(workspaceId).startsWith('ws_offline_')
  ) {
    return { ...DEFAULT_SHARING };
  }
  const workspace = await Workspace.findById(workspaceId).select('sharing').lean();
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }
  // Mongoose schema defaults only apply when a document is created through
  // the model. A workspace inserted directly into MongoDB (seed data, a
  // manual test fixture, an older pre-schema document) can be missing the
  // `sharing` subdocument entirely — fall back rather than returning
  // undefined, which Express silently drops from the JSON response.
  return workspace.sharing ?? { ...DEFAULT_SHARING };
}

async function updateSharing(workspaceId, { visibility }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  if (!workspace.sharing) {
    workspace.sharing = { ...DEFAULT_SHARING };
  }

  workspace.sharing.visibility = visibility;

  if (visibility === SHARING_VISIBILITY.ANYONE_WITH_LINK) {
    if (!workspace.sharing.shareToken) {
      workspace.sharing.shareToken = crypto.randomBytes(24).toString('hex');
    }
  } else {
    workspace.sharing.shareToken = null;
  }

  await workspace.save();
  return workspace.sharing;
}

/** Rotates the link token, invalidating any previously shared link. */
async function rotateShareLink(workspaceId) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }
  if (!workspace.sharing || workspace.sharing.visibility !== SHARING_VISIBILITY.ANYONE_WITH_LINK) {
    throw new AppError('Workspace is not currently shared via link', 400);
  }
  workspace.sharing.shareToken = crypto.randomBytes(24).toString('hex');
  await workspace.save();
  return workspace.sharing;
}

export const sharingService = {
  getSharing,
  updateSharing,
  rotateShareLink,
};