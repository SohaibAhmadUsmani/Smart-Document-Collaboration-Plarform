/**
 * Notification Type Definitions
 *
 * Data shapes matching the backend Notification schema.
 * See: backend/src/modules/notifications/models/Notification.js
 */

/**
 * @typedef {'mention' | 'comment' | 'reply' | 'share' | 'permission_change' | 'document_update'} NotificationType
 */

/**
 * @typedef {Object} NotificationUser
 * @property {string} _id - User ID
 * @property {string} name - User display name
 * @property {string} email - User email
 */

/**
 * @typedef {Object} Notification
 * @property {string} _id - Notification ID
 * @property {string | NotificationUser} recipient - Populated user or user ID string
 * @property {string | NotificationUser} sender - Populated user or user ID string
 * @property {NotificationType} type - Notification type
 * @property {string | null} document - Document ID
 * @property {string | null} comment - Comment ID
 * @property {string} workspace - Workspace ID
 * @property {boolean} read - Whether notification has been read
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

export const NOTIFICATION_TYPES = {
  MENTION: 'mention',
  COMMENT: 'comment',
  REPLY: 'reply',
  SHARE: 'share',
  PERMISSION_CHANGE: 'permission_change',
  DOCUMENT_UPDATE: 'document_update',
};

export default NOTIFICATION_TYPES;
