import nodemailer from 'nodemailer';
import { config } from '@/config/environment';
import { logger } from './logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const isDevelopment = config.env === 'development';

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.port === 465,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
        tls: {
          rejectUnauthorized: !isDevelopment,
        },
      });

      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error: any) {
      if (
        error.code === 'ESOCKET' ||
        error.code === 'EAUTH' ||
        error.message?.includes('certificate')
      ) {
        logger.warn('Email service verification failed:', error.message);
        logger.warn('Email service will continue but emails may fail to send.');
        logger.warn(
          'For production, ensure valid SMTP credentials and certificates.'
        );

        if (config.env === 'production') {
          throw error;
        }
      } else {
        logger.error('Email service initialization failed:', error);
        throw error;
      }
    }
  }

  public async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', result.messageId);
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  public async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = 'Welcome to Our Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome ${name}!</h2>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string
  ): Promise<void> {
    const subject = 'Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendVerificationEmail(
    to: string,
    verificationToken: string
  ): Promise<void> {
    const subject = 'Email Verification';
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendOtpEmail(
    to: string,
    otp: string,
    type: string
  ): Promise<void> {
    const { emailTemplates } = require('@/templates/email.templates');

    let subject = 'Verification Code';
    if (type === 'email_verification') {
      subject = 'Email Verification OTP';
    } else if (type === 'password_reset') {
      subject = 'Password Reset OTP';
    } else if (type === 'login_otp') {
      subject = 'Login Verification OTP';
    }

    const html = emailTemplates.otpEmail('User', otp, type);

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }
}
