import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    summary: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'general'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Article = mongoose.model('Article', articleSchema);