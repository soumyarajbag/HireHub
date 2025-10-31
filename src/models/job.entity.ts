import mongoose, { Document, Schema } from 'mongoose';
import { JobStatus, JobType, JobCategory } from '@/enums';

export interface IJob extends Document {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  category: JobCategory;
  type: JobType[];
  location: string;
  isRemote: boolean;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  duration?: string;
  applicationDeadline?: Date;
  postedBy: mongoose.Types.ObjectId;
  companyName: string;
  companyLogo?: string;
  companyCoverImage?: string;
  status: JobStatus;
  views: number;
  applicantsCount: number;
  bookmarksCount: number;
  expiresAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    requirements: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(JobCategory),
      required: true,
      index: true,
    },
    type: {
      type: [String],
      enum: Object.values(JobType),
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
      index: true,
    },
    salary: {
      min: {
        type: Number,
        required: true,
        min: 0,
      },
      max: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    duration: {
      type: String,
    },
    applicationDeadline: {
      type: Date,
      index: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyLogo: {
      type: String,
    },
    companyCoverImage: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    applicantsCount: {
      type: Number,
      default: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;

        if (ret.applicationDeadline) {
          ret.applicationDeadline = new Date(ret.applicationDeadline).getTime();
        }
        if (ret.expiresAt) {
          ret.expiresAt = new Date(ret.expiresAt).getTime();
        }
        if (ret.publishedAt) {
          ret.publishedAt = new Date(ret.publishedAt).getTime();
        }
        if (ret.createdAt) {
          ret.createdAt = new Date(ret.createdAt).getTime();
        }
        if (ret.updatedAt) {
          ret.updatedAt = new Date(ret.updatedAt).getTime();
        }

        return ret;
      },
    },
  }
);

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ location: 1, status: 1 });
jobSchema.index({ isRemote: 1, status: 1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ status: 1, views: -1 });
jobSchema.index({ status: 1, 'salary.max': -1 });
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

jobSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === JobStatus.PUBLISHED &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  if (
    this.status === JobStatus.PUBLISHED &&
    !this.expiresAt &&
    this.applicationDeadline
  ) {
    this.expiresAt = this.applicationDeadline;
  }
  next();
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
