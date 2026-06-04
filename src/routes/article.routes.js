import { Router } from 'express';
import {
  createArticle,
  deleteArticle,
  getArticleById,
  getArticles,
  updateArticle
} from '../controllers/article.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { roles } from '../constants/roles.js';

export const articleRoutes = Router();

articleRoutes.get('/', getArticles);
articleRoutes.get('/:id', getArticleById);
articleRoutes.post('/', authenticate, requireRole(roles.ADMIN, roles.USER), createArticle);
articleRoutes.patch('/:id', authenticate, requireRole(roles.ADMIN), updateArticle);
articleRoutes.delete('/:id', authenticate, requireRole(roles.ADMIN), deleteArticle);