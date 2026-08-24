import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.js';
import { requireWorkspaceRole, requireAuthenticated } from '../middleware/requireWorkspaceRole.js';
import { memberRouter } from './memberRoutes.js';
import { teamRouter } from './teamRoutes.js';
import { sharingRouter } from './sharingRoutes.js';
import { workspaceFolderRouter, folderRouter } from './folderRoutes.js';

export const workspaceRouter = Router();

workspaceRouter.post('/', requireAuthenticated, workspaceController.create);
workspaceRouter.get('/', requireAuthenticated, workspaceController.listMine);
workspaceRouter.get('/:id', requireWorkspaceRole('view'), workspaceController.getOne);
workspaceRouter.patch('/:id', requireWorkspaceRole('manage'), workspaceController.update);
workspaceRouter.delete('/:id', requireWorkspaceRole('manage'), workspaceController.remove);

workspaceRouter.use('/:workspaceId/members', memberRouter);
workspaceRouter.use('/:workspaceId/teams', teamRouter);
workspaceRouter.use('/:workspaceId/sharing', sharingRouter);
workspaceRouter.use('/:workspaceId/folders', workspaceFolderRouter);

export { folderRouter };
