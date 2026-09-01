import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { folderController } from '../controllers/folderController.js';
import {
  requireWorkspaceRole,
  requireFolderWorkspaceRole,
} from '../middleware/requireWorkspaceRole.js';


export const workspaceFolderRouter = Router({ mergeParams: true });
workspaceFolderRouter.get('/', requireWorkspaceRole('view'), folderController.list);
workspaceFolderRouter.post('/', requireWorkspaceRole('edit'), folderController.create);


// Mounted separately at /api/folders (see routes/index.js) — not nested
// under workspaceRouter, so it needs its own requireAuth rather than
// inheriting one from a parent router.
export const folderRouter = Router();
folderRouter.use(requireAuth);
folderRouter.get('/:id', requireFolderWorkspaceRole('view'), folderController.getOne);
folderRouter.patch('/:id', requireFolderWorkspaceRole('edit'), folderController.update);
folderRouter.delete('/:id', requireFolderWorkspaceRole('edit'), folderController.remove);