import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    anchorType: {
      type: String,
      enum: ['text_selection', 'block_node'],
      required: true,
    },
    from: {
      type: Number,
      required: true,
    },
    to: {
      type: Number,
      required: true,
    },
    exactQuote: {
      type: String,
      default: '',
    },
    prefixContext: {
      type: String,
      default: '',
    },
    suffixContext: {
      type: String,
      default: '',
    },
    blockId: {
      type: String,
      default: null,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

commentSchema.index({ document: 1, parentComment: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
