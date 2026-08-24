import mongoose from 'mongoose';

/**
 * Validates request payload for creating a new document.
 */
export function validateCreateDocument(req, res, next) {
  const { workspaceId, title, folderId, content, tags } = req.body;

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

  if (tags !== undefined && !Array.isArray(tags)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Tags must be an array of strings.',
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
 * Validates request payload for updating tags.
 */
export function validateTags(req, res, next) {
  const { tags } = req.body;

  if (!Array.isArray(tags)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Payload must contain a "tags" array of strings.',
    });
  }

  next();
}

/**
 * Validates request payload for attaching a file reference.
 */
export function validateAttachment(req, res, next) {
  const { fileId, fileName, fileSize, mimeType, downloadUrl } = req.body;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Valid fileId string is required.',
    });
  }

  if (!downloadUrl || typeof downloadUrl !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Valid downloadUrl string is required.',
    });
  }

  next();
}

/**
 * Validates batch operations payload.
 */
export function validateBatchOperation(req, res, next) {
  const { action, documentIds } = req.body;

  const validActions = ['archive', 'restore', 'move', 'tag', 'duplicate', 'delete_permanent'];

  if (!action || !validActions.includes(action)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid action. Supported actions: ${validActions.join(', ')}.`,
    });
  }

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'documentIds must be a non-empty array of document IDs.',
    });
  }

  next();
}

/**
 * Validates deep AST search payload.
 */
export function validateAstSearch(req, res, next) {
  const { workspaceId, query, nodeTypes } = req.body;

  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A valid workspaceId is required.',
    });
  }

  if (nodeTypes !== undefined && !Array.isArray(nodeTypes)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'nodeTypes must be an array of node type strings if provided.',
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
