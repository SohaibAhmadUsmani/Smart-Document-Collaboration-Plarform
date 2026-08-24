import { sharingService } from '../services/sharingService.js';
import { validateSharingVisibility } from '../validators/workspaceValidators.js';

async function getSharing(req, res, next) {
  try {
    const sharing = await sharingService.getSharing(req.params.workspaceId);
    res.json({ sharing });
  } catch (error) {
    next(error);
  }
}

async function updateSharing(req, res, next) {
  try {
    const visibility = validateSharingVisibility(req.body.visibility);
    const sharing = await sharingService.updateSharing(req.params.workspaceId, { visibility });
    res.json({ sharing });
  } catch (error) {
    next(error);
  }
}

async function rotateShareLink(req, res, next) {
  try {
    const sharing = await sharingService.rotateShareLink(req.params.workspaceId);
    res.json({ sharing });
  } catch (error) {
    next(error);
  }
}

export const sharingController = { getSharing, updateSharing, rotateShareLink };
