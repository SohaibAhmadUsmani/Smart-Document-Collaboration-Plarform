import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { AppError } from '../../workspaces/utils/AppError.js';

const USER_POPULATE = {
  path: 'sender',
  select: 'name email',
};

/**
 * Validates that a value is a valid MongoDB ObjectId.
 */
function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

/**
 * Create mention notifications for all mentioned users in a comment.
 *
 * @param {Object} params
 * @param {string} params.commentId - The saved Comment ObjectId
 * @param {string} params.senderId - The comment author User ObjectId
 * @param {string[]} params.mentionedUserIds - Array of mentioned User ObjectIds
 * @param {string} params.documentId - The Document ObjectId
 * @param {string} params.workspaceId - The Workspace ID (string from Document.workspaceId)
 */
export async function createMentionNotifications({
  commentId,
  senderId,
  mentionedUserIds,
  documentId,
  workspaceId,
}) {
  if (!Array.isArray(mentionedUserIds) || mentionedUserIds.length === 0) {
    return;
  }

  // Deduplicate and filter out the sender (no self-notifications)
  const uniqueRecipients = [
    ...new Set(
      mentionedUserIds
        .filter((id) => id != null)
        .map((id) => String(id))
    ),
  ].filter((id) => id !== String(senderId));

  if (uniqueRecipients.length === 0) {
    return;
  }

  // Validate all IDs before proceeding
  if (!isValidObjectId(commentId) || !isValidObjectId(senderId) || !isValidObjectId(documentId)) {
    throw new AppError('Invalid ID provided for notification creation', 400);
  }

  if (!workspaceId || !isValidObjectId(String(workspaceId))) {
    throw new AppError('Invalid workspace ID provided for notification creation', 400);
  }

  // Convert workspaceId string to ObjectId for the Notification schema
  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

  const notifications = uniqueRecipients.map((recipientId) => ({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: new mongoose.Types.ObjectId(senderId),
    type: 'mention',
    document: new mongoose.Types.ObjectId(documentId),
    comment: new mongoose.Types.ObjectId(commentId),
    workspace: workspaceObjectId,
    read: false,
  }));

  await Notification.insertMany(notifications, { ordered: false });
}

/**
 * Create a comment notification for the document owner.
 * Sent when someone creates a top-level comment on a document they don't own.
 *
 * @param {Object} params
 * @param {string} params.commentId - The saved Comment ObjectId
 * @param {string} params.senderId - The comment author User ObjectId
 * @param {string} params.recipientId - The document owner User ObjectId
 * @param {string} params.documentId - The Document ObjectId
 * @param {string} params.workspaceId - The Workspace ID
 */
export async function createCommentNotification({
  commentId,
  senderId,
  recipientId,
  documentId,
  workspaceId,
}) {
  if (!isValidObjectId(commentId) || !isValidObjectId(senderId) || !isValidObjectId(documentId)) {
    throw new AppError('Invalid ID provided for notification creation', 400);
  }
  if (!isValidObjectId(recipientId)) {
    return;
  }
  if (!workspaceId || !isValidObjectId(String(workspaceId))) {
    throw new AppError('Invalid workspace ID provided for notification creation', 400);
  }

  // Don't notify yourself
  if (String(recipientId) === String(senderId)) {
    return;
  }

  await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: new mongoose.Types.ObjectId(senderId),
    type: 'comment',
    document: new mongoose.Types.ObjectId(documentId),
    comment: new mongoose.Types.ObjectId(commentId),
    workspace: new mongoose.Types.ObjectId(workspaceId),
    read: false,
  });
}

/**
 * Create a reply notification for the parent comment author.
 * Sent when someone replies to a comment they wrote.
 *
 * @param {Object} params
 * @param {string} params.commentId - The reply Comment ObjectId
 * @param {string} params.senderId - The reply author User ObjectId
 * @param {string} params.recipientId - The parent comment author User ObjectId
 * @param {string} params.documentId - The Document ObjectId
 * @param {string} params.workspaceId - The Workspace ID
 */
export async function createReplyNotification({
  commentId,
  senderId,
  recipientId,
  documentId,
  workspaceId,
}) {
  if (!isValidObjectId(commentId) || !isValidObjectId(senderId) || !isValidObjectId(documentId)) {
    throw new AppError('Invalid ID provided for notification creation', 400);
  }
  if (!isValidObjectId(recipientId)) {
    return;
  }
  if (!workspaceId || !isValidObjectId(String(workspaceId))) {
    throw new AppError('Invalid workspace ID provided for notification creation', 400);
  }

  // Don't notify yourself
  if (String(recipientId) === String(senderId)) {
    return;
  }

  await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: new mongoose.Types.ObjectId(senderId),
    type: 'reply',
    document: new mongoose.Types.ObjectId(documentId),
    comment: new mongoose.Types.ObjectId(commentId),
    workspace: new mongoose.Types.ObjectId(workspaceId),
    read: false,
  });
}

