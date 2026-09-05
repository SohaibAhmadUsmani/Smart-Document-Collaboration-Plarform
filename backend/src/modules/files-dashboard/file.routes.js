import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from './file.storage.js';
import * as controller from './file.controller.js';

/**
 * Files Dashboard Routing Module.
 * Configures authenticated routes for file uploads, downloads, listings, and modifications.
 *
 * [ROMAN URDU]:
 * Files dashboard ke routes. File downloads aur uploads samait tamam file operations
 * authenticated sessions (`requireAuth`) ke peeche secure kiye gaye hain.
 */
export const fileRouter = Router();

// Enforce authentication for all file endpoints including downloads
fileRouter.use(requireAuth);

// GET /api/files/download/:storageKey - Download a file (Authenticated)
fileRouter.get('/download/:storageKey', controller.downloadFileHandler);

// POST /api/files/upload - Upload a new file
fileRouter.post('/upload', upload.single('file'), controller.uploadFileHandler);

fileRouter.post('/:id/duplicate', controller.duplicateFileHandler);

// GET /api/files - List files for a workspace/folder
fileRouter.get('/', controller.listFilesHandler);

// GET /api/files/activity - Recent activity feed for a workspace
fileRouter.get('/activity', controller.getRecentActivityHandler);

// PUT /api/files/:id/rename - Rename a file
fileRouter.put('/:id/rename', controller.renameFileHandler);

// PUT /api/files/:id/move - Move a file to another folder
fileRouter.put('/:id/move', controller.moveFileHandler);

// DELETE /api/files/:id - Soft-delete a file
fileRouter.delete('/:id', controller.deleteFileHandler);