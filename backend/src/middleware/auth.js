import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Authentication Middleware (Maira's Module Contract).
 * Validates JWT Bearer tokens.
 * In development only (NODE_ENV=development), requests without a valid token
 * fall back to a seeded test user so teammates can keep testing without logging in.
 * In production, a valid token is always required — no fallback.
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies?.token;

    if (token && env.jwtSecret) {
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
        if (env.nodeEnv !== 'development') {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired session token'
          });
        }
        console.warn('[Auth Notice]: Invalid session token in dev mode, using fallback user:', tokenErr.message);
      }
    }

    if (!req.user) {
      if (env.nodeEnv === 'development') {
        // Development-only fallback — matches seeded User in seedDatabase.js
        req.user = {
          id: '66cc00000000000000000004',
          _id: '66cc00000000000000000004',
          name: 'Muzammil (Document Editor Lead)',
          email: 'muzammil@docplatform.local',
          role: 'owner'
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required'
      });
    }

    next();
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