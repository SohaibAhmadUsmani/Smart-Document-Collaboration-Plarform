import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'file.uploaded',
        'file.renamed',
        'file.moved',
        'file.deleted',
        'file.copied',
        'document.created',
        'document.updated',
        'document.tags_updated',
        'document.favorite_toggled',
        'document.duplicated',
        'document.archived',
        'document.restored',
        'document.permanently_deleted',
      ],
    },
    entityType: {
      type: String,
      required: true,
      default: 'file',
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    entityName: {
      // snapshot of the file/document name at the time of the action, so
      // history still reads correctly even after later renames
      type: String,
      required: true,
    },
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

ActivityLogSchema.index({ workspaceId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLogModel =
  mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);