import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import * as controller from '../controllers/commentController.js';

export const commentRouter = Router();

// Apply auth middleware to all comment routes
commentRouter.use(requireAuth);

// POST /comments - Create a new comment
commentRouter.post('/', controller.createCommentHandler);

// GET /comments/document/:documentId - List comments for a document
commentRouter.get('/document/:documentId', controller.getDocumentCommentsHandler);

// GET /comments/:commentId - Get a single comment
commentRouter.get('/:commentId', controller.getCommentByIdHandler);

// POST /comments/:commentId/replies - Reply to a comment
commentRouter.post('/:commentId/replies', controller.replyToCommentHandler);

// PATCH /comments/:commentId/resolve - Resolve a comment
commentRouter.patch('/:commentId/resolve', controller.resolveCommentHandler);

// DELETE /comments/:commentId - Delete a comment
commentRouter.delete('/:commentId', controller.deleteCommentHandler);
