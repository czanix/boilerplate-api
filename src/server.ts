import { createApp } from './app';
import { logger } from './infrastructure/logger';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = createApp();

app.listen(PORT, () => {
  logger.info('server_started', { port: PORT, env: process.env.NODE_ENV ?? 'development' });
});
