import { Router } from 'express';
import { NotificationController } from '@/controllers/notification.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { validateMongoId, validatePagination } from '@/middleware/validation.middleware';
import { validateNotification, validateBulkNotification } from '@/middleware/validation.middleware';

const router = Router();
const notificationController = new NotificationController();

router.post(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  validateNotification,
  notificationController.createNotification
);

router.post(
  '/bulk',
  authenticate,
  authorize('admin', 'moderator'),
  validateBulkNotification,
  notificationController.sendBulkNotifications
);

router.get(
  '/',
  authenticate,
  validatePagination,
  notificationController.getNotifications
);

router.get(
  '/unread',
  authenticate,
  notificationController.getUnreadNotifications
);

router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  notificationController.getNotificationStats
);

router.get(
  '/:id',
  authenticate,
  validateMongoId('id'),
  notificationController.getNotificationById
);

router.patch(
  '/:id/read',
  authenticate,
  validateMongoId('id'),
  notificationController.markAsRead
);

router.patch(
  '/mark-all-read',
  authenticate,
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  authenticate,
  validateMongoId('id'),
  notificationController.deleteNotification
);

router.post(
  '/cleanup',
  authenticate,
  authorize('admin'),
  notificationController.cleanupOldNotifications
);

router.post(
  '/resend-failed',
  authenticate,
  authorize('admin'),
  notificationController.resendFailedNotifications
);

export default router;
