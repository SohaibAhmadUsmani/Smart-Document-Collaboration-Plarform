import { Router } from 'express';
import { historyRouter } from '../modules/history-search/historyRoutes.js';

export const apiRouter = Router();

// Module owners register their routers here as they become ready.
apiRouter.use('/history-search', historyRouter);