/**
 * Get all notifications for a user, sorted newest first.
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} Notifications with populated sender
 */
export async function getUserNotifications(userId) {
  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const notifications = await Notification.find({ recipient: userId })
    .populate(USER_POPULATE)
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return notifications;
}

/**
 * Get unread notifications for a user, sorted newest first.
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} Unread notifications with populated sender
 */
export async function getUnreadNotifications(userId) {
  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const notifications = await Notification.find({ recipient: userId, read: false })
    .populate(USER_POPULATE)
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return notifications;
}

/**
 * Mark a single notification as read. Only the recipient can mark their own notification.
 * Idempotent: if already read, returns the notification without error.
 *
 * @param {string} notificationId - The notification to update
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Updated notification
 * @throws {AppError} 404 if notification not found or not belonging to user
 */
export async function markNotificationAsRead(notificationId, userId) {
  if (!isValidObjectId(notificationId)) {
    throw new AppError('Invalid notification ID format', 400);
  }

  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  )
    .populate(USER_POPULATE)
    .lean()
    .exec();

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
}

/**
 * Mark all unread notifications for a user as read.
 * Safely handles zero unread notifications (returns modifiedCount: 0).
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Count of updated notifications
 */
export async function markAllNotificationsAsRead(userId) {
  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  ).exec();

  return { modifiedCount: result.modifiedCount };
}

/**
 * Delete a notification. Only the recipient can delete their own notification.
 *
 * @param {string} notificationId - The notification to delete
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {AppError} 404 if notification not found or not belonging to user
 */
export async function deleteNotification(notificationId, userId) {
  if (!isValidObjectId(notificationId)) {
    throw new AppError('Invalid notification ID format', 400);
  }

  if (!isValidObjectId(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  }).exec();

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return { deleted: true };
}

export async function createShareNotification({
  senderId,
  recipientId,
  documentId,
  workspaceId,
}) {
  if (!isValidObjectId(senderId) || !isValidObjectId(documentId)) {
    throw new AppError('Invalid ID provided for notification creation', 400);
  }
  if (!isValidObjectId(recipientId) || String(senderId) === String(recipientId)) {
    return null;
  }
  if (!workspaceId || !isValidObjectId(String(workspaceId))) {
    throw new AppError('Invalid workspace ID provided for notification creation', 400);
  }

  return await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: new mongoose.Types.ObjectId(senderId),
    type: 'share',
    document: new mongoose.Types.ObjectId(documentId),
    workspace: new mongoose.Types.ObjectId(workspaceId),
    read: false,
  });
}

export async function createPermissionChangeNotification({
  senderId,
  recipientId,
  documentId,
  workspaceId,
}) {
  if (!isValidObjectId(senderId) || !isValidObjectId(documentId)) {
    throw new AppError('Invalid ID provided for notification creation', 400);
  }
  if (!isValidObjectId(recipientId) || String(senderId) === String(recipientId)) {
    return null;
  }
  if (!workspaceId || !isValidObjectId(String(workspaceId))) {
    throw new AppError('Invalid workspace ID provided for notification creation', 400);
  }

  return await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: new mongoose.Types.ObjectId(senderId),
    type: 'permission_change',
    document: new mongoose.Types.ObjectId(documentId),
    workspace: new mongoose.Types.ObjectId(workspaceId),
    read: false,
  });
}

export async function createDocumentUpdateNotification({
  senderId,
  recipientIds,
  documentId,
  workspaceId,
}) {
  if (!isValidObjectId(senderId) || !isValidObjectId(documentId)) {
    throw new AppError('Invalid ID provided for notification creation', 400);
  }
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return;
  }
  const uniqueRecipients = [
    ...new Set(
      recipientIds.filter((id) => id != null && isValidObjectId(String(id))).map((id) => String(id))
    ),
  ].filter((id) => id !== String(senderId));

  if (uniqueRecipients.length === 0) return;

  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const notifications = uniqueRecipients.map((recipientId) => ({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: new mongoose.Types.ObjectId(senderId),
    type: 'document_update',
    document: new mongoose.Types.ObjectId(documentId),
    workspace: workspaceObjectId,
    read: false,
  }));

  await Notification.insertMany(notifications, { ordered: false });
}

export const notificationService = {
  createMentionNotifications,
  createCommentNotification,
  createReplyNotification,
  createShareNotification,
  createPermissionChangeNotification,
  createDocumentUpdateNotification,
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
