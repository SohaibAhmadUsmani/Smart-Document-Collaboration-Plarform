import React from 'react';
import { MessageSquare, Reply, AtSign, Share2, Shield, FileText, Trash2 } from 'lucide-react';

const TYPE_CONFIG = {
  mention: { icon: AtSign, label: 'mentioned you', color: 'text-blue-600' },
  comment: { icon: MessageSquare, label: 'commented', color: 'text-amber-600' },
  reply: { icon: Reply, label: 'replied to your comment', color: 'text-emerald-600' },
  share: { icon: Share2, label: 'shared a document', color: 'text-purple-600' },
  permission_change: { icon: Shield, label: 'changed permissions', color: 'text-orange-600' },
  document_update: { icon: FileText, label: 'updated a document', color: 'text-slate-600' },
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

/**
 * Extract document ID from notification (handles both string and populated object).
 */
function getDocumentId(notification) {
  const doc = notification.document;
  if (!doc) return null;
  if (typeof doc === 'string') return doc;
  if (typeof doc === 'object' && (doc._id || doc.id)) return doc._id || doc.id;
  return null;
}

/**
 * Extract comment ID from notification (handles both string and populated object).
 */
function getCommentId(notification) {
  const cmt = notification.comment;
  if (!cmt) return null;
  if (typeof cmt === 'string') return cmt;
  if (typeof cmt === 'object' && (cmt._id || cmt.id)) return cmt._id || cmt.id;
  return null;
}

/**
 * Single notification item.
 *
 * @param {Object} props
 * @param {Object} props.notification - Notification data from API
 * @param {Function} props.onMarkAsRead - Called with notificationId when clicked
 * @param {Function} props.onDelete - Called with notificationId when delete is clicked
 * @param {boolean} [props.isDeleting] - Whether delete is in progress
 * @param {Function} [props.onNavigateToDocument] - Called with (documentId, commentId?) for navigation
 * @param {Function} [props.onClose] - Called to close the notification panel
 */
export function NotificationItem({ notification, onMarkAsRead, onDelete, isDeleting, onNavigateToDocument, onClose }) {
  if (!notification) return null;

  const sender =
    notification.sender && typeof notification.sender === 'object'
      ? notification.sender
      : null;
  const senderName = sender?.name || 'Someone';
  const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.document_update;
  const TypeIcon = typeConfig.icon;
  const isUnread = !notification.read;

  const handleClick = () => {
    // Mark as read if unread
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate to the related document/comment
    const docId = getDocumentId(notification);
    if (docId && onNavigateToDocument) {
      const commentId = getCommentId(notification);
      onNavigateToDocument(docId, commentId || undefined);
    }

    // Close the panel after navigation
    if (onClose) {
      onClose();
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification._id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isUnread
          ? 'bg-blue-50/60 hover:bg-blue-50'
          : 'hover:bg-slate-50'
      }`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${typeConfig.color}`}>
        <TypeIcon className="w-4 h-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-800 leading-relaxed">
          <span className="font-semibold">{senderName}</span>{' '}
          <span className="text-slate-600">{typeConfig.label}</span>
        </p>
        {notification.document && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            Document: {typeof notification.document === 'object' ? notification.document.title || 'Untitled' : 'Related document'}
          </p>
        )}
        <time className="text-[10px] text-slate-400 font-mono mt-1 block">
          {formatTimeAgo(notification.createdAt)}
        </time>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1">
        {isUnread && (
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
          title="Delete notification"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
