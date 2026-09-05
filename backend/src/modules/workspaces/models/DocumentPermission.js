import mongoose from 'mongoose';

export const DOCUMENT_ROLES = Object.freeze({
  OWNER: 'owner',
  EDITOR: 'editor',
  COMMENTER: 'commenter',
  VIEWER: 'viewer',
});

const documentPermissionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'commenter', 'viewer'],
      required: true,
      default: 'viewer',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// A user can only have one explicit permission record per document
documentPermissionSchema.index({ document: 1, user: 1 }, { unique: true });

export const DocumentPermission = mongoose.model('DocumentPermission', documentPermissionSchema);
