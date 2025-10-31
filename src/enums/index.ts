export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  HR = 'hr',
  APPLICANT = 'applicant',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
  APPLICATION_STATUS = 'application_status',
  NEW_APPLICANT = 'new_applicant',
  JOB_RECOMMENDATION = 'job_recommendation',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

export enum CacheKey {
  USER = 'user',
  USER_SESSION = 'user_session',
  RATE_LIMIT = 'rate_limit',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  API_RESPONSE = 'api_response',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum DatabaseOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum SocketEvent {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  MESSAGE = 'message',
  NOTIFICATION = 'notification',
  ERROR = 'error',
}

export enum ValidationRule {
  REQUIRED = 'required',
  EMAIL = 'email',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  PASSWORD = 'password',
  PHONE = 'phone',
  URL = 'url',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  REMOTE = 'remote',
  ON_SITE = 'on_site',
  HYBRID = 'hybrid',
}

export enum JobCategory {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  FULL_STACK = 'full_stack',
  MOBILE = 'mobile',
  DEVOPS = 'devops',
  DATA_SCIENCE = 'data_science',
  MACHINE_LEARNING = 'machine_learning',
  UI_UX = 'ui_ux',
  QA = 'qa',
  SECURITY = 'security',
  BLOCKCHAIN = 'blockchain',
  OTHER = 'other',
}

export enum SortBy {
  RECENT = 'recent',
  POPULARITY = 'popularity',
  SALARY = 'salary',
  DATE = 'date',
}
