/**
 * @file document.routes.js
 * @description Express routing configuration for the Document Editor module in DocSync Pro.
 * Mounts validation middleware, permission authorization guards, and controller actions.
 * @module backend/src/modules/documents/document.routes
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file DocSync Pro documents module ke tamam REST API endpoints define karti hai.
 * Tamam routes par `requireAuth` middleware laga hai, aur specific routes par Khadija ke
 * `requireDocumentAccess` permission checks (view, edit, delete, restore) aur validation guards shamil hain.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireDocumentAccess } from '../../middleware/documentPermissions.js';
import * as controller from './document.controller.js';
import * as validator from './document.validation.js';

export const documentRouter = Router();

// Apply auth middleware to all document routes
documentRouter.use(requireAuth);

// GET /api/documents - List workspace documents
documentRouter.get('/', controller.listDocumentsHandler);

// GET /api/documents/meta/tags - Get unique tags for a workspace
documentRouter.get('/meta/tags', controller.getWorkspaceTagsHandler);

// GET /api/documents/trash - List trash documents
documentRouter.get('/trash', controller.listTrashHandler);

// POST /api/documents/trash/empty - Empty workspace trash
documentRouter.post('/trash/empty', controller.emptyTrashHandler);

// POST /api/documents/search/ast - Deep AST content search
documentRouter.post('/search/ast', validator.validateAstSearch, controller.astSearchHandler);

// POST /api/documents/batch - Execute multi-document batch operation
documentRouter.post('/batch', validator.validateBatchOperation, controller.batchOperationsHandler);

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
  requireDocumentAccess('view'),
  controller.getDocumentHandler
);

// PUT /api/documents/:id - Update document metadata
documentRouter.put(
  '/:id',
  validator.validateDocumentId,
  validator.validateUpdateMetadata,
  requireDocumentAccess('edit'),
  controller.updateDocumentHandler
);

// PATCH /api/documents/:id/autosave - Autosave rich-text content
documentRouter.patch(
  '/:id/autosave',
  validator.validateDocumentId,
  validator.validateAutosave,
  requireDocumentAccess('edit'),
  controller.autosaveDocumentHandler
);

// POST /api/documents/:id/favorite - Toggle star / favorite
documentRouter.post(
  '/:id/favorite',
  validator.validateDocumentId,
  requireDocumentAccess('view'),
  controller.toggleFavoriteHandler
);

// PUT /api/documents/:id/tags - Update document tags
documentRouter.put(
  '/:id/tags',
  validator.validateDocumentId,
  validator.validateTags,
  requireDocumentAccess('edit'),
  controller.updateTagsHandler
);

// POST /api/documents/:id/attachments - Link file attachment
documentRouter.post(
  '/:id/attachments',
  validator.validateDocumentId,
  validator.validateAttachment,
  requireDocumentAccess('edit'),
  controller.addAttachmentHandler
);

// DELETE /api/documents/:id/attachments/:attachmentId - Unlink attachment
documentRouter.delete(
  '/:id/attachments/:attachmentId',
  validator.validateDocumentId,
  requireDocumentAccess('edit'),
  controller.removeAttachmentHandler
);

// POST /api/documents/:id/duplicate - Clone document
documentRouter.post(
  '/:id/duplicate',
  validator.validateDocumentId,
  requireDocumentAccess('view'),
  controller.duplicateDocumentHandler
);

// GET /api/documents/:id/export - Export document
documentRouter.get(
  '/:id/export',
  validator.validateDocumentId,
  requireDocumentAccess('view'),
  controller.exportDocumentHandler
);

// GET /api/documents/:id/stats - Get live stats
documentRouter.get(
  '/:id/stats',
  validator.validateDocumentId,
  requireDocumentAccess('view'),
  controller.getDocumentStatsHandler
);

// DELETE /api/documents/:id - Move to trash (soft-delete)
documentRouter.delete(
  '/:id',
  validator.validateDocumentId,
  requireDocumentAccess('delete'),
  controller.archiveDocumentHandler
);

// POST /api/documents/:id/restore - Restore from trash
documentRouter.post(
  '/:id/restore',
  validator.validateDocumentId,
  requireDocumentAccess('restore'),
  controller.restoreDocumentHandler
);

// DELETE /api/documents/:id/permanent - Permanently purge from database
documentRouter.delete(
  '/:id/permanent',
  validator.validateDocumentId,
  requireDocumentAccess('delete'),
  controller.permanentDeleteHandler
);
