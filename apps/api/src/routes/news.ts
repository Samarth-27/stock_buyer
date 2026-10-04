import { Router, Request, Response } from 'express';
import { NewsService } from '../services/NewsService.js';

export function createNewsRouter(newsService: NewsService): Router {
  const router = Router();

  // GET /api/news
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const news = await newsService.getAllMarketNews(limit);
      res.json(news);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stocks/:symbol/news
  router.get('/stock/:symbol', async (req: Request, res: Response) => {
    try {
      const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : String(req.params.symbol);
      const news = await newsService.getNewsForStock(symbol);
      res.json(news);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/news/refresh
  router.post('/refresh', async (_req: Request, res: Response) => {
    try {
      newsService.refreshAllNews().catch(() => {});
      res.json({ success: true, message: 'News refresh initiated' });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
