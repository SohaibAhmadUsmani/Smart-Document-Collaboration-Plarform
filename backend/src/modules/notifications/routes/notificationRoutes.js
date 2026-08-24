import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from '../controllers/notificationController.js';

export const notificationRouter = Router();

// Apply auth middleware to all notification routes
notificationRouter.use(requireAuth);

// GET /notifications - Get all notifications for the authenticated user
notificationRouter.get('/', controller.getUserNotificationsHandler);

// GET /notifications/unread - Get unread notifications
notificationRouter.get('/unread', controller.getUnreadNotificationsHandler);

// PATCH /notifications/read-all - Mark all notifications as read
notificationRouter.patch('/read-all', controller.markAllNotificationsAsReadHandler);

// PATCH /notifications/:notificationId/read - Mark a single notification as read
notificationRouter.patch('/:notificationId/read', controller.markNotificationAsReadHandler);

// DELETE /notifications/:notificationId - Delete a notification
notificationRouter.delete('/:notificationId', controller.deleteNotificationHandler);
