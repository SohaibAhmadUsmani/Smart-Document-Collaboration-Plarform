import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from '../controllers/commentController.js';
import {
  validateCreateComment,
  validateReplyToComment,
  validateCommentId,
  validateDocumentIdParam,
} from '../comment.validation.js';

export const commentRouter = Router();

// Apply auth middleware to all comment routes
commentRouter.use(requireAuth);

// POST /comments - Create a new comment
commentRouter.post('/', validateCreateComment, controller.createCommentHandler);

// GET /comments/document/:documentId - List comments for a document
commentRouter.get('/document/:documentId', validateDocumentIdParam, controller.getDocumentCommentsHandler);

// GET /comments/:commentId - Get a single comment
commentRouter.get('/:commentId', validateCommentId, controller.getCommentByIdHandler);

// POST /comments/:commentId/replies - Reply to a comment
commentRouter.post('/:commentId/replies', validateReplyToComment, controller.replyToCommentHandler);

// PATCH /comments/:commentId/resolve - Resolve a comment
commentRouter.patch('/:commentId/resolve', validateCommentId, controller.resolveCommentHandler);

// DELETE /comments/:commentId - Delete a comment
commentRouter.delete('/:commentId', validateCommentId, controller.deleteCommentHandler);
