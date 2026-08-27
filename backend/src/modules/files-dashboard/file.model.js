import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storageKey: {
      // Relative path on disk (or cloud key later) where the file bytes live
      type: String,
      required: true,
      trim: true,
    },
    downloadUrl: {
      // URL clients use to fetch the file
      type: String,
      required: true,
      trim: true,
    },
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
    documentId: {
      // Set only if this file is linked as a document attachment
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    uploadedBy: {
      type: String,
      required: [true, 'Uploader ID is required'],
      index: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
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

FileSchema.index({ workspaceId: 1, isDeleted: 1, updatedAt: -1 });
FileSchema.index({ workspaceId: 1, folderId: 1, isDeleted: 1 });
FileSchema.index({ uploadedBy: 1, isDeleted: 1, updatedAt: -1 });

export const FileModel = mongoose.models.File || mongoose.model('File', FileSchema);