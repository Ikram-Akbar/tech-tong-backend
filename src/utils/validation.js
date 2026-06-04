import mongoose from 'mongoose';
import { roles } from '../constants/roles.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const articleStatuses = new Set(['draft', 'published']);

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(value) {
  return typeof value === 'string' && emailPattern.test(value.trim());
}

export function isValidRole(value) {
  return Object.values(roles).includes(value);
}

export function isValidArticleStatus(value) {
  return value === undefined || articleStatuses.has(value);
}