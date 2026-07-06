import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      enum: ['PROJECT_ASSIGNED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'NOTE_ADDED'],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Optimize notifications index for fetching recipient's unread ones quickly
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
