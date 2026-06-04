import { Article } from '../models/Article.js';
import { isNonEmptyString, isValidArticleStatus, isValidObjectId } from '../utils/validation.js';

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getArticles(_request, response, next) {
  try {
    const articles = await Article.find().populate('author', 'name email role');
    response.json({ articles });
  } catch (error) {
    next(error);
  }
}

export async function getArticleById(request, response, next) {
  try {
    if (!isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: 'Invalid article id' });
    }

    const article = await Article.findById(request.params.id).populate('author', 'name email role');

    if (!article) {
      return response.status(404).json({ message: 'Article not found' });
    }

    response.json({ article });
  } catch (error) {
    next(error);
  }
}

export async function createArticle(request, response, next) {
  try {
    const { title, summary, content, category, imageUrl, status } = request.body;

    if (!isNonEmptyString(title) || !isNonEmptyString(content)) {
      return response.status(400).json({ message: 'Title and content are required' });
    }

    if (!isValidArticleStatus(status)) {
      return response.status(400).json({ message: 'Invalid article status' });
    }

    const slug = slugify(title);

    const article = await Article.create({
      title,
      slug,
      summary,
      content,
      category,
      imageUrl,
      status,
      author: request.user._id
    });

    response.status(201).json({ article });
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(request, response, next) {
  try {
    if (!isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: 'Invalid article id' });
    }

    const allowedFields = ['title', 'summary', 'content', 'category', 'imageUrl', 'status'];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(request.body, field)) {
        updates[field] = request.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'At least one field is required' });
    }

    if (updates.title !== undefined) {
      if (!isNonEmptyString(updates.title)) {
        return response.status(400).json({ message: 'Title cannot be empty' });
      }

      updates.title = updates.title.trim();
    }

    if (updates.content !== undefined) {
      if (!isNonEmptyString(updates.content)) {
        return response.status(400).json({ message: 'Content cannot be empty' });
      }

      updates.content = updates.content.trim();
    }

    if (!isValidArticleStatus(updates.status)) {
      return response.status(400).json({ message: 'Invalid article status' });
    }

    if (updates.title) {
      updates.slug = slugify(updates.title);
    }

    const article = await Article.findByIdAndUpdate(request.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!article) {
      return response.status(404).json({ message: 'Article not found' });
    }

    response.json({ article });
  } catch (error) {
    next(error);
  }
}

export async function deleteArticle(request, response, next) {
  try {
    if (!isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: 'Invalid article id' });
    }

    const article = await Article.findByIdAndDelete(request.params.id);

    if (!article) {
      return response.status(404).json({ message: 'Article not found' });
    }

    response.json({ message: 'Article deleted' });
  } catch (error) {
    next(error);
  }
}