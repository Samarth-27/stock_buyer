import { Router, Request, Response } from 'express';
import { IRepository } from '../storage/repository.js';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';
import {
  PortfolioHolding,
  evaluatePortfolioHolding,
  calculatePortfolioSummary,
} from '@marketeye/shared';

export function createPortfolioRouter(
  repository: IRepository,
  provider: MarketDataProvider
): Router {
  const router = Router();

  // GET /api/portfolio - List holdings evaluated with live quotes
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const rawHoldings = await repository.getPortfolioHoldings();
      const quotes = await provider.getAllQuotes();
      const quoteMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

      const evaluatedHoldings: PortfolioHolding[] = await Promise.all(
        rawHoldings.map(async (h) => {
          let q = quoteMap.get(h.symbol.toUpperCase());
          if (!q) {
            q = (await provider.getQuote(h.symbol.toUpperCase())) || undefined;
          }
          return evaluatePortfolioHolding(h, q);
        })
      );

      const summary = calculatePortfolioSummary(evaluatedHoldings);

      res.json({
        holdings: evaluatedHoldings,
        summary,
      });
    } catch (err: any) {
      console.error('[PortfolioRouter] Error getting holdings:', err);
      res.status(500).json({ error: 'Failed to fetch portfolio holdings' });
    }
  });

  // POST /api/portfolio - Add or update a holding
  router.post('/', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (Array.isArray(body)) {
        // Bulk save
        const saved = await repository.savePortfolioHoldings(body);
        return res.json({ success: true, count: saved.length });
      }

      const { symbol, buyPrice, quantity, buyDate, notes } = body;
      if (!symbol || typeof buyPrice !== 'number' || typeof quantity !== 'number') {
        return res.status(400).json({
          error: 'Missing required fields: symbol, buyPrice, quantity',
        });
      }

      const id = body.id || `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const quote = await provider.getQuote(symbol.toUpperCase());

      const newHolding: PortfolioHolding = {
        id,
        symbol: symbol.toUpperCase(),
        companyName: quote?.companyName || body.companyName || symbol.toUpperCase(),
        buyPrice: Number(buyPrice),
        quantity: Number(quantity),
        buyDate: buyDate || new Date().toISOString().split('T')[0],
        notes: notes || '',
      };

      const saved = await repository.addPortfolioHolding(newHolding);
      const evaluated = evaluatePortfolioHolding(saved, quote);

      res.status(201).json(evaluated);
    } catch (err: any) {
      console.error('[PortfolioRouter] Error saving holding:', err);
      res.status(500).json({ error: 'Failed to save portfolio holding' });
    }
  });

  // DELETE /api/portfolio/:id - Delete a holding
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await repository.deletePortfolioHolding(id);
      if (deleted) {
        res.json({ success: true, id });
      } else {
        res.status(404).json({ error: 'Holding not found' });
      }
    } catch (err: any) {
      console.error('[PortfolioRouter] Error deleting holding:', err);
      res.status(500).json({ error: 'Failed to delete holding' });
    }
  });

  return router;
}
