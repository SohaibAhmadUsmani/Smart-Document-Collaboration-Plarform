import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

/**
 * Global Express Error Handling Middleware.
 * Captures all unhandled errors, formats the error response, and preserves
 * the appropriate HTTP status code from `error.status` or `error.statusCode`.
 */
export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  // Handle Multer upload errors
  if (error.name === 'MulterError') {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return response.status(status).json({
      success: false,
      error: error.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds allowed limit (5MB max)' : error.message,
    });
  }

  // Handle JWT errors if passed to next()
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return response.status(401).json({
      success: false,
      error: 'Invalid or expired session token',
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    return response.status(400).json({
      success: false,
      error: `Invalid resource identifier format: ${error.path}`,
    });
  }

  // Handle MongoDB / Mongoose connection, timeout, and server selection errors gracefully
  if (
    error.name === 'MongoServerSelectionError' ||
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoNetworkTimeoutError' ||
    error.name === 'MongoTimeoutError' ||
    error.name === 'MongoTopologyClosedError' ||
    (error.name === 'MongooseError' &&
      (error.message?.includes('buffering') ||
        error.message?.includes('bufferCommands') ||
        error.message?.includes('disconnected') ||
        error.message?.includes('timed out')))
  ) {
    console.warn(`[Database Notice]: Transient database connectivity issue (${error.name}: ${error.message}). Returning 503.`);
    response.set('Retry-After', '3');
    return response.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is temporarily reconnecting or unreachable. Please try again in a few seconds.',
      retryAfter: 3,
    });
  }

  const status = error.status ?? error.statusCode ?? 500;
  if (status === 500) {
    console.error('[Unhandled Error]:', error);
  }

  response.status(status).json({
    success: false,
    error: status === 500 ? 'Internal Server Error' : (error.message || 'Internal Server Error'),
  });
}
