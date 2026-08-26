# Notifications Module

Owner: Ayyan

Frontend module for user notifications (mentions, comments, replies, etc.).

## Structure

```
notifications/
├── components/     # React UI components (dropdown, list, item)
├── hooks/          # Custom hooks (useNotifications, useUnreadCount)
├── services/       # API service functions (notificationApi.js)
├── types/          # Type definitions and constants (notification.js)
└── README.md
```

## Hook: useNotifications

`hooks/useNotifications.js` manages notification state for the current user.

```js
const {
  notifications,         // All notifications for the user
  unreadNotifications,   // Only unread notifications
  unreadCount,           // Derived count of unread notifications

  isLoading,             // Fetching all notifications
  markingReadId,         // ID of notification being marked read (or null)
  isMarkingAllRead,      // Marking all as read in progress
  deletingNotificationId,// ID of notification being deleted (or null)
  error,                 // Last error message (or null)

  fetchNotifications,        // () => Promise<void>
  fetchUnreadNotifications,  // () => Promise<void>
  refreshNotifications,      // () => Promise<void>
  markAsRead,                // (notificationId) => Promise<Object|null>
  markAllAsRead,             // () => Promise<Object|null>
  deleteNotification,        // (notificationId) => Promise<boolean>
} = useNotifications();
```

### State Behavior

- **Auto-fetch**: Notifications load automatically on mount.
- **Unread count**: Derived from `unreadNotifications` length, kept in sync after mutations.
- **markAsRead**: Updates the notification to `read: true` in `notifications`, removes it from `unreadNotifications`.
- **markAllAsRead**: Sets all notifications to `read: true`, clears `unreadNotifications`.
- **deleteNotification**: Removes from both `notifications` and `unreadNotifications`.
- **No unnecessary refetches**: Local state is updated after mutations without re-fetching the full list.

### User Isolation

The backend handles user-scoped authorization via JWT. This hook only consumes the current user's endpoints — no client-side filtering is needed.

## API Service

`services/notificationApi.js` provides functions to interact with backend endpoints:

- `apiGetNotifications()` — GET /api/notifications
- `apiGetUnreadNotifications()` — GET /api/notifications/unread
- `apiMarkNotificationAsRead(notificationId)` — PATCH /api/notifications/:notificationId/read
- `apiMarkAllNotificationsAsRead()` — PATCH /api/notifications/read-all
- `apiDeleteNotification(notificationId)` — DELETE /api/notifications/:notificationId

## Backend

See: `backend/src/modules/notifications/`
