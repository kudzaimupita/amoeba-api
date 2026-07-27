import config from './config/config';
import { logger } from './utils/logger';
import mongoose from 'mongoose';
import { installQueryPerformanceTracking } from './middlewares/queryPerformancePlugin';

export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoose.url);
    logger.info('Successfully connected to the database');
    installQueryPerformanceTracking();
  } catch (error) {
    logger.error('Database connection error', error);
    process.exit(1);
  }
};
