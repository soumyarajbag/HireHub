import { Otp, IOtp, OtpType } from '@/models/otp.entity';
import { RedisConfig } from '@/config/redis';
import { EmailService } from '@/utils/email';
import { logger } from '@/utils/logger';

export class OtpService {
  private static instance: OtpService;
  private redisConfig: RedisConfig;
  private emailService: EmailService;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly OTP_LENGTH = 6;

  private constructor() {
    this.redisConfig = RedisConfig.getInstance();
    this.emailService = EmailService.getInstance();
  }

  public static getInstance(): OtpService {
    if (!OtpService.instance) {
      OtpService.instance = new OtpService();
    }
    return OtpService.instance;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async canSendOtp(email: string, type: OtpType): Promise<boolean> {
    const key = `otp:send:${email}:${type}`;
    const sent = await this.redisConfig.getClient()?.get(key);

    if (sent) {
      return false;
    }

    await this.redisConfig.getClient()?.setEx(key, 60, '1');
    return true;
  }

  public async sendOtp(email: string, type: OtpType): Promise<string> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const canSend = await this.canSendOtp(normalizedEmail, type);
      if (!canSend) {
        throw new Error('Please wait before requesting another OTP');
      }

      await Otp.updateMany(
        { email: normalizedEmail, type, isUsed: false },
        { $set: { isUsed: true } }
      );

      const otp = this.generateOtp();
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );

      const otpDoc = await Otp.create({
        email: normalizedEmail,
        otp,
        type,
        expiresAt,
        attempts: 0,
        isUsed: false,
      });

      const redisKey = `otp:${normalizedEmail}:${type}:${otpDoc._id}`;
      await this.redisConfig
        .getClient()
        ?.setEx(redisKey, this.OTP_EXPIRY_MINUTES * 60, otp);

      try {
        await this.emailService.sendOtpEmail(normalizedEmail, otp, type);
        logger.info(`OTP sent to ${normalizedEmail} for ${type}`);
      } catch (emailError) {
        logger.error('Failed to send OTP email:', emailError);
      }

      return otpDoc._id.toString();
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  public async verifyOtp(
    email: string,
    otp: string,
    type: OtpType,
    markAsUsed: boolean = true
  ): Promise<boolean> {
    try {
      if (!email || typeof email !== 'string') {
        throw new Error('Email is required and must be a string');
      }
      if (!otp || typeof otp !== 'string') {
        throw new Error('OTP is required and must be a string');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const otpDoc = await Otp.findOne({
        email: normalizedEmail,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      })
        .select('+otp')
        .sort({ createdAt: -1 });

      if (!otpDoc) {
        return false;
      }

      if (otpDoc.attempts >= this.MAX_ATTEMPTS) {
        otpDoc.isUsed = true;
        await otpDoc.save();
        throw new Error('Maximum OTP verification attempts exceeded');
      }

      const isValid = otpDoc.otp === otp.trim();

      if (!isValid) {
        otpDoc.attempts += 1;
        await otpDoc.save();
        return false;
      }

      if (markAsUsed) {
        otpDoc.isUsed = true;
        await otpDoc.save();

        const redisKey = `otp:${normalizedEmail}:${type}:${otpDoc._id}`;
        await this.redisConfig.getClient()?.del(redisKey);
      }

      return true;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  public async verifyOtpById(otpId: string, otp: string): Promise<IOtp | null> {
    try {
      const otpDoc = await Otp.findById(otpId);

      if (!otpDoc || otpDoc.isUsed || otpDoc.expiresAt < new Date()) {
        return null;
      }

      if (otpDoc.attempts >= this.MAX_ATTEMPTS) {
        otpDoc.isUsed = true;
        await otpDoc.save();
        return null;
      }

      if (otpDoc.otp !== otp) {
        otpDoc.attempts += 1;
        await otpDoc.save();
        return null;
      }

      otpDoc.isUsed = true;
      await otpDoc.save();
      return otpDoc;
    } catch (error) {
      logger.error('Error verifying OTP by ID:', error);
      return null;
    }
  }

  public async resendOtp(email: string, type: OtpType): Promise<string> {
    return await this.sendOtp(email, type);
  }

  public async cleanupExpiredOtps(): Promise<number> {
    const result = await Otp.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount || 0;
  }
}
