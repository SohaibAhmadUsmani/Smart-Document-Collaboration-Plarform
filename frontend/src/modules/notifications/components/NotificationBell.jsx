import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { NotificationPanel } from './NotificationPanel.jsx';

/**
 * Self-contained notification bell with dropdown panel.
 * Owns the single useNotifications() instance shared with NotificationPanel.
 *
 * @param {Object} props
 * @param {Function} [props.onNavigateToDocument] - Called with (documentId, commentId?) for navigation
 */
export function NotificationBell({ onNavigateToDocument }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isMarkingAllRead,
    deletingNotificationId,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        error={error}
        isMarkingAllRead={isMarkingAllRead}
        deletingNotificationId={deletingNotificationId}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
        onNavigateToDocument={onNavigateToDocument}
      />
    </div>
  );
}
