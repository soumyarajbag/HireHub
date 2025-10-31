import mongoose, { Document, Schema } from 'mongoose';
import { FileType, FileStatus } from '@/enums';

export interface IFile extends Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  publicId?: string;
  type: FileType;
  status: FileStatus;
  uploadedBy: mongoose.Types.ObjectId;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(FileType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FileStatus),
      default: FileStatus.UPLOADED,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number,
      format: String,
    },
  },
  {
    timestamps: true,
  }
);

fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ type: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ createdAt: -1 });

export const File = mongoose.model<IFile>('File', fileSchema);
