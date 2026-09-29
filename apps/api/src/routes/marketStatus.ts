import { Router, Request, Response } from 'express';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';
import { getMarketStatusInfo } from '../services/marketStatus.js';

export function createMarketStatusRouter(provider: MarketDataProvider): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const quotes = await provider.getAllQuotes();
      const mode = provider.isMock ? 'mock' : 'provider';
      const info = getMarketStatusInfo(provider.name, mode, quotes.length);
      res.json(info);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
