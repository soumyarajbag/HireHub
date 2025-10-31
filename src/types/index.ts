import { Request } from 'express';
import { UserRole } from '@/enums';

export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  tokenVersion: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface PasswordResetInput {
  token?: string;
  email?: string;
  otp?: string;
  newPassword: string;
}

export interface EmailVerificationInput {
  token?: string;
  email?: string;
  otp?: string;
}

export interface OtpVerificationInput {
  email: string;
  otp: string;
}

export interface RegistrationOtpInput {
  email: string;
  role?: string;
}

export interface RegistrationVerifyInput {
  email: string;
  otp: string;
  name: string;
  password: string;
  role?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export interface RequestWithUser extends Request {
  user?: User;
}

export interface SocketData {
  userId: string;
  userRole: string;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface CronJobConfig {
  name: string;
  schedule: string;
  timezone?: string;
  runOnInit?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface DatabaseConfig {
  uri: string;
  options?: any;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface AppConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  email: EmailConfig;
  cloudinary: CloudinaryConfig;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string;
  };
  logging: {
    level: string;
    file: string;
  };
  upload: {
    maxFileSize: number;
    path: string;
  };
  socket: {
    corsOrigin: string;
  };
}

export interface JobCreateInput {
  title: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  category: string;
  type: string[];
  location: string;
  isRemote?: boolean;
  salary: {
    min: number;
    max: number;
    currency?: string;
  };
  duration?: string;
  applicationDeadline?: number;
  companyName: string;
  companyLogo?: string;
  companyCoverImage?: string;
  expiresAt?: number;
}

export interface JobUpdateInput {
  title?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  category?: string;
  type?: string[];
  location?: string;
  isRemote?: boolean;
  salary?: {
    min: number;
    max: number;
    currency?: string;
  };
  duration?: string;
  applicationDeadline?: number;
  companyName?: string;
  companyLogo?: string;
  companyCoverImage?: string;
  expiresAt?: number;
  status?: string;
}

export interface JobFilterQuery extends PaginationQuery {
  category?: string;
  type?: string;
  location?: string;
  isRemote?: string;
  minSalary?: number;
  maxSalary?: number;
  keyword?: string;
  sort?: string;
  postedBy?: string;
  status?: string;
}
