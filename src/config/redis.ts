import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

export class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL?.trim();
      const redisHost = process.env.REDIS_HOST?.trim();
      const redisPort = process.env.REDIS_PORT?.trim();

      if (redisUrl && redisUrl.length > 0 && !redisUrl.includes('YOUR_')) {
        try {
          const url = new URL(redisUrl);
          if (!url.protocol || !url.hostname) {
            throw new Error('Invalid URL structure');
          }

          logger.info('Connecting to Redis using REDIS_URL (Upstash format)');

          this.client = createClient({
            url: redisUrl,
            socket: {
              reconnectStrategy: (retries) => {
                if (retries > 10) {
                  logger.error('Redis reconnection limit reached');
                  return new Error('Redis reconnection limit reached');
                }
                return Math.min(retries * 100, 3000);
              },
              connectTimeout: 10000,
              keepAlive: 30000,
            },
          });
        } catch (urlError: any) {
          logger.warn(
            `Invalid REDIS_URL format, falling back to local Redis config`
          );
          logger.warn(
            `Expected format: rediss://default:PASSWORD@ENDPOINT.upstash.io:6380`
          );

          if (redisHost || redisPort) {
            const redisConfig = {
              host: redisHost || 'localhost',
              port: parseInt(redisPort || '6379'),
              password: process.env.REDIS_PASSWORD || undefined,
              tls:
                process.env.REDIS_TLS === 'true' ||
                process.env.REDIS_TLS === '1',
            };

            logger.info(
              `Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`
            );

            this.client = createClient({
              socket: {
                host: redisConfig.host,
                port: redisConfig.port,
                tls: redisConfig.tls,
                reconnectStrategy: (retries: number) => {
                  if (retries > 10) {
                    logger.error('Redis reconnection limit reached');
                    return new Error('Redis reconnection limit reached');
                  }
                  return Math.min(retries * 100, 3000);
                },
              },
              password: redisConfig.password,
            });
          } else {
            logger.warn(
              'No valid Redis configuration found. Redis will be disabled.'
            );
            logger.warn(
              'To enable Redis: Set REDIS_URL or REDIS_HOST/REDIS_PORT in your .env file'
            );
            return;
          }
        }
      } else if (redisHost || redisPort) {
        const redisConfig = {
          host: redisHost || 'localhost',
          port: parseInt(redisPort || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
          tls:
            process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1',
        };

        logger.info(
          `Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`
        );

        this.client = createClient({
          socket: {
            host: redisConfig.host,
            port: redisConfig.port,
            tls: redisConfig.tls,
            reconnectStrategy: (retries: number) => {
              if (retries > 10) {
                logger.error('Redis reconnection limit reached');
                return new Error('Redis reconnection limit reached');
              }
              return Math.min(retries * 100, 3000);
            },
          },
          password: redisConfig.password,
        });
      } else {
        logger.warn('Redis configuration not found. Redis will be disabled.');
        logger.warn(
          'To enable Redis: Set REDIS_URL or REDIS_HOST/REDIS_PORT in your .env file'
        );
        return;
      }

      if (!this.client) {
        logger.warn('Redis client not initialized. Redis will be disabled.');
        return;
      }

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.connect();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Redis disconnection error:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async set(
    key: string,
    value: string,
    expireInSeconds?: number
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.debug('Redis not available, skipping cache set');
      return;
    }

    try {
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.warn('Redis set operation failed:', error);
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      logger.debug('Redis not available, returning null');
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.warn('Redis get operation failed:', error);
      return null;
    }
  }

  public async del(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      logger.debug('Redis not available, skipping cache delete');
      return 0;
    }

    try {
      return await this.client.del(key);
    } catch (error) {
      logger.warn('Redis delete operation failed:', error);
      return 0;
    }
  }

  public async exists(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      logger.debug('Redis not available, returning 0');
      return 0;
    }

    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.warn('Redis exists operation failed:', error);
      return 0;
    }
  }
}
