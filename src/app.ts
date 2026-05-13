import express from 'express';
import { securityHeaders } from './presentation/middlewares/security-headers.middleware';
import { rateLimit } from './presentation/middlewares/rate-limit.middleware';
import { createOrderController } from './presentation/controllers/order.controller';
import { createHealthController } from './presentation/controllers/health.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.usecase';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.usecase';
import { PgOrderRepository } from './infrastructure/repositories/pg-order.repository';
import { getPool } from './infrastructure/database/connection';
import { logger } from './infrastructure/logger';

export function createApp() {
  const app = express();

  // Middlewares globais
  app.use(express.json({ limit: '1mb' }));
  app.use(securityHeaders);

  // Rate limit em rotas sensíveis
  app.use('/auth', rateLimit(15 * 60 * 1000, 10));

  // Dependency Injection — manual, sem container
  const pool = getPool();
  const orderRepository = new PgOrderRepository(pool);
  const createOrderUseCase = new CreateOrderUseCase(orderRepository);
  const cancelOrderUseCase = new CancelOrderUseCase(orderRepository);

  // Rotas
  app.use('/health', createHealthController());
  app.use('/api/v1/orders', createOrderController(createOrderUseCase, cancelOrderUseCase));

  // Error handler global — último middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('unhandled_error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
