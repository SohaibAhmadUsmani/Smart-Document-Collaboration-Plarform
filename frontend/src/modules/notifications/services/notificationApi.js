/**
 * Notification API Service
 *
 * API functions for the backend Notifications endpoints.
 * Follows the same fetch pattern as editor/services/documentApi.js.
 */

const API_BASE = '/api/notifications';

/**
 * Get auth headers from localStorage/sessionStorage.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch wrapper with auth and error handling.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) {
      return { ok: false, status: response.status, data: null };
    }

    const json = await response.json();
    return { ok: response.ok, status: response.status, data: json.data ?? json };
  } catch (networkError) {
    return { ok: false, status: 0, data: null, error: networkError.message };
  }
}

/**
 * Get all notifications for the current user.
 * @returns {Promise<Array>}
 */
export async function apiGetNotifications() {
  const res = await safeFetch(API_BASE, { method: 'GET' });
  return res.data || [];
}

/**
 * Get unread notifications for the current user.
 * @returns {Promise<Array>}
 */
export async function apiGetUnreadNotifications() {
  const res = await safeFetch(`${API_BASE}/unread`, { method: 'GET' });
  return res.data || [];
}

/**
 * Mark a single notification as read.
 * @param {string} notificationId
 * @returns {Promise<Object>}
 */
export async function apiMarkNotificationAsRead(notificationId) {
  const res = await safeFetch(`${API_BASE}/${notificationId}/read`, {
    method: 'PATCH',
  });
  return res.data;
}

/**
 * Mark all unread notifications as read.
 * @returns {Promise<Object>}
 */
export async function apiMarkAllNotificationsAsRead() {
  const res = await safeFetch(`${API_BASE}/read-all`, { method: 'PATCH' });
  return res.data;
}

/**
 * Delete a notification.
 * @param {string} notificationId
 * @returns {Promise<boolean>}
 */
export async function apiDeleteNotification(notificationId) {
  const res = await safeFetch(`${API_BASE}/${notificationId}`, { method: 'DELETE' });
  return res.ok;
}
