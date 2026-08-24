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

async function findDocumentOrThrow(documentId) {
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
  const document = await findDocumentOrThrow(documentId);
  await assertCommentPermission(userId, document);

  if (parentComment) {
    const parent = await Comment.findOne({ _id: parentComment, document: documentId })
      .select('_id')
      .lean()
      .exec();

    if (!parent) {
      throw new AppError('Parent comment not found or does not belong to this document', 404);
    }
  }

  const comment = new Comment({
    author: userId,
    document: documentId,
    body,
    anchorType,
    from,
    to,
    exactQuote: exactQuote || '',
    prefixContext: prefixContext || '',
    suffixContext: suffixContext || '',
    blockId: blockId || null,
    mentions: Array.isArray(mentions) ? mentions : [],
    parentComment: parentComment || null,
  });

  const saved = await comment.save();

  // Create mention notifications after comment is saved (non-blocking)
  try {
    const mentionIds = Array.isArray(mentions) ? mentions : [];
    if (mentionIds.length > 0) {
      await notificationService.createMentionNotifications({
        commentId: saved._id,
        senderId: userId,
        mentionedUserIds: mentionIds,
        documentId,
        workspaceId: document.workspaceId,
      });
    }
  } catch (err) {
    console.error('Failed to create mention notifications:', err);
  }

  return saved.populate([AUTHOR_POPULATE, MENTIONS_POPULATE]);
}

export async function getDocumentComments(documentId) {
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

  comment.resolved = true;
  const saved = await comment.save();

  return saved.populate([AUTHOR_POPULATE, MENTIONS_POPULATE]);
}

export async function deleteComment({ commentId, userId }) {
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
