import { config } from '@/config/environment';
import { DatabaseConfig } from '@/config/database';
import { RedisConfig } from '@/config/redis';

const databaseConfig = DatabaseConfig.getInstance();
const redisConfig = RedisConfig.getInstance();

beforeAll(async () => {
  if (config.env === 'test') {
    await databaseConfig.connect();
    await redisConfig.connect();
  }
});

afterAll(async () => {
  if (config.env === 'test') {
    await databaseConfig.disconnect();
    await redisConfig.disconnect();
  }
});

beforeEach(async () => {
  if (config.env === 'test') {
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});
