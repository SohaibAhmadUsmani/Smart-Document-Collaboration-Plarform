import React, { useEffect, useRef } from 'react';
import { CheckCheck } from 'lucide-react';
import { NotificationList } from './NotificationList.jsx';

/**
 * Dropdown panel displaying notifications with mark-all-as-read.
 * All notification state and actions are received via props from NotificationBell.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is visible
 * @param {Function} props.onClose - Called when panel should close
 * @param {Array} props.notifications - Notification list from useNotifications
 * @param {number} props.unreadCount - Unread count from useNotifications
 * @param {boolean} props.isLoading - Loading state from useNotifications
 * @param {string|null} props.error - Error state from useNotifications
 * @param {boolean} props.isMarkingAllRead - Mark-all-read loading state
 * @param {string|null} props.deletingNotificationId - ID of notification being deleted
 * @param {Function} props.onMarkAsRead - Mark single notification as read
 * @param {Function} props.onMarkAllAsRead - Mark all notifications as read
 * @param {Function} props.onDelete - Delete a notification
 * @param {Function} [props.onNavigateToDocument] - Called with (documentId, commentId?) for navigation
 */
export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  error,
  isMarkingAllRead,
  deletingNotificationId,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigateToDocument,
}) {
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900">Notifications</span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="text-[10px] text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCheck className="w-3 h-3" />
            {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-3 mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {/* Notification list */}
      <div className="p-2">
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          deletingNotificationId={deletingNotificationId}
          onNavigateToDocument={onNavigateToDocument}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
