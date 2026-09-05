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
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired session token'
        });
      }
    }

    // DEV_FAKE_AUTH fallback: In development, if no token provided and DEV_FAKE_AUTH is enabled,
    // inject a mock dev user so teammates can test without logging in.
    // [ROMAN URDU]: Development mein agar token nahi hai aur DEV_FAKE_AUTH enabled hai toh mock user inject karo.
    if (!req.user && process.env.NODE_ENV !== 'production' && process.env.DEV_FAKE_AUTH === 'true') {
      const fakeUserId = process.env.DEV_FAKE_USER_ID || '000000000000000000000001';
      req.user = {
        id: fakeUserId,
        _id: fakeUserId,
        email: 'dev@docsync.pro',
        role: 'owner',
        name: 'Dev User',
      };
      return next();
    }

    if (!req.user) {
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