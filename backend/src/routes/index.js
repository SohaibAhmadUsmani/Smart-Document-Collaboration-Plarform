import { Router } from 'express';
import { documentRouter } from '../modules/documents/document.routes.js';
import { workspaceRouter, folderRouter } from '../modules/workspaces/routes/workspaceRoutes.js';
import { commentRouter } from '../modules/comments/routes/commentRoutes.js';

export const apiRouter = Router();

apiRouter.use('/documents', documentRouter);
apiRouter.use('/workspaces', workspaceRouter);
apiRouter.use('/folders', folderRouter);
apiRouter.use('/comments', commentRouter);