import { Router } from 'express';
import {
  changePassword,
  getMe,
  getSavedArticles,
  toggleSavedArticle,
  updateMe
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const userRoutes = Router();

userRoutes.get('/me', authenticate, getMe);
userRoutes.patch('/me', authenticate, updateMe);
userRoutes.patch('/me/password', authenticate, changePassword);
userRoutes.get('/me/saved', authenticate, getSavedArticles);
userRoutes.patch('/me/saved/:articleId', authenticate, toggleSavedArticle);