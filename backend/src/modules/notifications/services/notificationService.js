import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

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

export const notificationService = {
  createMentionNotifications,
};
