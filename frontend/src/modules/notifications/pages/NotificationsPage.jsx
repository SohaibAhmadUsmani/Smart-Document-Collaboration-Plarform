import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw, Trash2, ArrowLeft, Filter } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { NotificationItem } from '../components/NotificationItem.jsx';
import { SmartBackButton } from '../../../components/SmartBackButton.jsx';

/**
 * NotificationsPage Component.
 * Dedicated page for viewing, filtering, marking, and managing all user notifications.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    markingReadId,
    isMarkingAllRead,
    deletingNotificationId,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const displayedNotifications = filter === 'unread' ? unreadNotifications : notifications;

  const handleNavigateToDocument = (documentId) => {
    if (documentId) {
      navigate(`/editor/${documentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SmartBackButton
            fallbackPath="/dashboard"
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Go Back"
          />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Notifications</h1>
              <p className="text-xs text-slate-400">Manage your alerts and activity updates</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={isMarkingAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshNotifications}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900/40 p-3 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading && displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Loading notifications...</span>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {filter === 'unread'
                ? 'You have caught up with all your unread notifications.'
                : 'When someone shares a document, mentions you, or comments, you will see it here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedNotifications.map((notification) => (
              <div
                key={notification._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  isDeleting={deletingNotificationId === notification._id}
                  onNavigateToDocument={handleNavigateToDocument}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default NotificationsPage;
