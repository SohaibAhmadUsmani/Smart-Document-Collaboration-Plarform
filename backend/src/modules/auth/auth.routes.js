import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { signup, login, logout, verifyEmail, forgotPassword, resetPassword, changePassword } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.nodeEnv === 'production' ? 10 : 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

authRouter.post('/signup', authLimiter, signup);
authRouter.post('/login', authLimiter, login);
authRouter.post('/logout', logout);
authRouter.get('/verify-email/:token', verifyEmail);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password/:token', authLimiter, resetPassword);
authRouter.post('/change-password', requireAuth, changePassword);
authRouter.put('/password', requireAuth, changePassword);