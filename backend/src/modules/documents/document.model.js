import mongoose from 'mongoose';

/**
 * Rich Attachment Subdocument Schema
 */
const AttachmentSubSchema = new mongoose.Schema(
  {
    attachmentId: {
      type: String,
      required: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    downloadUrl: {
      type: String,
      required: true,
      trim: true,
    },
    nodeAnchorId: {
      type: String,
      default: null,
      trim: true,
    },
    uploadedBy: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Main Document Schema
 */
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
            attrs: { blockId: 'init-block-1' },
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
    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: [30, 'Tag cannot exceed 30 characters'],
        },
      ],
      default: [],
      index: true,
    },
    favoritedBy: {
      type: [String],
      default: [],
      index: true,
    },
    attachments: {
      type: [AttachmentSubSchema],
      default: [],
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
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: null,
      trim: true,
    },
    scheduledPermanentDeletionAt: {
      type: Date,
      default: null,
    },

    previousFolderId: {
      type: String,
      default: null,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    snapshotCheckpointVersion: {
      type: Number,
      default: 1,
    },
    templateId: {
      type: String,
      default: null,
      trim: true,
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

DocumentSchema.index({ workspaceId: 1, isArchived: 1, updatedAt: -1 });
DocumentSchema.index({ workspaceId: 1, folderId: 1, isArchived: 1 });
DocumentSchema.index({ workspaceId: 1, tags: 1, isArchived: 1 });
DocumentSchema.index({ workspaceId: 1, favoritedBy: 1, isArchived: 1 });
DocumentSchema.index({ isArchived: 1, scheduledPermanentDeletionAt: 1 });
DocumentSchema.index({ scheduledPermanentDeletionAt: 1 }, { expireAfterSeconds: 0, sparse: true });
DocumentSchema.index(
  { title: 'text', plainText: 'text' },
  { weights: { title: 10, plainText: 2 }, name: 'DocumentFullTextIndex' }
);

export const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

