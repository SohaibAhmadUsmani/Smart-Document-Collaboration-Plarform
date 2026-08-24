import { Router } from 'express';
import { memberController } from '../controllers/memberController.js';
import { requireWorkspaceRole } from '../middleware/requireWorkspaceRole.js';

export const memberRouter = Router({ mergeParams: true });

memberRouter.get('/', requireWorkspaceRole('view'), memberController.list);
memberRouter.post('/', requireWorkspaceRole('manage'), memberController.add);
memberRouter.patch('/:userId', requireWorkspaceRole('manage'), memberController.updateRole);
memberRouter.delete('/:userId', requireWorkspaceRole('manage'), memberController.remove);
