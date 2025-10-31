import rateLimit from 'express-rate-limit';
import { config } from '@/config/environment';
import { ResponseHandler } from '@/utils/response';
import { RedisConfig } from '@/config/redis';

const redisConfig = RedisConfig.getInstance();

const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message:
        message || 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return ResponseHandler.tooManyRequests(
        res,
        message || 'Too many requests'
      );
    },
    skip: (req) => {
      return config.env === 'test';
    },
  });
};

export const generalLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max,
  'Too many requests from this IP, please try again later.'
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts, please try again later.'
);

export const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000,
  3,
  'Too many password reset attempts, please try again later.'
);

export const emailVerificationLimiter = createRateLimiter(
  60 * 60 * 1000,
  5,
  'Too many email verification attempts, please try again later.'
);

export const fileUploadLimiter = createRateLimiter(
  60 * 60 * 1000,
  20,
  'Too many file uploads, please try again later.'
);

export const apiLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  'Too many API requests, please try again later.'
);
