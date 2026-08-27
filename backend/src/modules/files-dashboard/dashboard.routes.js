import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getDashboardHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

// GET /api/dashboard?workspaceId=... - Combined dashboard overview
dashboardRouter.get('/', getDashboardHandler);