import { Router } from 'express';
import { teamController } from '../controllers/teamController.js';
import { requireWorkspaceRole } from '../middleware/requireWorkspaceRole.js';

export const teamRouter = Router({ mergeParams: true });

teamRouter.get('/', requireWorkspaceRole('view'), teamController.list);
teamRouter.post('/', requireWorkspaceRole('edit'), teamController.create);
teamRouter.post('/:teamId/members', requireWorkspaceRole('edit'), teamController.addMember);
teamRouter.delete('/:teamId/members/:userId', requireWorkspaceRole('edit'), teamController.removeMember);
teamRouter.delete('/:teamId', requireWorkspaceRole('manage'), teamController.remove);
