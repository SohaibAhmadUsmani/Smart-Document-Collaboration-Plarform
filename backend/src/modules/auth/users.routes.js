import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getMyProfile, updateMyProfile, searchUsers } from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', getMyProfile);
usersRouter.patch('/me', updateMyProfile);
usersRouter.get('/', searchUsers);