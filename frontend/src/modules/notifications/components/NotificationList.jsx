import React from 'react';
import { NotificationItem } from './NotificationItem.jsx';
import { Bell } from 'lucide-react';

/**
 * Renders a list of notifications or appropriate empty/loading states.
 *
 * @param {Object} props
 * @param {Array} props.notifications - Array of notification objects
 * @param {boolean} props.isLoading - Whether notifications are loading
 * @param {Function} props.onMarkAsRead - Called with notificationId
 * @param {Function} props.onDelete - Called with notificationId
 * @param {string|null} props.deletingNotificationId - ID of notification being deleted
 */
export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
  deletingNotificationId,
}) {
  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading notifications...</span>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Bell className="w-8 h-8 text-slate-300" />
        <span className="text-xs text-slate-400">No notifications yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-80 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          isDeleting={deletingNotificationId === notification._id}
        />
      ))}
    </div>
  );
}
