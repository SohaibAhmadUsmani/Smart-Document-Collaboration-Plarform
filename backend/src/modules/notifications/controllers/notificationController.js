import mongoose from 'mongoose';
import * as notificationService from '../services/notificationService.js';

function getUserId(req) {
  return req.user?.id || req.user?._id || 'anonymous-user';
}

/**
 * GET /notifications
 * Get all notifications for the authenticated user.
 */
export async function getUserNotificationsHandler(req, res, next) {
  try {
    if (mongoose.connection?.readyState !== 1) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    const userId = getUserId(req);
    const notifications = await notificationService.getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /notifications/unread
 * Get unread notifications for the authenticated user.
 */
export async function getUnreadNotificationsHandler(req, res, next) {
  try {
    if (mongoose.connection?.readyState !== 1) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    const userId = getUserId(req);
    const notifications = await notificationService.getUnreadNotifications(userId);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/:notificationId/read
 * Mark a single notification as read.
 */
export async function markNotificationAsReadHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const { notificationId } = req.params;
    const notification = await notificationService.markNotificationAsRead(notificationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/read-all
 * Mark all unread notifications as read.
 */
export async function markAllNotificationsAsReadHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const result = await notificationService.markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /notifications/:notificationId
 * Delete a notification.
 */
export async function deleteNotificationHandler(req, res, next) {
  try {
    const userId = getUserId(req);
    const { notificationId } = req.params;
    const result = await notificationService.deleteNotification(notificationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export const notificationController = {
  getUserNotificationsHandler,
  getUnreadNotificationsHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
  deleteNotificationHandler,
};
