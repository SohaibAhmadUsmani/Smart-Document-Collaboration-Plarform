import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    // TODO: reference User model (auth module)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // TODO: reference Document model (documents module)
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    // TODO: resolve comment
    resolved: {
      type: Boolean,
      default: false,
    },
    // TODO: reply threading
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  { timestamps: true }
);

export const Comment = mongoose.model('Comment', commentSchema);
