import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isNonEmptyString, isValidEmail } from '../utils/validation.js';

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

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

export async function register(request, response, next) {
  try {
    const { name, email, password, avatarUrl } = request.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!isNonEmptyString(name) || !normalizedEmail || !isNonEmptyString(password)) {
      return response.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return response.status(400).json({ message: 'Email is invalid' });
    }

    if (password.length < 6) {
      return response.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response.status(409).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      avatarUrl: avatarUrl || ''
    });

    const token = createToken(user._id.toString());

    response.status(201).json({
      message: 'Registered successfully',
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!normalizedEmail || !isNonEmptyString(password)) {
      return response.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return response.status(400).json({ message: 'Email is invalid' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return response.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return response.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user._id.toString());

    response.json({
      message: 'Login successful',
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function me(request, response) {
  response.json({ user: buildUserResponse(request.user) });
}