import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  _id: string;
  email: string;
  otp: string;
  type: OtpType;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  LOGIN_OTP = 'login_otp',
  CHANGE_EMAIL = 'change_email',
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
      select: false,
    },
    type: {
      type: String,
      enum: Object.values(OtpType),
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.otp;
        delete ret.__v;
        return ret;
      },
    },
  }
);

otpSchema.index({ email: 1, type: 1, isUsed: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
