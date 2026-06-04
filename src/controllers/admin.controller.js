import { Article } from '../models/Article.js';
import { User } from '../models/User.js';
import { isValidObjectId, isValidRole } from '../utils/validation.js';

export async function getUsers(_request, response, next) {
  try {
    const users = await User.find().select('-password');
    response.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(request, response, next) {
  try {
    const { role } = request.body;

    if (!isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: 'Invalid user id' });
    }

    if (!isValidRole(role)) {
      return response.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      request.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(request, response, next) {
  try {
    if (!isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findByIdAndDelete(request.params.id);

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getOverview(_request, response, next) {
  try {
    const [totalUsers, totalAdmins, totalArticles, publishedArticles, draftArticles, recentUsers, recentArticles] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }),
      Article.countDocuments({ status: 'draft' }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Article.find().populate('author', 'name email role').sort({ createdAt: -1 }).limit(5)
    ]);

    response.json({
      overview: {
        users: {
          total: totalUsers,
          admins: totalAdmins
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: draftArticles
        }
      },
      recentUsers,
      recentArticles
    });
  } catch (error) {
    next(error);
  }
}