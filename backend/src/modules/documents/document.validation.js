import mongoose from 'mongoose';

/**
 * Validates request payload for creating a new document.
 */
export function validateCreateDocument(req, res, next) {
  const { workspaceId, title, folderId, content } = req.body;

  if (!workspaceId || typeof workspaceId !== 'string' || !workspaceId.trim()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A valid workspaceId is required.',
    });
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Document title must be a non-empty string if provided.',
    });
  }

  if (folderId !== undefined && folderId !== null && typeof folderId !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Folder ID must be a string or null.',
    });
  }

  if (content !== undefined && (typeof content !== 'object' || content === null)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Document content must be a valid JSON object representing the document AST.',
    });
  }

  next();
}

/**
 * Validates request payload for updating document metadata.
 */
export function validateUpdateDocument(req, res, next) {
  const { title, icon, coverImage, folderId } = req.body;

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Title must be a non-empty string.',
    });
  }

  if (icon !== undefined && icon !== null && typeof icon !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Icon must be a string or null.',
    });
  }

  if (coverImage !== undefined && coverImage !== null && typeof coverImage !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Cover image must be a URL string or null.',
    });
  }

  if (folderId !== undefined && folderId !== null && typeof folderId !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Folder ID must be a string or null.',
    });
  }

  next();
}

/**
 * Validates request payload for autosaving document content.
 */
export function validateAutosave(req, res, next) {
  const { content, plainText } = req.body;

  if (!content || typeof content !== 'object') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Autosave requires a valid content object (AST/JSON).',
    });
  }

  if (plainText !== undefined && typeof plainText !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'plainText must be a string if provided.',
    });
  }

  next();
}

/**
 * Validates MongoDB ObjectId format for route parameter :id.
 */
export function validateDocumentId(req, res, next) {
  const { id } = req.params;

  if (!id || (mongoose.Types.ObjectId.isValid(id) === false && typeof id !== 'string')) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid document ID format.',
    });
  }

  next();
}
