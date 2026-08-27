import mongoose from 'mongoose';

/**
 * Validates request payload for document creation.
 */
export function validateCreateDocument(req, res, next) {
  const { workspaceId, title, content, tags } = req.body;

  if (!workspaceId || typeof workspaceId !== 'string' || !workspaceId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'A valid workspaceId is required.',
    });
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Document title is required.',
    });
  }

  if (title.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Document title cannot exceed 255 characters.',
    });
  }

  if (content && typeof content !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Document content must be a valid JSON AST structure.',
    });
  }

  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Tags must be provided as an array of strings.',
    });
  }

  next();
}

/**
 * Validates request payload for updating document metadata.
 */
export function validateUpdateMetadata(req, res, next) {
  const { title, icon, coverImage, folderId } = req.body;

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Title must be a non-empty string.',
    });
  }

  if (title && title.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Title cannot exceed 255 characters.',
    });
  }

  if (icon !== undefined && typeof icon !== 'string' && icon !== null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Icon must be a string or null.',
    });
  }

  if (coverImage !== undefined && typeof coverImage !== 'string' && coverImage !== null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Cover image must be a URL string or null.',
    });
  }

  if (folderId !== undefined && typeof folderId !== 'string' && folderId !== null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Folder ID must be a string or null.',
    });
  }

  next();
}

export const validateUpdateDocument = validateUpdateMetadata;


/**
 * Validates request payload for autosaving document content.
 */
export function validateAutosave(req, res, next) {
  const { content, plainText } = req.body;

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Autosave requires a valid content object (AST/JSON).',
    });
  }

  if (plainText !== undefined && typeof plainText !== 'string') {
    return res.status(400).json({
      success: false,
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
      success: false,
      error: 'Validation Error',
      message: 'Tags must be provided as an array.',
    });
  }

  const invalidTag = tags.find((t) => typeof t !== 'string' || !t.trim());
  if (invalidTag !== undefined) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'All tags must be non-empty strings.',
    });
  }

  next();
}

/**
 * Validates request payload for linking an attachment.
 */
export function validateAttachment(req, res, next) {
  const { fileId, fileName, fileSize, mimeType, storageKey, downloadUrl } = req.body;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileId is required.',
    });
  }

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileName is required.',
    });
  }

  if (fileSize !== undefined && typeof fileSize !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileSize must be a valid number.',
    });
  }

  next();
}

/**
 * Validates deep AST content search parameters.
 */
export function validateAstSearch(req, res, next) {
  const { workspaceId, query } = req.body;

  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'workspaceId is required for AST search.',
    });
  }

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Search query string is required.',
    });
  }

  next();
}

/**
 * Validates batch operation requests across multiple documents.
 */
export function validateBatchOperation(req, res, next) {
  const { documentIds, action, payload } = req.body;

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'documentIds must be a non-empty array.',
    });
  }

  const allowedActions = ['archive', 'restore', 'move', 'tag', 'duplicate', 'delete_permanent'];
  if (!action || !allowedActions.includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Action must be one of: ${allowedActions.join(', ')}.`,
    });
  }

  if (action === 'move' && (!payload || typeof payload.folderId === 'undefined')) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Batch move action requires a payload with folderId.',
    });
  }

  if (action === 'tag' && (!payload || !Array.isArray(payload.tags))) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Batch tag action requires a payload with tags array.',
    });
  }

  next();
}

/**
 * Validates MongoDB ObjectId format or mock doc ID for route parameter :id.
 */
export function validateDocumentId(req, res, next) {
  const { id } = req.params;

  if (!id || (typeof id !== 'string') || (!mongoose.isValidObjectId(id) && !id.startsWith('doc_'))) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid document ID format: '${id}'.`,
    });
  }

  next();
}
