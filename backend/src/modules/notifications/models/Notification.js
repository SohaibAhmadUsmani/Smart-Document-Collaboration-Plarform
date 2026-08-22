import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // TODO: reference User model (auth module)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // TODO: reference User model — who triggered the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'mention',
        'comment',
        'reply',
        'share',
        'permission_change',
        'document_update',
      ],
      required: true,
    },
    // TODO: reference Document model (documents module)
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
