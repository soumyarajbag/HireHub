import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { ResponseHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

const userRepository = new UserRepository(require('@/models/user.entity').User);
const userService = new UserService(userRepository);

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = JwtUtil.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access token required');
    }

    const payload = JwtUtil.verifyAccessToken(token);
    
    let user = await userService.getUserFromCache(payload.userId);
    if (!user) {
      user = await userService.findById(payload.userId);
      if (user) {
        await userService['cacheUser'](user);
      }
    }

    if (!user || !user.isActive) {
      return ResponseHandler.unauthorized(res, 'Invalid or inactive user');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return ResponseHandler.unauthorized(res, 'Token has been invalidated');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ResponseHandler.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = JwtUtil.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = JwtUtil.verifyAccessToken(token);
      const user = await userService.findById(payload.userId);
      
      if (user && user.isActive && user.tokenVersion === payload.tokenVersion) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
