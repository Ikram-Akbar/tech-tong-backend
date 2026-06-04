import { Article } from '../models/Article.js';
import { User } from '../models/User.js';
import { isNonEmptyString, isValidEmail, isValidObjectId } from '../utils/validation.js';

function buildUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    savedArticles: user.savedArticles
  };
}

export async function getMe(request, response) {
  response.json({ user: buildUserResponse(request.user) });
}

export async function updateMe(request, response, next) {
  try {
    const { name, email, avatarUrl } = request.body;
    const updates = {};
    const hasName = Object.prototype.hasOwnProperty.call(request.body, 'name');
    const hasEmail = Object.prototype.hasOwnProperty.call(request.body, 'email');
    const hasAvatarUrl = Object.prototype.hasOwnProperty.call(request.body, 'avatarUrl');

    if (!hasName && !hasEmail && !hasAvatarUrl) {
      return response.status(400).json({ message: 'At least one field is required' });
    }

    if (hasName) {
      if (!isNonEmptyString(name)) {
        return response.status(400).json({ message: 'Name cannot be empty' });
      }

      updates.name = name.trim();
    }

    if (hasAvatarUrl) {
      updates.avatarUrl = avatarUrl;
    }

    if (hasEmail) {
      if (typeof email !== 'string') {
        return response.status(400).json({ message: 'Email is invalid' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      if (!isValidEmail(normalizedEmail)) {
        return response.status(400).json({ message: 'Email is invalid' });
      }

      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: request.user._id } });

      if (existingUser) {
        return response.status(409).json({ message: 'Email already exists' });
      }

      updates.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(request.user._id, updates, {
      new: true,
      runValidators: true
    });

    response.json({ user: buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(request, response, next) {
  try {
    const { currentPassword, newPassword } = request.body;

    if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
      return response.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return response.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(request.user._id).select('+password');
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return response.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    response.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getSavedArticles(request, response) {
  const user = await User.findById(request.user._id).populate('savedArticles');
  response.json({ savedArticles: user.savedArticles });
}

export async function toggleSavedArticle(request, response, next) {
  try {
    if (!isValidObjectId(request.params.articleId)) {
      return response.status(400).json({ message: 'Invalid article id' });
    }

    const user = await User.findById(request.user._id);
    const articleId = request.params.articleId;

    const articleExists = await Article.exists({ _id: articleId });
    if (!articleExists) {
      return response.status(404).json({ message: 'Article not found' });
    }

    const isSaved = user.savedArticles.some((savedArticle) => savedArticle.toString() === articleId);

    user.savedArticles = isSaved
      ? user.savedArticles.filter((savedArticle) => savedArticle.toString() !== articleId)
      : [...user.savedArticles, articleId];

    await user.save();
    await user.populate('savedArticles');

    response.json({ saved: !isSaved, savedArticles: user.savedArticles });
  } catch (error) {
    next(error);
  }
}