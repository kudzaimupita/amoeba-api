import { app } from './app';
import config from './config/config';
import { connectToDatabase } from './connectDB';
import logger from './utils/logger/logger';

const startServer = async () => {
  await connectToDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`Server (${config.env}) running on port ${config.port}`);
  });

  const onCloseSignal = () => {
    logger.info('Shutting down');
    server.close(() => {
      process.exit();
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', onCloseSignal);
  process.on('SIGTERM', onCloseSignal);
};

startServer();
