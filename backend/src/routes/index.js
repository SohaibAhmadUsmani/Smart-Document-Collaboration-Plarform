import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/auth/users.routes.js';
import { documentRouter } from '../modules/documents/document.routes.js';
import { workspaceRouter, folderRouter } from '../modules/workspaces/routes/workspaceRoutes.js';
import { commentRouter } from '../modules/comments/routes/commentRoutes.js';
import { notificationRouter } from '../modules/notifications/routes/notificationRoutes.js';
import { historyRouter } from '../modules/history-search/historyRoutes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/workspaces', workspaceRouter);
apiRouter.use('/folders', folderRouter);
apiRouter.use('/comments', commentRouter);
apiRouter.use('/notifications', notificationRouter);
// Module owners register their routers here as they become ready.
apiRouter.use('/history-search', historyRouter);