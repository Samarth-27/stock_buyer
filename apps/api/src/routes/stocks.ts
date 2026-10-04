import { Router, Request, Response } from 'express';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';
import { ChartInterval, ChartRange } from '@marketeye/shared';
import { NewsService } from '../services/NewsService.js';

export function createStocksRouter(provider: MarketDataProvider, newsService?: NewsService): Router {
  const router = Router();

  // GET /api/stocks
  router.get('/', async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string)?.toUpperCase();
      if (search && (provider as any).searchAndHydrate) {
        await (provider as any).searchAndHydrate(search).catch(() => {});
      }

      let quotes = await provider.getAllQuotes();
      if (search) {
        quotes = quotes.filter(
          (q) => q.symbol.includes(search) || q.companyName.toUpperCase().includes(search)
        );
      }
      res.json(quotes);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stocks/:symbol
  router.get('/:symbol', async (req: Request, res: Response) => {
    try {
      const symbol = (Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol)).toUpperCase();
      const quote = await provider.getQuote(symbol);
      if (!quote) {
        res.status(404).json({ error: `Stock symbol ${symbol} not found` });
        return;
      }
      res.json(quote);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stocks/:symbol/quote
  router.get('/:symbol/quote', async (req: Request, res: Response) => {
    try {
      const symbol = (Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol)).toUpperCase();
      const quote = await provider.getQuote(symbol);
      if (!quote) {
        res.status(404).json({ error: `Quote for ${symbol} not found` });
        return;
      }
      res.json(quote);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stocks/:symbol/order-book
  router.get('/:symbol/order-book', async (req: Request, res: Response) => {
    try {
      const symbol = (Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol)).toUpperCase();
      const orderBook = await provider.getOrderBook(symbol);
      if (!orderBook) {
        res.status(404).json({ error: `Order book for ${symbol} not found` });
        return;
      }
      res.json(orderBook);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stocks/:symbol/history
  router.get('/:symbol/history', async (req: Request, res: Response) => {
    try {
      const symbol = (Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol)).toUpperCase();
      const interval = (req.query.interval as ChartInterval) || '5m';
      const range = (req.query.range as ChartRange) || '1d';
      const history = await provider.getHistoricalData(symbol, interval, range);
      res.json(history);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stocks/:symbol/news (Convenience alias)
  router.get('/:symbol/news', async (req: Request, res: Response) => {
    try {
      const symbol = (Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol)).toUpperCase();
      if (newsService) {
        const news = await newsService.getNewsForStock(symbol);
        res.json(news);
      } else {
        res.json([]);
      }
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
