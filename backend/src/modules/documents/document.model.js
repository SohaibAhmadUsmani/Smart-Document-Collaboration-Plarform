/**
 * @file document.model.js
 * @description Mongoose schema and model definition for documents in DocSync Pro.
 * Includes schemas for rich attachments, ProseMirror JSON AST content, tags,
 * soft-deletion metadata, and optimistic concurrency version tracking.
 * @module backend/src/modules/documents/document.model
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file DocSync Pro ke documents ke liye Mongoose data model define karti hai.
 * Isme document ka content (TipTap/ProseMirror JSON AST structure), versioning (OCC),
 * soft deletion lifecycle (30-day auto-purge TTL), attachments, aur text indexing shamil hain.
 */

import mongoose from 'mongoose';

/**
 * Shared transformation logic for Mongoose toJSON and toObject virtuals.
 * Ensures `id` is exposed and internal `__v` is removed.
 *
 * [ROMAN URDU]:
 * Yeh helper function documents ke JSON/Object conversion ko normalize karta hai,
 * `_id` ko `id` string mein convert karta hai aur internal `__v` strip karta hai.
 *
 * @param {Object} _ - Source document
 * @param {Object} ret - Plain object representation
 * @returns {Object} Cleaned plain object
 */
const transformDocument = (_, ret) => {
  ret.id = ret._id.toString();
  delete ret.__v;
  return ret;
};

/**
 * Rich Attachment Subdocument Schema.
 * Embeds metadata for binary files linked to the document or specific node anchors.
 *
 * [ROMAN URDU]:
 * Yeh sub-schema document ke andar attach kiye gaye files ki metadata save karta hai
 * (jaise file size, storageKey, downloadUrl aur optional nodeAnchorId).
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
 * Main Document Schema.
 * Defines the core document persistence contract for DocSync Pro.
 *
 * [ROMAN URDU]:
 * Document ka main schema. Isme workspace isolation (workspaceId), nested folder support (folderId),
 * TipTap AST content, search plainText, optimistic concurrency version (OCC), aur 30-day soft-delete
 * fields configured hain.
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
      validate: [(val) => val.length <= 20, 'Cannot have more than 20 tags per document'],
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
    sharingMode: {
      type: String,
      enum: ['private', 'workspace', 'anyone_with_link'],
      default: 'workspace',
      index: true,
    },
    shareToken: {
      type: String,
      default: null,
      index: { sparse: true },
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
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: transformDocument },
    toObject: { virtuals: true, transform: transformDocument },
  }
);

// High-performance compound indexes for multi-tenant workspace queries
DocumentSchema.index({ workspaceId: 1, isArchived: 1, updatedAt: -1 });
DocumentSchema.index({ workspaceId: 1, isArchived: 1, folderId: 1, updatedAt: -1 });
DocumentSchema.index({ workspaceId: 1, folderId: 1, isArchived: 1 });
DocumentSchema.index({ workspaceId: 1, tags: 1, isArchived: 1 });
DocumentSchema.index({ workspaceId: 1, favoritedBy: 1, isArchived: 1 });
DocumentSchema.index({ isArchived: 1, scheduledPermanentDeletionAt: 1 }, { sparse: true });
// Note: MongoDB TTL index on scheduledPermanentDeletionAt removed to prevent silent bypass of S3/cleanup hooks
DocumentSchema.index(
  { title: 'text', plainText: 'text' },
  { weights: { title: 10, plainText: 2 }, name: 'DocumentFullTextIndex' }
);

export const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
