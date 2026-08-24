import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { AppError } from '../../workspaces/utils/AppError.js';

const USER_POPULATE = {
  path: 'sender',
  select: 'name email',
};

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
 * Get all notifications for a user, sorted newest first.
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} Notifications with populated sender
 */
export async function getUserNotifications(userId) {
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
  const notifications = await Notification.find({ recipient: userId, read: false })
    .populate(USER_POPULATE)
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return notifications;
}

/**
 * Mark a single notification as read. Only the recipient can mark their own notification.
 *
 * @param {string} notificationId - The notification to update
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Updated notification
 * @throws {AppError} 404 if notification not found or not belonging to user
 */
export async function markNotificationAsRead(notificationId, userId) {
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
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Count of updated notifications
 */
export async function markAllNotificationsAsRead(userId) {
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
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  }).exec();

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return { deleted: true };
}

export const notificationService = {
  createMentionNotifications,
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
