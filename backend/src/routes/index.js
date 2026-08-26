import { Router } from 'express';
import { documentRouter } from '../modules/documents/document.routes.js';
import { workspaceRouter, folderRouter } from '../modules/workspaces/routes/workspaceRoutes.js';
import { commentRouter } from '../modules/comments/routes/commentRoutes.js';
import { notificationRouter } from '../modules/notifications/routes/notificationRoutes.js';
import { fileRouter } from '../modules/files-dashboard/file.routes.js';
import { dashboardRouter } from '../modules/files-dashboard/dashboard.routes.js';
import { historyRouter } from '../modules/history-search/historyRoutes.js';

export const apiRouter = Router();

apiRouter.use('/documents', documentRouter);
apiRouter.use('/workspaces', workspaceRouter);
apiRouter.use('/folders', folderRouter);
apiRouter.use('/comments', commentRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/files', fileRouter);
apiRouter.use('/dashboard', dashboardRouter);
// Module owners register their routers here as they become ready.
apiRouter.use('/history-search', historyRouter);