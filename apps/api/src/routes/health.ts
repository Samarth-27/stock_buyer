import { Router, Request, Response } from 'express';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';

export function createHealthRouter(provider: MarketDataProvider): Router {
  const router = Router();
  const startTime = Date.now();

  router.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'MarketEye API',
      version: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      provider: {
        id: provider.id,
        name: provider.name,
        isMock: provider.isMock,
        connected: provider.isConnected(),
      },
      storage: 'json-repository',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
