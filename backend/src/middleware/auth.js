import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Authentication Middleware (Maira's Module Contract).
 * Validates JWT Bearer tokens. Requires a valid token — no dev fallback user.
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required'
      });
    }

    if (!env.jwtSecret) {
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'JWT secret is not configured'
      });
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = {
        id: decoded.id || decoded._id || decoded.userId,
        _id: decoded.id || decoded._id || decoded.userId,
        email: decoded.email,
        role: decoded.role || 'viewer',
        name: decoded.name || 'User'
      };
      return next();
    } catch (tokenErr) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired session token'
      });
    }
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Authentication required' });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'Insufficient privileges' });
    }
    next();
  };
}