import { Router, Request, Response } from 'express';
import { IRepository } from '../storage/repository.js';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';
import { WatchlistAddSchema } from '@marketeye/shared';

export function createWatchlistRouter(
  repository: IRepository,
  provider: MarketDataProvider
): Router {
  const router = Router();

  // GET /api/watchlist
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const items = await repository.getWatchlist();
      // Enrich with current quotes
      const enriched = await Promise.all(
        items.map(async (item) => {
          const quote = await provider.getQuote(item.symbol);
          return {
            ...item,
            quote: quote || undefined,
          };
        })
      );
      res.json(enriched);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/watchlist
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validation = WatchlistAddSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.flatten(),
        });
        return;
      }

      const quote = await provider.getQuote(validation.data.symbol);
      const companyName = validation.data.companyName || quote?.companyName || validation.data.symbol;

      const added = await repository.addToWatchlist({
        symbol: validation.data.symbol,
        companyName,
        notes: validation.data.notes,
        addedAt: new Date().toISOString(),
      });

      res.status(201).json(added);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/watchlist/:symbol
  router.delete('/:symbol', async (req: Request, res: Response) => {
    try {
      const symbol = (Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol)).toUpperCase();
      const removed = await repository.removeFromWatchlist(symbol);
      if (!removed) {
        res.status(404).json({ error: `Symbol ${symbol} not found in watchlist` });
        return;
      }
      res.json({ success: true, message: `Removed ${symbol} from watchlist` });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
