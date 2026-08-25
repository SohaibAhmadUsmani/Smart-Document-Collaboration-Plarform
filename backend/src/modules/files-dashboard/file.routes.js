import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from './file.storage.js';
import * as controller from './file.controller.js';

export const fileRouter = Router();

// GET /api/files/download/:storageKey - Download a file (public path, no auth prefix issue)
fileRouter.get('/download/:storageKey', controller.downloadFileHandler);

fileRouter.use(requireAuth);

// POST /api/files/upload - Upload a new file
fileRouter.post('/upload', upload.single('file'), controller.uploadFileHandler);

// GET /api/files - List files for a workspace/folder
fileRouter.get('/', controller.listFilesHandler);

// PUT /api/files/:id/rename - Rename a file
fileRouter.put('/:id/rename', controller.renameFileHandler);

// PUT /api/files/:id/move - Move a file to another folder
fileRouter.put('/:id/move', controller.moveFileHandler);

// DELETE /api/files/:id - Soft-delete a file
fileRouter.delete('/:id', controller.deleteFileHandler);