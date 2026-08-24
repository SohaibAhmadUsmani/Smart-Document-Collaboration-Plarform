import { Router } from 'express';
import { sharingController } from '../controllers/sharingController.js';
import { requireWorkspaceRole } from '../middleware/requireWorkspaceRole.js';

export const sharingRouter = Router({ mergeParams: true });

sharingRouter.get('/', requireWorkspaceRole('view'), sharingController.getSharing);
sharingRouter.patch('/', requireWorkspaceRole('manage'), sharingController.updateSharing);
sharingRouter.post('/rotate', requireWorkspaceRole('manage'), sharingController.rotateShareLink);
