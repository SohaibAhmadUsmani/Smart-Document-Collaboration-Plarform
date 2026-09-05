import mongoose from 'mongoose';
import { isSafeUrl } from './document.utils.js';

/**
 * Whitelist of allowed MIME types for document attachments.
 * Disallows SVG vectors, raw HTML, scripts, and executable binaries.
 * [ROMAN URDU]: Attachment files ke liye safe MIME types ki whitelist jo dangerous scripts aur executable files ko block karti hai.
 */
export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

/**
 * Checks whether an AST document tree exceeds the maximum recursion depth limit.
 * [Issue #24]: Prevents call-stack recursion bombs and Denial of Service (DoS).
 *
 * [ROMAN URDU]: AST ke nesting levels ko check karta hai taake recursion bomb / stack overflow DoS attacks se bacha ja sakay (maximum 30 levels).
 *
 * @param {Object} node - AST node to check
 * @param {number} [depth=1] - Current recursion depth
 * @param {number} [maxDepth=30] - Maximum allowed depth threshold
 * @returns {boolean} True if within safe limit, false if exceeded
 */
export function checkAstDepth(node, depth = 1, maxDepth = 30) {
  if (!node || typeof node !== 'object') return true;
  if (depth > maxDepth) return false;

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      if (!checkAstDepth(child, depth + 1, maxDepth)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates request payload for document creation.
 * [Issue #26]: Enforces title length cap (max 255 chars) and whitespace trimming.
 * [Issue #24]: Enforces maximum AST recursion depth (max 30 levels).
 *
 * [ROMAN URDU]: Naya document bananay ki request payload ko validate karta hai.
 */
export function validateCreateDocument(req, res, next) {
  let { workspaceId, title, content, tags } = req.body;

  if (!workspaceId || typeof workspaceId !== 'string' || !workspaceId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'A valid workspaceId is required.',
    });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Document title cannot be empty.',
      });
    }
    title = title.trim();
    if (title.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Document title cannot exceed 255 characters.',
      });
    }
    req.body.title = title;
  }

  if (content !== undefined && content !== null) {
    if (typeof content !== 'object' || Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Document content must be a valid JSON AST structure.',
      });
    }

    if (!checkAstDepth(content, 1, 30)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Document content AST exceeds maximum allowed nesting depth of 30 levels.',
      });
    }
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Tags must be provided as an array of strings.',
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
  }

  next();
}

/**
 * Validates request payload for updating document metadata.
 * [Issue #26]: Enforces title cap (max 255 chars) and trims whitespace.
 *
 * [ROMAN URDU]: Document metadata (title, icon, cover image, folder) update request ko validate karta hai.
 */
export function validateUpdateMetadata(req, res, next) {
  let { title, icon, coverImage, folderId } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Title must be a non-empty string.',
      });
    }
    title = title.trim();
    if (title.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Title cannot exceed 255 characters.',
      });
    }
    req.body.title = title;
  }

  if (icon !== undefined && typeof icon !== 'string' && icon !== null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Icon must be a string or null.',
    });
  }

  if (coverImage !== undefined && coverImage !== null && coverImage !== '') {
    if (typeof coverImage !== 'string' || !isSafeUrl(coverImage)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Cover image must be a valid safe URL string (http, https, safe base64) or null.',
      });
    }
  }

  if (folderId !== undefined && typeof folderId !== 'string' && folderId !== null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Folder ID must be a string or null.',
    });
  }

  if (req.body.workspaceId !== undefined && typeof req.body.workspaceId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Workspace ID must be a string if provided.',
    });
  }

  if (req.body.isPublished !== undefined && typeof req.body.isPublished !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'isPublished must be a boolean if provided.',
    });
  }

  next();
}

export const validateUpdateDocument = validateUpdateMetadata;

/**
 * Validates request payload for autosaving document content.
 * [Issue #24]: Enforces maximum recursion depth (max 30 levels).
 *
 * [ROMAN URDU]: Document rich-text autosave request ko validate karta hai aur nested depth ko check karta hai.
 */
export function validateAutosave(req, res, next) {
  const { content, plainText, baseVersion } = req.body;

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Autosave requires a valid content object (AST/JSON).',
    });
  }

  if (!checkAstDepth(content, 1, 30)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Document content AST exceeds maximum allowed nesting depth of 30 levels.',
    });
  }

  if (plainText !== undefined && typeof plainText !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'plainText must be a string if provided.',
    });
  }

  if (baseVersion !== undefined && baseVersion !== null) {
    const parsed = Number(baseVersion);
    if (isNaN(parsed) || parsed < 1) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'baseVersion must be a positive integer.',
      });
    }
  }

  next();
}

