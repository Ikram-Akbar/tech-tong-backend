import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { roles } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(roles),
      default: roles.USER
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    savedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);