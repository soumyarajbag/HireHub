import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType, NotificationStatus } from '@/enums';

export interface INotification extends Document {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  recipient: mongoose.Types.ObjectId;
  data?: {
    jobId?: string;
    jobTitle?: string;
    applicationId?: string;
    applicantId?: string;
    applicantName?: string;
    status?: string;
    [key: string]: any;
  };
  sentAt?: Date;
  readAt?: Date;
  isRead?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
