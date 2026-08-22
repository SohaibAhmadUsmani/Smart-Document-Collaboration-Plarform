import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: [true, 'Workspace ID is required'],
      index: true,
      trim: true,
    },
    folderId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      default: 'Untitled Document',
      maxlength: [255, 'Title cannot exceed 255 characters'],
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      }),
    },
    plainText: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: null,
      maxlength: [50, 'Icon identifier cannot exceed 50 characters'],
    },
    coverImage: {
      type: String,
      default: null,
      trim: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Creator ID is required'],
      index: true,
      trim: true,
    },
    lastModifiedBy: {
      type: String,
      required: [true, 'Last modifier ID is required'],
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for optimal querying
DocumentSchema.index({ workspaceId: 1, isArchived: 1, updatedAt: -1 });
DocumentSchema.index({ workspaceId: 1, folderId: 1, isArchived: 1 });

export const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
