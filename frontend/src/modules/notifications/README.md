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

## API Service

`services/notificationApi.js` provides functions to interact with backend endpoints:

- `apiGetNotifications()` — GET /api/notifications
- `apiGetUnreadNotifications()` — GET /api/notifications/unread
- `apiMarkNotificationAsRead(notificationId)` — PATCH /api/notifications/:notificationId/read
- `apiMarkAllNotificationsAsRead()` — PATCH /api/notifications/read-all
- `apiDeleteNotification(notificationId)` — DELETE /api/notifications/:notificationId

## Backend

See: `backend/src/modules/notifications/`
