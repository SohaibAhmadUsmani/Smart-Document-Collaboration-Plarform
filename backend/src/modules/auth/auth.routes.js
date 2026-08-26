import { Router } from 'express';
import { signup, login, logout, verifyEmail } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/verify-email/:token', verifyEmail);