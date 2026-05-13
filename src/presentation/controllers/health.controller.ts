import { Router, type Request, type Response } from 'express';
import { checkDatabase } from '../../infrastructure/database/connection';

export function createHealthController(): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const db = await checkDatabase();

    const health = {
      status: db.ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? '1.0.0',
      checks: {
        database: db,
      },
    };

    res.status(db.ok ? 200 : 503).json(health);
  });

  return router;
}
