import mongoose from 'mongoose';

export const SHARING_VISIBILITY = Object.freeze({
  PRIVATE: 'PRIVATE',
  WORKSPACE_ONLY: 'WORKSPACE_ONLY',
  ANYONE_WITH_LINK: 'ANYONE_WITH_LINK',
});

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    // TODO: reference the real User model once the auth module lands
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sharing: {
      visibility: {
        type: String,
        enum: Object.values(SHARING_VISIBILITY),
        default: SHARING_VISIBILITY.PRIVATE,
      },
      
      shareToken: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true },
);

workspaceSchema.index({ owner: 1, createdAt: -1 });

export const Workspace = mongoose.model('Workspace', workspaceSchema);
