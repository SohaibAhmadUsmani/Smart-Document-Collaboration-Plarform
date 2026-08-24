import crypto from 'node:crypto';
import { Workspace, SHARING_VISIBILITY } from '../models/Workspace.js';
import { AppError } from '../utils/AppError.js';

async function getSharing(workspaceId) {
  const workspace = await Workspace.findById(workspaceId).select('sharing').lean();
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }
  return workspace.sharing;
}

async function updateSharing(workspaceId, { visibility }) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
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
  if (workspace.sharing.visibility !== SHARING_VISIBILITY.ANYONE_WITH_LINK) {
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
