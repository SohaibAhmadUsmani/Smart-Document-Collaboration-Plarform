import { Router } from 'express';
import { workspaceRouter, folderRouter } from '../modules/workspaces/routes/workspaceRoutes.js';


export const apiRouter = Router();

// Module owners register their routers here as they become ready.
apiRouter.use('/workspaces', workspaceRouter);
apiRouter.use('/folders', folderRouter);