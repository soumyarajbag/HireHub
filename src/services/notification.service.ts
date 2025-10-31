import { NotificationRepository } from '@/repositories/notification.repository';
import { BaseService } from './base.service';
import { INotification } from '@/models/notification.entity';
import { NotificationType, NotificationStatus } from '@/enums';
import { EmailService } from '@/utils/email';
import { SocketManager } from '@/utils/socket';
import { logger } from '@/utils/logger';
import { UserRepository } from '@/repositories/user.repository';
import { User } from '@/models/user.entity';

const userRepository = new UserRepository(User);

export class NotificationService extends BaseService<INotification> {
  private emailService: EmailService;
  private socketManager: SocketManager;

  constructor(notificationRepository: NotificationRepository) {
    super(notificationRepository);
    this.emailService = EmailService.getInstance();
    this.socketManager = SocketManager.getInstance();
  }

  public async createNotification(
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.IN_APP,
    data?: any,
    sendEmail: boolean = true,
    sendSocket: boolean = true
  ): Promise<INotification> {
    const notification = await this.repository.create({
      recipient: recipientId,
      title,
      message,
      type,
      data,
      status: NotificationStatus.PENDING,
      isRead: false,
    });

    if (sendSocket) {
      try {
        this.socketManager.emitNotification(recipientId, {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
        await this.repository.updateById(notification._id, {
          status: NotificationStatus.DELIVERED,
        });
      } catch (error) {
        logger.error('Failed to send socket notification:', error);
      }
    }

    if (sendEmail) {
      try {
        await this.sendEmailNotification(notification);
      } catch (error) {
        logger.error('Failed to send email notification:', error);
        if (notification.status === NotificationStatus.PENDING) {
          await this.repository.updateById(notification._id, {
            status: NotificationStatus.FAILED,
          });
        }
      }
    } else {
      await this.repository.updateById(notification._id, {
        status: NotificationStatus.DELIVERED,
      });
    }

    return notification;
  }

  public async getNotificationsByRecipient(
    recipientId: string,
    pagination: any = {}
  ): Promise<any> {
    return await this.repository.findByRecipientWithPagination(
      recipientId,
      pagination
    );
  }

  public async getUnreadNotifications(
    recipientId: string
  ): Promise<INotification[]> {
    return await this.repository.findUnreadByRecipient(recipientId);
  }

  public async markAsRead(
    notificationId: string,
    recipientId: string
  ): Promise<INotification | null> {
    const notification = await this.repository.findById(notificationId);
    if (!notification || notification.recipient.toString() !== recipientId) {
      throw new Error('Notification not found or unauthorized');
    }

    const updated = await this.repository.markAsRead(notificationId);
    if (updated) {
      await this.repository.updateById(notificationId, { isRead: true });
    }
    return updated;
  }

  public async markAllAsRead(recipientId: string): Promise<any> {
    return await this.repository.markAllAsRead(recipientId);
  }

  public async getUnreadCount(recipientId: string): Promise<number> {
    return await this.repository.getUnreadCount(recipientId);
  }

  public async sendEmailNotification(
    notification: INotification
  ): Promise<void> {
    const recipient = await userRepository.findById(
      notification.recipient.toString()
    );
    if (!recipient || !recipient.email) {
      logger.error(`Recipient not found for notification ${notification._id}`);
      return;
    }

    let htmlContent: string;

    if (notification.type === NotificationType.APPLICATION_STATUS) {
      htmlContent = await this.getApplicationStatusEmailTemplate(notification);
    } else if (notification.type === NotificationType.NEW_APPLICANT) {
      htmlContent = await this.getNewApplicantEmailTemplate(notification);
    } else {
      htmlContent =
        await this.getGenericNotificationEmailTemplate(notification);
    }

    await this.emailService.sendEmail({
      to: recipient.email,
      subject: notification.title,
      html: htmlContent,
    });

    await this.repository.updateById(notification._id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  private async getRecipientName(recipientId: string): Promise<string> {
    try {
      const recipient = await userRepository.findById(recipientId);
      return recipient?.name || 'User';
    } catch (error) {
      logger.error(`Error fetching recipient name: ${error}`);
      return 'User';
    }
  }

  private async getApplicationStatusEmailTemplate(
    notification: INotification
  ): Promise<string> {
    const { emailTemplates } = require('@/templates/email.templates');
    const name = await this.getRecipientName(notification.recipient.toString());
    return emailTemplates.applicationStatusUpdate(
      name,
      notification.data?.jobTitle || 'the job',
      notification.data?.status || 'updated',
      notification.message
    );
  }

  private async getNewApplicantEmailTemplate(
    notification: INotification
  ): Promise<string> {
    const { emailTemplates } = require('@/templates/email.templates');
    const name = await this.getRecipientName(notification.recipient.toString());
    return emailTemplates.newApplicant(
      name,
      notification.data?.applicantName || 'an applicant',
      notification.data?.jobTitle || 'your job',
      notification.message
    );
  }

  private async getGenericNotificationEmailTemplate(
    notification: INotification
  ): Promise<string> {
    const { emailTemplates } = require('@/templates/email.templates');
    const name = await this.getRecipientName(notification.recipient.toString());
    return emailTemplates.notification(
      notification.title,
      notification.message,
      name
    );
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
    const failedNotifications = await this.repository.findByStatus(
      NotificationStatus.FAILED
    );
    let successCount = 0;

    for (const notification of failedNotifications) {
      try {
        await this.sendEmailNotification(notification);
        successCount++;
      } catch (error) {
        logger.error(
          `Failed to resend notification ${notification._id}:`,
          error
        );
      }
    }

    return successCount;
  }

  public async notifyApplicationStatusChange(
    applicantId: string,
    jobTitle: string,
    status: string,
    applicationId: string,
    jobId: string
  ): Promise<INotification> {
    const statusMessages: Record<string, string> = {
      applied: 'has been received',
      reviewed: 'is being reviewed',
      shortlisted: 'has been shortlisted',
      selected: 'has been selected',
      rejected: 'has been rejected',
    };

    const message = statusMessages[status.toLowerCase()] || 'has been updated';
    const title = `Your application for ${jobTitle} ${message}!`;
    const notificationMessage = `Your application for ${jobTitle} ${message}. Check your dashboard for more details.`;

    return await this.createNotification(
      applicantId,
      title,
      notificationMessage,
      NotificationType.APPLICATION_STATUS,
      {
        jobId,
        jobTitle,
        applicationId,
        status,
      },
      true,
      true
    );
  }

  public async notifyNewApplicant(
    hrId: string,
    applicantName: string,
    jobTitle: string,
    applicationId: string,
    jobId: string
  ): Promise<INotification> {
    const title = `New applicant ${applicantName} applied to your job!`;
    const message = `New applicant ${applicantName} has applied for the position: ${jobTitle}. Review their application now.`;

    return await this.createNotification(
      hrId,
      title,
      message,
      NotificationType.NEW_APPLICANT,
      {
        jobId,
        jobTitle,
        applicantName,
        applicationId,
      },
      true,
      true
    );
  }

  public async notifyJobRecommendation(
    applicantId: string,
    jobTitle: string,
    jobId: string,
    reason?: string
  ): Promise<INotification> {
    const title = `New job recommendation for you!`;
    const message = reason
      ? `We found a job that matches your profile: ${jobTitle}. ${reason}`
      : `We found a job that matches your profile: ${jobTitle}. Check it out!`;

    return await this.createNotification(
      applicantId,
      title,
      message,
      NotificationType.JOB_RECOMMENDATION,
      {
        jobId,
        jobTitle,
        reason,
      },
      true,
      true
    );
  }
}
