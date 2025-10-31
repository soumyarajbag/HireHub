import { NotificationRepository } from '@/repositories/notification.repository';
import { BaseService } from './base.service';
import { INotification } from '@/models/notification.entity';
import { NotificationType, NotificationStatus } from '@/enums';
import { EmailService } from '@/utils/email';
import { logger } from '@/utils/logger';

export class NotificationService extends BaseService<INotification> {
  private emailService: EmailService;

  constructor(notificationRepository: NotificationRepository) {
    super(notificationRepository);
    this.emailService = EmailService.getInstance();
  }

  public async createNotification(
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.IN_APP,
    data?: any
  ): Promise<INotification> {
    const notification = await this.repository.create({
      recipient: recipientId,
      title,
      message,
      type,
      data,
      status: NotificationStatus.PENDING,
    });

    if (type === NotificationType.EMAIL) {
      try {
        await this.sendEmailNotification(notification);
      } catch (error) {
        logger.error('Failed to send email notification:', error);
        await this.repository.markAsFailed(notification._id);
      }
    }

    return notification;
  }

  public async getNotificationsByRecipient(
    recipientId: string,
    pagination: any = {}
  ): Promise<any> {
    return await this.repository.findByRecipientWithPagination(recipientId, pagination);
  }

  public async getUnreadNotifications(recipientId: string): Promise<INotification[]> {
    return await this.repository.findUnreadByRecipient(recipientId);
  }

  public async markAsRead(notificationId: string, recipientId: string): Promise<INotification | null> {
    const notification = await this.repository.findById(notificationId);
    if (!notification || notification.recipient.toString() !== recipientId) {
      throw new Error('Notification not found or unauthorized');
    }

    return await this.repository.markAsRead(notificationId);
  }

  public async markAllAsRead(recipientId: string): Promise<any> {
    return await this.repository.markAllAsRead(recipientId);
  }

  public async getUnreadCount(recipientId: string): Promise<number> {
    return await this.repository.getUnreadCount(recipientId);
  }

  public async sendEmailNotification(notification: INotification): Promise<void> {
    if (notification.type !== NotificationType.EMAIL) {
      return;
    }

    const recipient = notification.recipient;
    if (typeof recipient === 'string') {
      await this.emailService.sendEmail({
        to: recipient,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
      });

      await this.repository.markAsDelivered(notification._id);
    }
  }

  public async sendBulkNotifications(
    recipientIds: string[],
    title: string,
    message: string,
    type: NotificationType = NotificationType.IN_APP,
    data?: any
  ): Promise<INotification[]> {
    const notifications = [];

    for (const recipientId of recipientIds) {
      const notification = await this.createNotification(
        recipientId,
        title,
        message,
        type,
        data
      );
      notifications.push(notification);
    }

    return notifications;
  }

  public async getNotificationStats(): Promise<any> {
    return await this.repository.getNotificationStats();
  }

  public async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    return await this.repository.deleteOldNotifications(daysOld);
  }

  public async resendFailedNotifications(): Promise<number> {
    const failedNotifications = await this.repository.findByStatus(NotificationStatus.FAILED);
    let successCount = 0;

    for (const notification of failedNotifications) {
      try {
        if (notification.type === NotificationType.EMAIL) {
          await this.sendEmailNotification(notification);
          successCount++;
        }
      } catch (error) {
        logger.error(`Failed to resend notification ${notification._id}:`, error);
      }
    }

    return successCount;
  }
}
