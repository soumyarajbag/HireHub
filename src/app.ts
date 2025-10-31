import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { generalLimiter } from '@/middleware/rate-limiter.middleware';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import routes from '@/routes';

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  public setupErrorHandling(): void {
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: true,
      })
    );
    this.app.use(compression());
    this.app.use(cookieParser());
    this.app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      })
    );
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(generalLimiter);
  }

  private initializeRoutes(): void {
    this.app.use('/api/v1', routes);

    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
      });
    });

    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Express TypeScript Backend API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public getApp(): express.Application {
    return this.app;
  }
}
