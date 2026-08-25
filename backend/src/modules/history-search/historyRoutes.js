/**
 * historyRoutes.js
 * Owner: Aiman
 * 
 * Express Router defining API endpoints for Version History & Global Search.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  handleGetHistory,
  handleCreateSnapshot,
  handleGetVersion,
  handleRestoreVersion,
  handleGetDiff,
  handleSearch
} from './historyController.js';

export const historyRouter = Router();

// Apply authentication middleware to all history-search routes
historyRouter.use(requireAuth);

// Version history routes
historyRouter.get('/documents/:documentId/history', handleGetHistory);
historyRouter.post('/documents/:documentId/history', handleCreateSnapshot);

// Single version & diff routes
historyRouter.get('/versions/:versionId', handleGetVersion);
historyRouter.get('/diff', handleGetDiff);

// Version restore route
historyRouter.post('/documents/:documentId/restore/:versionId', handleRestoreVersion);

// Global search route
historyRouter.get('/search', handleSearch);
