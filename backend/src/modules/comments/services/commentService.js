import mongoose from 'mongoose';
import { Comment } from '../models/Comment.js';
import { DocumentModel } from '../../documents/document.model.js';
import { AppError } from '../../workspaces/utils/AppError.js';
import { permissionService } from '../../workspaces/services/permissionService.js';
import { notificationService } from '../../notifications/services/notificationService.js';

const AUTHOR_POPULATE = {
  path: 'author',
  select: 'name email',
};

const MENTIONS_POPULATE = {
  path: 'mentions',
  select: 'name email',
};

const VALID_ANCHOR_TYPES = ['text_selection', 'block_node'];

/**
 * Validates that a value is a valid MongoDB ObjectId.
 */
function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

/**
 * Sanitize and deduplicate mentions array.
 * - Removes duplicates
 * - Removes the comment author from mentions (no self-notifications)
 */
function sanitizeMentions(mentions, authorId) {
  if (!Array.isArray(mentions)) {
    return [];
  }

  const unique = [...new Set(mentions.map((id) => String(id)))];
  return unique.filter((id) => id !== String(authorId));
}

/**
 * Validate core comment fields at the service level.
 * Middleware handles route-level checks; this is a safety net.
 */
function validateCommentFields({ body, anchorType, from, to }) {
  if (!body || typeof body !== 'string' || !body.trim()) {
    throw new AppError('Comment body is required and cannot be empty', 400);
  }

  if (!anchorType || !VALID_ANCHOR_TYPES.includes(anchorType)) {
    throw new AppError(`anchorType must be one of: ${VALID_ANCHOR_TYPES.join(', ')}`, 400);
  }

  if (typeof from !== 'number' || Number.isNaN(from) || from < 0) {
    throw new AppError('from must be a non-negative number', 400);
  }

  if (typeof to !== 'number' || Number.isNaN(to) || to < from) {
    throw new AppError('to must be a number greater than or equal to from', 400);
  }
}

async function findDocumentOrThrow(documentId) {
  if (!isValidObjectId(documentId)) {
    throw new AppError('Invalid document ID format', 400);
  }

  const document = await DocumentModel.findOne({ _id: documentId, isArchived: false })
    .select('workspaceId createdBy')
    .lean()
    .exec();

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  return document;
}

async function assertCommentPermission(userId, document) {
  try {
    await permissionService.assertPermission(userId, document.workspaceId, 'comment');
  } catch {
    throw new AppError('You do not have permission to comment on this document', 403);
  }
}

async function assertManagePermission(userId, document) {
  const isCreator = String(document.createdBy) === String(userId);
  if (isCreator) return;

  try {
    const role = await permissionService.getUserRole(userId, document.workspaceId);
    const canManage =
      role === permissionService.WORKSPACE_ROLES.OWNER ||
      role === permissionService.WORKSPACE_ROLES.EDITOR;
    if (!canManage) {
      throw new Error();
    }
  } catch {
    throw new AppError('You do not have permission to perform this action', 403);
  }
}

export async function createComment({
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
}) {
  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const document = await findDocumentOrThrow(documentId);
  await assertCommentPermission(userId, document);

  validateCommentFields({ body, anchorType, from, to });

  if (parentComment) {
    if (!isValidObjectId(parentComment)) {
      throw new AppError('Invalid parent comment ID format', 400);
    }

    const parent = await Comment.findOne({ _id: parentComment, document: documentId })
      .select('_id')
      .lean()
      .exec();

    if (!parent) {
      throw new AppError('Parent comment not found or does not belong to this document', 404);
    }
  }

  const cleanMentions = sanitizeMentions(mentions, userId);

  const comment = new Comment({
    author: userId,
    document: documentId,
    body: body.trim(),
    anchorType,
    from,
    to,
    exactQuote: exactQuote || '',
    prefixContext: prefixContext || '',
    suffixContext: suffixContext || '',
    blockId: blockId || null,
    mentions: cleanMentions,
    parentComment: parentComment || null,
  });

  const saved = await comment.save();

  // Create mention notifications after comment is saved (non-blocking)
  if (cleanMentions.length > 0) {
    try {
      await notificationService.createMentionNotifications({
        commentId: saved._id,
        senderId: userId,
        mentionedUserIds: cleanMentions,
        documentId,
        workspaceId: document.workspaceId,
      });
    } catch (err) {
      console.error('Failed to create mention notifications:', err);
    }
  }

  return saved.populate([AUTHOR_POPULATE, MENTIONS_POPULATE]);
}

export async function getDocumentComments(documentId) {
  if (!isValidObjectId(documentId)) {
    throw new AppError('Invalid document ID format', 400);
  }

  await findDocumentOrThrow(documentId);

  const comments = await Comment.find({ document: documentId })
    .populate(AUTHOR_POPULATE)
    .populate(MENTIONS_POPULATE)
    .sort({ createdAt: 1 })
    .lean()
    .exec();

  return comments;
}

export async function getCommentById(commentId) {
  if (!isValidObjectId(commentId)) {
    throw new AppError('Invalid comment ID format', 400);
  }

  const comment = await Comment.findById(commentId)
    .populate(AUTHOR_POPULATE)
    .populate(MENTIONS_POPULATE)
    .lean()
    .exec();

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  return comment;
}

export async function replyToComment({
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
}) {
  if (!isValidObjectId(commentId)) {
    throw new AppError('Invalid comment ID format', 400);
  }

  if (!isValidObjectId(documentId)) {
    throw new AppError('Invalid document ID format', 400);
  }

  const parent = await Comment.findOne({ _id: commentId, document: documentId })
    .select('_id')
    .lean()
    .exec();

  if (!parent) {
    throw new AppError('Parent comment not found or does not belong to this document', 404);
  }

  return createComment({
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
    parentComment: commentId,
  });
}

export async function resolveComment({ commentId, userId }) {
  if (!isValidObjectId(commentId)) {
    throw new AppError('Invalid comment ID format', 400);
  }

  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const comment = await Comment.findById(commentId)
    .select('document author resolved')
    .exec();

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const document = await findDocumentOrThrow(comment.document);
  const isAuthor = String(comment.author) === String(userId);

  if (!isAuthor) {
    await assertManagePermission(userId, document);
  }

  // Idempotent: if already resolved, return current state
  if (comment.resolved) {
    return comment.populate([AUTHOR_POPULATE, MENTIONS_POPULATE]);
  }

  comment.resolved = true;
  const saved = await comment.save();

  return saved.populate([AUTHOR_POPULATE, MENTIONS_POPULATE]);
}

export async function deleteComment({ commentId, userId }) {
  if (!isValidObjectId(commentId)) {
    throw new AppError('Invalid comment ID format', 400);
  }

  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const comment = await Comment.findById(commentId)
    .select('document author')
    .exec();

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const document = await findDocumentOrThrow(comment.document);
  const isAuthor = String(comment.author) === String(userId);

  if (!isAuthor) {
    await assertManagePermission(userId, document);
  }

  await Comment.findByIdAndDelete(commentId).exec();

  return { deleted: true };
}

export const commentService = {
  createComment,
  getDocumentComments,
  getCommentById,
  replyToComment,
  resolveComment,
  deleteComment,
};
