import { Router } from 'express';
import { deleteUser, getOverview, getUsers, updateUserRole } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { roles } from '../constants/roles.js';

export const adminRoutes = Router();

adminRoutes.use(authenticate, requireRole(roles.ADMIN));

adminRoutes.get('/stats', getOverview);
adminRoutes.get('/users', getUsers);
adminRoutes.patch('/users/:id/role', updateUserRole);
adminRoutes.delete('/users/:id', deleteUser);