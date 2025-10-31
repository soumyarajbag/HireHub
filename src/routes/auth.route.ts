import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import { authLimiter, passwordResetLimiter, emailVerificationLimiter } from '@/middleware/rate-limiter.middleware';
import { validateRequest } from '@/utils/validation';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateEmailVerification,
  validateRefreshToken,
  validateUserUpdate,
  validatePasswordChange,
} from '@/middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  authLimiter,
  validateRequest(validateUserRegistration),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest(validateUserLogin),
  authController.login
);

router.post(
  '/refresh-token',
  validateRequest(validateRefreshToken),
  authController.refreshToken
);

router.post('/logout', authenticate, authController.logout);

router.post(
  '/verify-email',
  emailVerificationLimiter,
  validateRequest(validateEmailVerification),
  authController.verifyEmail
);

router.post(
  '/request-password-reset',
  passwordResetLimiter,
  validateRequest(validatePasswordReset),
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validateRequest(validatePasswordResetConfirm),
  authController.resetPassword
);

router.get('/profile', authenticate, authController.getProfile);

router.put(
  '/profile',
  authenticate,
  validateRequest(validateUserUpdate),
  authController.updateProfile
);

router.put(
  '/change-password',
  authenticate,
  validateRequest(validatePasswordChange),
  authController.changePassword
);

router.delete('/account', authenticate, authController.deleteAccount);

export default router;
