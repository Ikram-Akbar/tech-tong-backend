import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function authenticate(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return response.status(401).json({ message: 'Invalid token user' });
    }

    request.user = user;
    next();
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}