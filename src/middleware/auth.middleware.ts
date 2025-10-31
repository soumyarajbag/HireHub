import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { ResponseHandler } from '@/utils/response';
import { logger } from '@/utils/logger';
import { UserRole } from '@/enums';

const userRepository = new UserRepository(require('@/models/user.entity').User);
const userService = new UserService(userRepository);

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = JwtUtil.extractToken(req);

    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access token required');
    }

    const payload = JwtUtil.verifyAccessToken(token);

    const user = await userService.findById(payload.userId);

    if (!user || !user.isActive) {
      logger.warn(
        `Authentication failed - User not found or inactive: ${payload.userId}`
      );
      return ResponseHandler.unauthorized(res, 'Invalid or inactive user');
    }

    // Ensure role is properly set - validate it exists and is a valid role
    if (!user.role) {
      logger.error(`User ${user._id} has no role assigned!`);
      return ResponseHandler.unauthorized(res, 'User role not assigned');
    }

    logger.debug(
      `Authenticated user: ${user._id}, role: '${user.role}', type: ${typeof user.role}, emailVerified: ${user.isEmailVerified}`
    );

    const tokenVersion = Number(payload.tokenVersion ?? 0);
    const userTokenVersion = Number(user.tokenVersion ?? 0);

    if (tokenVersion !== userTokenVersion) {
      logger.warn(
        `Token version mismatch for user ${payload.userId}. Token has: ${tokenVersion} (${typeof payload.tokenVersion}), User has: ${userTokenVersion} (${typeof user.tokenVersion})`
      );
      return ResponseHandler.unauthorized(res, 'Token has been invalidated');
    }

    req.user = user;
    logger.debug(
      `User authenticated: ${user._id}, role: '${user.role}' (type: ${typeof user.role}), emailVerified: ${user.isEmailVerified}, isActive: ${user.isActive}`
    );
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request');
      return ResponseHandler.unauthorized(res, 'Authentication required');
    }

    // Get the raw role value and normalize it
    const rawRole = req.user.role;
    const userRole = String(rawRole || '')
      .toLowerCase()
      .trim();
    const allowedRoles = roles.map((r) => String(r).toLowerCase().trim());

    logger.info(
      `🔐 Authorization check - User ID: ${req.user._id}, Raw role: '${rawRole}' (${typeof rawRole}), Normalized: '${userRole}', Allowed: [${allowedRoles.join(', ')}]`
    );

    if (!allowedRoles.includes(userRole)) {
      logger.error(
        `❌ Access DENIED - User role '${rawRole}' (normalized: '${userRole}') not in allowed roles: [${roles.join(', ')}]`
      );
      logger.error(
        `   User object: ${JSON.stringify({ id: req.user._id, role: req.user.role, email: req.user.email })}`
      );
      return ResponseHandler.forbidden(
        res,
        `Insufficient permissions. Your role: '${rawRole}'. Required roles: ${roles.join(' or ')}`
      );
    }

    logger.info(`✅ Authorization GRANTED for role: ${userRole}`);
    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = JwtUtil.extractToken(req);

    if (token) {
      const payload = JwtUtil.verifyAccessToken(token);
      const user = await userService.findById(payload.userId);

      if (
        user &&
        user.isActive &&
        (payload.tokenVersion === undefined ||
          user.tokenVersion === payload.tokenVersion)
      ) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    logger.warn('Email verification check failed: No user in request');
    return ResponseHandler.unauthorized(res, 'Authentication required');
  }

  logger.debug(
    `Email verification check - User: ${req.user._id}, EmailVerified: ${req.user.isEmailVerified}`
  );

  if (!req.user.isEmailVerified) {
    logger.warn(
      `Email verification required but user ${req.user._id} email not verified`
    );
    return ResponseHandler.forbidden(
      res,
      'Email verification required. Please verify your email address.'
    );
  }

  logger.debug(`Email verification passed for user: ${req.user._id}`);
  next();
};

export const requireHR = authorize('hr', 'admin');
export const requireApplicant = authorize('applicant', 'user');
export const requireAdmin = authorize('admin');

export const requireAnyRole = (...roles: string[]) => {
  return authorize(...roles);
};

export const requireHRorAdmin = authorize('hr', 'admin');

export const requireApplicantOrHR = authorize(
  'applicant',
  'hr',
  'user',
  'admin'
);
