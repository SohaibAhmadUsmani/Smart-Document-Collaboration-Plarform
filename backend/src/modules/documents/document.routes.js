import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './document.controller.js';
import * as validator from './document.validation.js';

export const documentRouter = Router();

// Apply auth middleware to all document routes
documentRouter.use(requireAuth);

// GET /api/documents?workspaceId=... - List documents in a workspace
documentRouter.get('/', controller.listDocumentsHandler);

// POST /api/documents - Create a new document
documentRouter.post(
  '/',
  validator.validateCreateDocument,
  controller.createDocumentHandler
);

// GET /api/documents/:id - Fetch single document by ID
documentRouter.get(
  '/:id',
  validator.validateDocumentId,
  controller.getDocumentHandler
);

// PUT /api/documents/:id - Update document metadata (title, icon, cover, folder)
documentRouter.put(
  '/:id',
  validator.validateDocumentId,
  validator.validateUpdateDocument,
  controller.updateDocumentHandler
);

// PATCH /api/documents/:id/autosave - Autosave rich-text content
documentRouter.patch(
  '/:id/autosave',
  validator.validateDocumentId,
  validator.validateAutosave,
  controller.autosaveDocumentHandler
);

// DELETE /api/documents/:id - Archive (soft-delete) document
documentRouter.delete(
  '/:id',
  validator.validateDocumentId,
  controller.archiveDocumentHandler
);

// PATCH /api/documents/:id/restore - Restore an archived document
documentRouter.patch(
  '/:id/restore',
  validator.validateDocumentId,
  controller.restoreDocumentHandler
);
