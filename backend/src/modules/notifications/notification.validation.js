import mongoose from 'mongoose';

/**
 * Validates that a value is a valid MongoDB ObjectId.
 */
function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

/**
 * Validates that the route param :notificationId is a valid ObjectId.
 */
export function validateNotificationId(req, res, next) {
  const { notificationId } = req.params;

  if (!notificationId || !isValidObjectId(notificationId)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid notification ID format: '${notificationId}'.`,
    });
  }

  next();
}
