import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', authenticate, me);