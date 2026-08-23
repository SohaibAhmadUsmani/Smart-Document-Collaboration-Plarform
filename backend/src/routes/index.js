import { Router } from 'express';
import { documentRouter } from '../modules/documents/document.routes.js';

export const apiRouter = Router();

apiRouter.use('/documents', documentRouter);

