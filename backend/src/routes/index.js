import { Router } from 'express';
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

console.log('DEV_FAKE_AUTH raw value seen by Node:', JSON.stringify(process.env.DEV_FAKE_AUTH));

// TEMPORARY, DEV-ONLY: fakes req.user until Maira's auth module actually
// sets it. Only runs when DEV_FAKE_AUTH=true is set in your local .env —

if (process.env.DEV_FAKE_AUTH === 'true') {
  console.log('Dev fake-auth middleware is ACTIVE — all requests will get a fake user.');
  apiRouter.use((req, res, next) => {
    req.user = { id: process.env.DEV_FAKE_USER_ID || '000000000000000000000001' };
    next();
  });
} else {
  console.log('Dev fake-auth middleware is OFF — requests need real auth (currently none exists, so everything 401s).');
}
apiRouter.use('/documents', documentRouter);
apiRouter.use('/workspaces', workspaceRouter);
apiRouter.use('/folders', folderRouter);
apiRouter.use('/comments', commentRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/files', fileRouter);
apiRouter.use('/dashboard', dashboardRouter);
// Module owners register their routers here as they become ready.
apiRouter.use('/history-search', historyRouter);
