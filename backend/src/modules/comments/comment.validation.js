import mongoose from 'mongoose';

const VALID_ANCHOR_TYPES = ['text_selection', 'block_node'];

/**
 * Validates that a value is a valid MongoDB ObjectId.
 */
function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

/**
 * Validates request payload for creating a comment.
 */
export function validateCreateComment(req, res, next) {
  const { documentId, body, anchorType, from, to, mentions, parentComment } = req.body;

  if (!documentId || !isValidObjectId(documentId)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'A valid documentId is required.',
    });
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Comment body is required and cannot be empty.',
    });
  }

  if (!anchorType || !VALID_ANCHOR_TYPES.includes(anchorType)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `anchorType must be one of: ${VALID_ANCHOR_TYPES.join(', ')}.`,
    });
  }

  if (typeof from !== 'number' || Number.isNaN(from)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'from must be a valid number.',
    });
  }

  if (from < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'from must not be negative.',
    });
  }

  if (typeof to !== 'number' || Number.isNaN(to)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'to must be a valid number.',
    });
  }

  if (to < from) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'to must not be less than from.',
    });
  }

  if (mentions !== undefined && mentions !== null) {
    if (!Array.isArray(mentions)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'mentions must be an array if provided.',
      });
    }

    for (const mentionId of mentions) {
      if (!isValidObjectId(mentionId)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Invalid mention user ID: '${mentionId}'.`,
        });
      }
    }
  }

  if (parentComment !== undefined && parentComment !== null) {
    if (!isValidObjectId(parentComment)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'parentComment must be a valid ObjectId.',
      });
    }
  }

  next();
}

/**
 * Validates request payload for replying to a comment.
 */
export function validateReplyToComment(req, res, next) {
  const { commentId } = req.params;
  const { body } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'A valid commentId is required.',
    });
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Comment body is required and cannot be empty.',
    });
  }

  next();
}

/**
 * Validates that the route param :commentId is a valid ObjectId.
 */
export function validateCommentId(req, res, next) {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid comment ID format: '${commentId}'.`,
    });
  }

  next();
}

/**
 * Validates that the route param :documentId is a valid ObjectId.
 */
export function validateDocumentIdParam(req, res, next) {
  const { documentId } = req.params;

  if (!documentId || !isValidObjectId(documentId)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid document ID format: '${documentId}'.`,
    });
  }

  next();
}
