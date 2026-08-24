import { Router } from 'express';
import { folderController } from '../controllers/folderController.js';
import {
  requireWorkspaceRole,
  requireFolderWorkspaceRole,
} from '../middleware/requireWorkspaceRole.js';


export const workspaceFolderRouter = Router({ mergeParams: true });
workspaceFolderRouter.get('/', requireWorkspaceRole('view'), folderController.list);
workspaceFolderRouter.post('/', requireWorkspaceRole('edit'), folderController.create);


export const folderRouter = Router();
folderRouter.get('/:id', requireFolderWorkspaceRole('view'), folderController.getOne);
folderRouter.patch('/:id', requireFolderWorkspaceRole('edit'), folderController.update);
folderRouter.delete('/:id', requireFolderWorkspaceRole('edit'), folderController.remove);
