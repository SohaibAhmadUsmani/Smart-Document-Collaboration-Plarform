import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/auth/users.routes.js';
import { documentRouter } from '../modules/documents/document.routes.js';
import { workspaceRouter, folderRouter } from '../modules/workspaces/routes/workspaceRoutes.js';
import { commentRouter } from '../modules/comments/routes/commentRoutes.js';
import { notificationRouter } from '../modules/notifications/routes/notificationRoutes.js';
import { fileRouter } from '../modules/files-dashboard/file.routes.js';
import { dashboardRouter } from '../modules/files-dashboard/dashboard.routes.js';
import { registerDocumentActivityListeners } from '../modules/files-dashboard/documentActivityListener.js';
import { historyRouter } from '../modules/history-search/historyRoutes.js';

export const apiRouter = Router();
registerDocumentActivityListeners();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/workspaces', workspaceRouter);
apiRouter.use('/folders', folderRouter);
apiRouter.use('/comments', commentRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/files', fileRouter);
apiRouter.use('/dashboard', dashboardRouter);
// Module owners register their routers here as they become ready.
apiRouter.use('/history-search', historyRouter);