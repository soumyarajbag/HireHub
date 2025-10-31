import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { User } from '@/models/user.entity';
import { asyncHandler } from '@/middleware/error.middleware';
import { setAuthCookies, clearAuthCookies } from '@/utils/cookies';

const userRepository = new UserRepository(User);
const userService = new UserService(userRepository);

export class AuthController extends BaseController {
  public register = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await userService.createUser(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.handleSuccess(
      res,
      'User registered successfully',
      { user, tokens },
      201
    );
  });

  public login = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await userService.login(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.handleSuccess(res, 'Login successful', { user, tokens });
  });

  public refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      return this.handleError(new Error('Refresh token required'), res);
    }

    const { tokens } = await userService.refreshTokens(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.handleSuccess(res, 'Tokens refreshed successfully', { tokens });
  });

  public logout = asyncHandler(async (req: Request, res: Response) => {
    await userService.logout(req.user!._id);
    clearAuthCookies(res);

    return this.handleSuccess(res, 'Logout successful');
  });

  public verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.verifyEmail(req.body);

    return this.handleSuccess(res, 'Email verified successfully', { user });
  });

  public requestPasswordReset = asyncHandler(
    async (req: Request, res: Response) => {
      await userService.requestPasswordReset(req.body.email);

      return this.handleSuccess(
        res,
        'Password reset email sent if account exists'
      );
    }
  );

  public resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.resetPassword(req.body);

    return this.handleSuccess(res, 'Password reset successfully', { user });
  });

  public getProfile = asyncHandler(async (req: Request, res: Response) => {
    const { logger } = require('@/utils/logger');
    logger.info(
      `Get profile - User: ${req.user?._id}, Role: '${req.user?.role}' (${typeof req.user?.role})`
    );
    return this.handleSuccess(res, 'Profile retrieved successfully', {
      user: req.user,
      roleInfo: {
        role: req.user?.role,
        roleType: typeof req.user?.role,
        normalizedRole: req.user?.role
          ? String(req.user.role).toLowerCase().trim()
          : null,
      },
    });
  });

  public updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.user!._id, req.body);

    return this.handleSuccess(res, 'Profile updated successfully', { user });
  });

  public changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const isCurrentPasswordValid =
      await req.user!.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return this.handleError(new Error('Current password is incorrect'), res);
    }

    const user = await userService.updateUser(req.user!._id, {
      password: newPassword,
    });

    return this.handleSuccess(res, 'Password changed successfully', { user });
  });

  public deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const success = await userService.deleteUser(req.user!._id);

    if (!success) {
      return this.handleError(new Error('Failed to delete account'), res);
    }

    return this.handleSuccess(res, 'Account deleted successfully');
  });

  public sendPasswordResetOtp = asyncHandler(
    async (req: Request, res: Response) => {
      const { email } = req.body;
      const result = await userService.sendPasswordResetOtp(email);

      return this.handleSuccess(res, result.message, {}, 200);
    }
  );

  public resetPasswordWithOtp = asyncHandler(
    async (req: Request, res: Response) => {
      const { email, otp, newPassword } = req.body;
      const user = await userService.resetPasswordWithOtp(
        email,
        otp,
        newPassword
      );

      return this.handleSuccess(res, 'Password reset successfully', { user });
    }
  );

  public verifyEmailWithOtp = asyncHandler(
    async (req: Request, res: Response) => {
      const { otp } = req.body;
      if (!req.user) {
        return this.handleError(new Error('Authentication required'), res);
      }
      const user = await userService.verifyEmailWithOtp(req.user._id, otp);

      return this.handleSuccess(res, 'Email verified successfully', { user });
    }
  );

  public resendVerificationOtp = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        return this.handleError(new Error('Authentication required'), res);
      }
      const result = await userService.resendVerificationOtp(req.user.email);

      return this.handleSuccess(res, result.message, {}, 200);
    }
  );
}
