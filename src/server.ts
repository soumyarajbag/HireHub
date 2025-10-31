import http from 'http';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { DatabaseConfig } from '@/config/database';
import { RedisConfig } from '@/config/redis';
import { CloudinaryConfig } from '@/config/cloudinary';
import { EmailService } from '@/utils/email';
import { CronJobManager } from '@/utils/cronJobs';
import { SocketManager } from '@/utils/socket';
import { App } from './app';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger';

class Server {
  private app: App;
  private server: http.Server | null = null;
  private databaseConfig: DatabaseConfig;
  private redisConfig: RedisConfig;
  private cloudinaryConfig: CloudinaryConfig;
  private emailService: EmailService;
  private cronJobManager: CronJobManager;
  private socketManager: SocketManager;

  constructor() {
    this.app = new App();
    this.databaseConfig = DatabaseConfig.getInstance();
    this.redisConfig = RedisConfig.getInstance();
    this.cloudinaryConfig = CloudinaryConfig.getInstance();
    this.emailService = EmailService.getInstance();
    this.cronJobManager = CronJobManager.getInstance();
    this.socketManager = SocketManager.getInstance();
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();
      this.setupSwagger();
      this.startServer();
      this.setupGracefulShutdown();
      
      logger.info(`Server started on port ${config.port} in ${config.env} mode`);
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async initializeServices(): Promise<void> {
    logger.info('Initializing services...');
    
    await this.databaseConfig.connect();
    await this.redisConfig.connect();
    this.cloudinaryConfig.configure();
    await this.emailService.initialize();
    
    logger.info('All services initialized successfully');
  }

  private setupSwagger(): void {
    this.app.getApp().use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    logger.info('Swagger documentation available at /api-docs');
  }

  private startServer(): void {
    this.server = http.createServer(this.app.getApp());
    this.socketManager.initialize(this.server);
    this.cronJobManager.startAllJobs();
    
    this.server.listen(config.port, () => {
      logger.info(`HTTP server listening on port ${config.port}`);
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            this.cronJobManager.stopAllJobs();
            await this.redisConfig.disconnect();
            await this.databaseConfig.disconnect();
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

const server = new Server();
server.start();
