import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  apiGetNotifications,
  apiGetUnreadNotifications,
  apiMarkNotificationAsRead,
  apiMarkAllNotificationsAsRead,
  apiDeleteNotification,
} from '../services/notificationApi.js';

/**
 * Hook for managing user notifications.
 *
 * Provides state and operations for fetching, marking read, and deleting
 * notifications. Auto-fetches on mount and maintains unread count locally.
 *
 * @returns {Object} Notifications state and operations.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);

  // Track in-flight requests to avoid stale setState on unmount.
  const fetchIdRef = useRef(0);

  // Derived unread count from unreadNotifications length.
  const unreadCount = useMemo(() => unreadNotifications.length, [unreadNotifications]);

  /**
   * Fetch all notifications for the current user.
   */
  const fetchNotifications = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGetNotifications();
      if (fetchIdRef.current === currentFetchId) {
        const list = Array.isArray(data) ? data : [];
        setNotifications(list);
        setUnreadNotifications(list.filter((n) => !n.read));
      }
    } catch (err) {
      if (fetchIdRef.current === currentFetchId) {
        setError(err.message || 'Failed to load notifications');
      }
    } finally {
      if (fetchIdRef.current === currentFetchId) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Fetch only unread notifications for the current user.
   */
  const fetchUnreadNotifications = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setError(null);

    try {
      const data = await apiGetUnreadNotifications();
      if (fetchIdRef.current === currentFetchId) {
        setUnreadNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (fetchIdRef.current === currentFetchId) {
        setError(err.message || 'Failed to load unread notifications');
      }
    }
  }, []);

  // Auto-fetch on mount.
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Mark a single notification as read.
   * Updates both notifications and unreadNotifications locally.
   *
   * @param {string} notificationId
   * @returns {Promise<Object|null>} Updated notification or null on failure.
   */
  const markAsRead = useCallback(async (notificationId) => {
    setMarkingReadId(notificationId);
    setError(null);

    try {
      const updated = await apiMarkNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
      return null;
    } finally {
      setMarkingReadId(null);
    }
  }, []);

  /**
   * Mark all unread notifications as read.
   * Updates all local notifications to read state.
   *
   * @returns {Promise<Object|null>} Result or null on failure.
   */
  const markAllAsRead = useCallback(async () => {
    setIsMarkingAllRead(true);
    setError(null);

    try {
      const result = await apiMarkAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications([]);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
      return null;
    } finally {
      setIsMarkingAllRead(false);
    }
  }, []);

  /**
   * Delete a notification. Removes it from all local state.
   *
   * @param {string} notificationId
   * @returns {Promise<boolean>} True on success.
   */
  const deleteNotification = useCallback(async (notificationId) => {
    setDeletingNotificationId(notificationId);
    setError(null);

    try {
      await apiDeleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
      return false;
    } finally {
      setDeletingNotificationId(null);
    }
  }, []);

  /**
   * Force refresh all notifications from the server.
   */
  const refreshNotifications = useCallback(
    () => fetchNotifications(),
    [fetchNotifications]
  );

  return {
    // Data
    notifications,
    unreadNotifications,
    unreadCount,

    // Loading states
    isLoading,
    markingReadId,
    isMarkingAllRead,
    deletingNotificationId,

    // Error
    error,

    // Operations
    fetchNotifications,
    fetchUnreadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