/**
 * Validates request payload for updating tags.
 * [ROMAN URDU]: Tags update request ko validate karta hai.
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
 * [Issue #30]: Enforces MIME type whitelist.
 * [Issue #6]: Validates downloadUrl safe schemes.
 *
 * [ROMAN URDU]: File attachment linking request ko validate karta hai aur safe MIME types/URLs check karta hai.
 */
export function validateAttachment(req, res, next) {
  const { fileId, fileName, fileSize, mimeType, downloadUrl } = req.body;

  if (!fileId || typeof fileId !== 'string' || !fileId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileId is required.',
    });
  }

  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileName is required.',
    });
  }

  if (fileName.trim().length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileName cannot exceed 255 characters.',
    });
  }

  if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'fileSize must be a valid non-negative number.',
    });
  }

  if (!mimeType || typeof mimeType !== 'string' || !ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType.toLowerCase().trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Unsupported or unsafe attachment MIME type: '${mimeType}'. Allowed types include common images, pdf, plain text, markdown, csv, json, documents, and zip.`,
    });
  }

  if (downloadUrl !== undefined && typeof downloadUrl === 'string' && !isSafeUrl(downloadUrl)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'downloadUrl contains an unsafe or unsupported protocol scheme.',
    });
  }

  next();
}

/**
 * Validates deep AST content search parameters.
 * [ROMAN URDU]: AST deep content search parameters ko validate karta hai.
 */
export function validateAstSearch(req, res, next) {
  const { workspaceId, query } = req.body;

  if (!workspaceId || typeof workspaceId !== 'string' || !workspaceId.trim()) {
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

  if (query.trim().length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Search query cannot exceed 200 characters to prevent ReDoS.',
    });
  }

  next();
}

/**
 * Validates batch operation requests across multiple documents.
 * [ROMAN URDU]: Multi-document batch operations payload ko validate karta hai.
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

  // Validate move payload: service reads `targetFolderId` (also accept `folderId` for compatibility)
  if (action === 'move' && (!payload || (typeof payload.targetFolderId === 'undefined' && typeof payload.folderId === 'undefined'))) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Batch move action requires a payload with targetFolderId (or folderId).',
    });
  }
  // Normalize: if client sent folderId but not targetFolderId, copy it over for the service
  if (action === 'move' && payload && typeof payload.targetFolderId === 'undefined' && typeof payload.folderId !== 'undefined') {
    payload.targetFolderId = payload.folderId;
  }

  // Validate tag payload: service reads `tagsToAdd` and/or `tagsToRemove` (also accept `tags` for compatibility)
  if (action === 'tag' && payload) {
    // Accept both formats: { tags: [...] } or { tagsToAdd: [...], tagsToRemove: [...] }
    if (!Array.isArray(payload.tagsToAdd) && !Array.isArray(payload.tagsToRemove) && !Array.isArray(payload.tags)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Batch tag action requires a payload with tagsToAdd/tagsToRemove arrays (or tags array).',
      });
    }
    // Normalize: if client sent `tags` but not `tagsToAdd`, treat tags as tagsToAdd for the service
    if (Array.isArray(payload.tags) && !Array.isArray(payload.tagsToAdd)) {
      payload.tagsToAdd = payload.tags;
    }
  } else if (action === 'tag' && !payload) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Batch tag action requires a payload with tagsToAdd/tagsToRemove arrays.',
    });
  }

  next();
}

/**
 * Validates MongoDB ObjectId format or mock doc ID for route parameter :id.
 * [Issue #27]: Strict validation on route :id parameters.
 *
 * [ROMAN URDU]: Route parameter :id ko strictly validate karta hai ke wo valid 24-character hexadecimal ObjectId ya valid mock doc format hai.
 */
export function validateDocumentId(req, res, next) {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Document ID parameter is required.',
    });
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id) || mongoose.isValidObjectId(id);
  const isMockDocId = /^doc_[a-zA-Z0-9_-]+$/.test(id);

  if (!isObjectId && !isMockDocId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid document ID format: '${id}'. Must be a 24-character hexadecimal ObjectId.`,
    });
  }

  next();
}
