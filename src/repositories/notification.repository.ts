import { INotification } from '@/models/notification.entity';
import { BaseRepository } from './base.repository';
import { NotificationType, NotificationStatus } from '@/enums';

export class NotificationRepository extends BaseRepository<INotification> {
  public async findByRecipient(recipientId: string): Promise<INotification[]> {
    return await this.find({ recipient: recipientId });
  }

  public async findByRecipientWithPagination(
    recipientId: string,
    pagination: any = {}
  ): Promise<any> {
    return await this.findWithPagination({ recipient: recipientId }, pagination);
  }

  public async findByType(type: NotificationType): Promise<INotification[]> {
    return await this.find({ type });
  }

  public async findByStatus(status: NotificationStatus): Promise<INotification[]> {
    return await this.find({ status });
  }

  public async findUnreadByRecipient(recipientId: string): Promise<INotification[]> {
    return await this.find({
      recipient: recipientId,
      status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] },
      readAt: { $exists: false },
    });
  }

  public async markAsRead(notificationId: string): Promise<INotification | null> {
    return await this.updateById(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  public async markAsDelivered(notificationId: string): Promise<INotification | null> {
    return await this.updateById(notificationId, {
      status: NotificationStatus.DELIVERED,
      sentAt: new Date(),
    });
  }

  public async markAsFailed(notificationId: string): Promise<INotification | null> {
    return await this.updateById(notificationId, {
      status: NotificationStatus.FAILED,
    });
  }

  public async markAllAsRead(recipientId: string): Promise<any> {
    return await this.updateMany(
      {
        recipient: recipientId,
        status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] },
        readAt: { $exists: false },
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      }
    );
  }

  public async getUnreadCount(recipientId: string): Promise<number> {
    return await this.count({
      recipient: recipientId,
      status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] },
      readAt: { $exists: false },
    });
  }

  public async getNotificationStats(): Promise<any> {
    return await this.aggregate([
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          notificationsByType: {
            $push: {
              type: '$type',
            },
          },
          notificationsByStatus: {
            $push: {
              status: '$status',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalNotifications: 1,
          typeDistribution: {
            $reduce: {
              input: '$notificationsByType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.type',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this.type', input: '$$value' } }, 0] },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
          statusDistribution: {
            $reduce: {
              input: '$notificationsByStatus',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.status',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this.status', input: '$$value' } }, 0] },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ]);
  }

  public async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: NotificationStatus.READ,
    });
    return result.deletedCount || 0;
  }
}
