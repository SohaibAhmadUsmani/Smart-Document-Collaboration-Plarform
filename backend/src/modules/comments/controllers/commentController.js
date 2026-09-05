import mongoose from 'mongoose';
import * as commentService from '../services/commentService.js';

function getUserId(req) {
  return req.user?.id || req.user?._id || 'anonymous-user';
}

/**
 * POST /comments
 * Create a new comment on a document.
 */
export async function createCommentHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const {
      documentId,
      body,
      anchorType,
      from,
      to,
      exactQuote,
      prefixContext,
      suffixContext,
      blockId,
      mentions,
      parentComment,
    } = req.body;

    const comment = await commentService.createComment({
      documentId,
      userId,
      body,
      anchorType,
      from,
      to,
      exactQuote,
      prefixContext,
      suffixContext,
      blockId,
      mentions,
      parentComment,
    });

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /comments/document/:documentId
 * List all comments for a document.
 */
export async function getDocumentCommentsHandler(req, res, next) {
  try {
    const { documentId } = req.params;
    if (mongoose.connection?.readyState !== 1) {
      return res.status(200).json({ success: true, data: [] });
    }
    const comments = await commentService.getDocumentComments(documentId);

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /comments/:commentId
 * Get a single comment by ID.
 */
export async function getCommentByIdHandler(req, res, next) {
  try {
    const { commentId } = req.params;
    const comment = await commentService.getCommentById(commentId);

    return res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /comments/:commentId/replies
 * Reply to an existing comment.
 */
export async function replyToCommentHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const { commentId } = req.params;
    const {
      documentId,
      body,
      anchorType,
      from,
      to,
      exactQuote,
      prefixContext,
      suffixContext,
      blockId,
      mentions,
    } = req.body;

    const reply = await commentService.replyToComment({
      commentId,
      documentId,
      userId,
      body,
      anchorType,
      from,
      to,
      exactQuote,
      prefixContext,
      suffixContext,
      blockId,
      mentions,
    });

    return res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      data: reply,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /comments/:commentId/resolve
 * Mark a comment as resolved.
 */
export async function resolveCommentHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const { commentId } = req.params;
    const comment = await commentService.resolveComment({ commentId, userId });

    return res.status(200).json({
      success: true,
      message: 'Comment resolved successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /comments/:commentId
 * Delete a comment.
 */
export async function deleteCommentHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const { commentId } = req.params;
    const result = await commentService.deleteComment({ commentId, userId });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export const commentController = {
  createCommentHandler,
  getDocumentCommentsHandler,
  getCommentByIdHandler,
  replyToCommentHandler,
  resolveCommentHandler,
  deleteCommentHandler,
};
