import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  MONGODB_TEST_URI: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  REDIS_URL: Joi.string()
    .optional()
    .allow('', null)
    .description('Upstash Redis URL (recommended)'),
  REDIS_HOST: Joi.string().when('REDIS_URL', {
    is: Joi.exist().not('').not(null),
    then: Joi.optional(),
    otherwise: Joi.string().default('localhost'),
  }),
  REDIS_PORT: Joi.number().when('REDIS_URL', {
    is: Joi.exist().not('').not(null),
    then: Joi.optional(),
    otherwise: Joi.number().default(6379),
  }),
  REDIS_PASSWORD: Joi.string().allow('', null).optional().empty(''),
  REDIS_TLS: Joi.string()
    .valid('true', 'false', '1', '0')
    .optional()
    .allow('', null)
    .description('Enable TLS for Redis connection'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  FROM_EMAIL: Joi.string().email().required(),
  FROM_NAME: Joi.string().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),
  MAX_FILE_SIZE: Joi.number().default(5242880),
  UPLOAD_PATH: Joi.string().default('uploads/'),
  SOCKET_CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
}).unknown();

const processedEnv = { ...process.env };
Object.keys(processedEnv).forEach((key) => {
  if (processedEnv[key] === '') {
    delete processedEnv[key];
  }
});

const { error, value: envVars } = envSchema.validate(processedEnv, {
  allowUnknown: true,
  stripUnknown: true,
  abortEarly: false,
  convert: true,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  database: {
    uri:
      envVars.NODE_ENV === 'test'
        ? envVars.MONGODB_TEST_URI
        : envVars.MONGODB_URI,
  },
  redis: {
    url: envVars.REDIS_URL,
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    tls: envVars.REDIS_TLS === 'true' || envVars.REDIS_TLS === '1',
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS,
    },
    from: {
      email: envVars.FROM_EMAIL,
      name: envVars.FROM_NAME,
    },
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },
  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    path: envVars.UPLOAD_PATH,
  },
  socket: {
    corsOrigin: envVars.SOCKET_CORS_ORIGIN,
  },
};
