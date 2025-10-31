import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { NotificationService } from '@/services/notification.service';
import { NotificationRepository } from '@/repositories/notification.repository';
import { Notification } from '@/models/notification.entity';
import { asyncHandler } from '@/middleware/error.middleware';

const notificationRepository = new NotificationRepository(Notification);
const notificationService = new NotificationService(notificationRepository);

export class NotificationController extends BaseController {
  public createNotification = asyncHandler(
    async (req: Request, res: Response) => {
      const { recipientId, title, message, type, data } = req.body;

      const notification = await notificationService.createNotification(
        recipientId,
        title,
        message,
        type,
        data
      );

      return this.handleSuccess(
        res,
        'Notification created successfully',
        { notification },
        201
      );
    }
  );

  public getNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await notificationService.getNotificationsByRecipient(
        req.user!._id,
        req.query
      );

      return this.handleSuccess(
        res,
        'Notifications retrieved successfully',
        result.data,
        200,
        result.meta
      );
    }
  );

  public getUnreadNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const notifications = await notificationService.getUnreadNotifications(
        req.user!._id
      );

      return this.handleSuccess(
        res,
        'Unread notifications retrieved successfully',
        { notifications }
      );
    }
  );

  public getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!._id);

    return this.handleSuccess(res, 'Unread count retrieved successfully', {
      count,
    });
  });

  public markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!._id
    );

    if (!notification) {
      return this.handleNotFound(res, 'Notification not found or unauthorized');
    }

    return this.handleSuccess(res, 'Notification marked as read', {
      notification,
    });
  });

  public markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!._id);

    return this.handleSuccess(res, 'All notifications marked as read');
  });

  public getNotificationById = asyncHandler(
    async (req: Request, res: Response) => {
      const notification = await notificationService.findById(req.params.id);

      if (!notification) {
        return this.handleNotFound(res, 'Notification not found');
      }

      if (notification.recipient.toString() !== req.user!._id) {
        return this.handleForbidden(res, 'Access denied to this notification');
      }

      return this.handleSuccess(res, 'Notification retrieved successfully', {
        notification,
      });
    }
  );

  public deleteNotification = asyncHandler(
    async (req: Request, res: Response) => {
      const notification = await notificationService.findById(req.params.id);

      if (!notification) {
        return this.handleNotFound(res, 'Notification not found');
      }

      if (notification.recipient.toString() !== req.user!._id) {
        return this.handleForbidden(res, 'Access denied to this notification');
      }

      const success = await notificationService.deleteById(req.params.id);

      if (!success) {
        return this.handleError(
          new Error('Failed to delete notification'),
          res
        );
      }

      return this.handleSuccess(res, 'Notification deleted successfully');
    }
  );

  public sendBulkNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const { recipientIds, title, message, type, data } = req.body;

      const notifications = await notificationService.sendBulkNotifications(
        recipientIds,
        title,
        message,
        type,
        data
      );

      return this.handleSuccess(
        res,
        'Bulk notifications sent successfully',
        { notifications },
        201
      );
    }
  );

  public getNotificationStats = asyncHandler(
    async (req: Request, res: Response) => {
      const stats = await notificationService.getNotificationStats();

      return this.handleSuccess(
        res,
        'Notification statistics retrieved successfully',
        { stats: stats[0] || {} }
      );
    }
  );

  public cleanupOldNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const { daysOld = 30 } = req.body;

      const deletedCount =
        await notificationService.cleanupOldNotifications(daysOld);

      return this.handleSuccess(
        res,
        'Old notifications cleaned up successfully',
        { deletedCount }
      );
    }
  );

  public resendFailedNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const successCount =
        await notificationService.resendFailedNotifications();

      return this.handleSuccess(
        res,
        'Failed notifications resent successfully',
        { successCount }
      );
    }
  );
}
