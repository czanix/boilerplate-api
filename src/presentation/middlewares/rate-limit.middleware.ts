import type { Request, Response, NextFunction } from 'express';

const requests = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter simples em memória.
 * Para produção com múltiplas instâncias, use Redis.
 */
export function rateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now > entry.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
      return;
    }

    entry.count++;
    next();
  };
}
