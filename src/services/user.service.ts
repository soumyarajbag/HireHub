import { UserRepository } from '@/repositories/user.repository';
import { BaseService } from './base.service';
import { IUser } from '@/models/user.entity';
import { UserCreateInput, UserUpdateInput, LoginInput, PasswordResetInput, EmailVerificationInput } from '@/types';
import { UserRole } from '@/enums';
import { BcryptUtil } from '@/utils/bcrypt';
import { JwtUtil } from '@/utils/jwt';
import { EmailService } from '@/utils/email';
import { RedisConfig } from '@/config/redis';
import { logger } from '@/utils/logger';

export class UserService extends BaseService<IUser> {
  private emailService: EmailService;
  private redisConfig: RedisConfig;

  constructor(userRepository: UserRepository) {
    super(userRepository);
    this.emailService = EmailService.getInstance();
    this.redisConfig = RedisConfig.getInstance();
  }

  public async createUser(userData: UserCreateInput): Promise<{ user: IUser; tokens: any }> {
    const existingUser = await this.repository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.repository.create({
      ...userData,
      role: userData.role || UserRole.USER,
    });

    const emailVerificationToken = user.generateEmailVerificationToken();
    await user.save();

    const tokens = JwtUtil.generateTokenPair({
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    try {
      await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
    }

    await this.cacheUser(user);

    return { user, tokens };
  }

  public async login(loginData: LoginInput): Promise<{ user: IUser; tokens: any }> {
    const user = await this.repository.findByEmailWithPassword(loginData.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await user.comparePassword(loginData.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    await this.repository.updateLastLogin(user._id);

    const tokens = JwtUtil.generateTokenPair({
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    await this.cacheUser(user);

    return { user, tokens };
  }

  public async refreshTokens(refreshToken: string): Promise<{ tokens: any }> {
    const payload = JwtUtil.verifyRefreshToken(refreshToken);
    const user = await this.repository.findById(payload.userId);
    
    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw new Error('Invalid refresh token');
    }

    const tokens = JwtUtil.generateTokenPair({
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return { tokens };
  }

  public async logout(userId: string): Promise<void> {
    await this.repository.incrementTokenVersion(userId);
    await this.redisConfig.del(`user:${userId}`);
  }

  public async updateUser(userId: string, updateData: UserUpdateInput): Promise<IUser | null> {
    if (updateData.email) {
      const existingUser = await this.repository.findByEmail(updateData.email);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error('Email already in use');
      }
    }

    if (updateData.password) {
      updateData.password = await BcryptUtil.hashPassword(updateData.password);
    }

    const user = await this.repository.updateById(userId, updateData);
    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  public async deleteUser(userId: string): Promise<boolean> {
    const user = await this.repository.deleteById(userId);
    if (user) {
      await this.redisConfig.del(`user:${userId}`);
      return true;
    }
    return false;
  }

  public async verifyEmail(verificationData: EmailVerificationInput): Promise<IUser | null> {
    const user = await this.repository.findByEmailVerificationToken(verificationData.token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    const updatedUser = await this.repository.verifyEmail(user._id);
    if (updatedUser) {
      await this.cacheUser(updatedUser);
    }

    return updatedUser;
  }

  public async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  }

  public async resetPassword(resetData: PasswordResetInput): Promise<IUser | null> {
    const user = await this.repository.findByPasswordResetToken(resetData.token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = resetData.newPassword;
    user.clearPasswordResetToken();
    await user.save();

    await this.repository.incrementTokenVersion(user._id);
    await this.cacheUser(user);

    return user;
  }

  public async getUserFromCache(userId: string): Promise<IUser | null> {
    try {
      const cachedUser = await this.redisConfig.get(`user:${userId}`);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
    } catch (error) {
      logger.error('Failed to get user from cache:', error);
    }
    return null;
  }

  private async cacheUser(user: IUser): Promise<void> {
    try {
      await this.redisConfig.set(`user:${user._id}`, JSON.stringify(user), 3600);
    } catch (error) {
      logger.error('Failed to cache user:', error);
    }
  }

  public async getUserStats(): Promise<any> {
    return await this.repository.getUserStats();
  }

  public async deactivateUser(userId: string): Promise<IUser | null> {
    const user = await this.repository.deactivateUser(userId);
    if (user) {
      await this.redisConfig.del(`user:${userId}`);
    }
    return user;
  }

  public async activateUser(userId: string): Promise<IUser | null> {
    const user = await this.repository.activateUser(userId);
    if (user) {
      await this.cacheUser(user);
    }
    return user;
  }
}
