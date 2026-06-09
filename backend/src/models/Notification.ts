import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  message: string;
  type: 'comment' | 'peer_review' | 'job_status' | 'webinar' | 'badge';
  payload?: Record<string, any>;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message:   { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['comment', 'peer_review', 'job_status', 'webinar', 'badge'],
    },
    payload: { type: Schema.Types.Mixed },
    link:    { type: String },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }   // auto-manages createdAt + updatedAt
);

// Index for fast per-user queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
