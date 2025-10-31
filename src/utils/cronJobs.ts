import { CronJob } from 'cron';
import { logger } from './logger';
import { FileService } from '@/services/file.service';
import { FileRepository } from '@/repositories/file.repository';
import { NotificationService } from '@/services/notification.service';
import { NotificationRepository } from '@/repositories/notification.repository';
import { JobService } from '@/services/job.service';
import { JobRepository } from '@/repositories/job.repository';
import { File } from '@/models/file.entity';
import { Notification } from '@/models/notification.entity';
import { Job } from '@/models/job.entity';

const fileRepository = new FileRepository(File);
const fileService = new FileService(fileRepository);
const notificationRepository = new NotificationRepository(Notification);
const notificationService = new NotificationService(notificationRepository);
const jobRepository = new JobRepository(Job);
const jobService = new JobService(jobRepository);

export class CronJobManager {
  private static instance: CronJobManager;
  private jobs: Map<string, CronJob> = new Map();

  private constructor() {}

  public static getInstance(): CronJobManager {
    if (!CronJobManager.instance) {
      CronJobManager.instance = new CronJobManager();
    }
    return CronJobManager.instance;
  }

  public startAllJobs(): void {
    this.startFileCleanupJob();
    this.startNotificationCleanupJob();
    this.startFailedNotificationResendJob();
    this.startJobExpiryJob();
    this.startHealthCheckJob();

    logger.info('All cron jobs started');
  }

  public stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Cron job '${name}' stopped`);
    });
    this.jobs.clear();
  }

  public startFileCleanupJob(): void {
    const job = new CronJob(
      '0 2 * * *',
      async () => {
        try {
          logger.info('Starting file cleanup job');
          const deletedCount = await fileService.cleanupExpiredFiles();
          logger.info(`File cleanup completed. Deleted ${deletedCount} files`);
        } catch (error) {
          logger.error('File cleanup job failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    this.jobs.set('fileCleanup', job);
    logger.info('File cleanup job scheduled for 2:00 AM UTC daily');
  }

  public startNotificationCleanupJob(): void {
    const job = new CronJob(
      '0 3 * * *',
      async () => {
        try {
          logger.info('Starting notification cleanup job');
          const deletedCount =
            await notificationService.cleanupOldNotifications(30);
          logger.info(
            `Notification cleanup completed. Deleted ${deletedCount} notifications`
          );
        } catch (error) {
          logger.error('Notification cleanup job failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    this.jobs.set('notificationCleanup', job);
    logger.info('Notification cleanup job scheduled for 3:00 AM UTC daily');
  }

  public startFailedNotificationResendJob(): void {
    const job = new CronJob(
      '*/30 * * * *',
      async () => {
        try {
          logger.info('Starting failed notification resend job');
          const successCount =
            await notificationService.resendFailedNotifications();
          if (successCount > 0) {
            logger.info(
              `Failed notification resend completed. Resent ${successCount} notifications`
            );
          }
        } catch (error) {
          logger.error('Failed notification resend job failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    this.jobs.set('failedNotificationResend', job);
    logger.info('Failed notification resend job scheduled every 30 minutes');
  }

  public startJobExpiryJob(): void {
    const job = new CronJob(
      '0 * * * *',
      async () => {
        try {
          logger.info('Starting job expiry job');
          const expiredCount = await jobService.expireJobs();
          if (expiredCount > 0) {
            logger.info(`Job expiry completed. Expired ${expiredCount} jobs`);
          }
        } catch (error) {
          logger.error('Job expiry job failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    this.jobs.set('jobExpiry', job);
    logger.info('Job expiry job scheduled every hour');
  }

  public startHealthCheckJob(): void {
    const job = new CronJob(
      '*/5 * * * *',
      async () => {
        try {
          const timestamp = new Date().toISOString();
          logger.info(`Health check at ${timestamp}`);
        } catch (error) {
          logger.error('Health check job failed:', error);
        }
      },
      null,
      true,
      'UTC'
    );

    this.jobs.set('healthCheck', job);
    logger.info('Health check job scheduled every 5 minutes');
  }

  public getJobStatus(): { name: string; running: boolean; lastDate?: Date }[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.running,
      lastDate: job.lastDate(),
    }));
  }

  public stopJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`Cron job '${name}' stopped`);
      return true;
    }
    return false;
  }

  public startJob(name: string): boolean {
    switch (name) {
      case 'fileCleanup':
        this.startFileCleanupJob();
        return true;
      case 'notificationCleanup':
        this.startNotificationCleanupJob();
        return true;
      case 'failedNotificationResend':
        this.startFailedNotificationResendJob();
        return true;
      case 'healthCheck':
        this.startHealthCheckJob();
        return true;
      case 'jobExpiry':
        this.startJobExpiryJob();
        return true;
      default:
        return false;
    }
  }
}
