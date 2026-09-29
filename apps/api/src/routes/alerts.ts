import { Router, Request, Response } from 'express';
import { IRepository } from '../storage/repository.js';

export function createAlertsRouter(repository: IRepository): Router {
  const router = Router();

  // GET /api/alerts
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const alerts = await repository.getAlerts(limit);
      res.json(alerts);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/alerts/:id/read
  router.post('/:id/read', async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const success = await repository.markAlertAsRead(id);
      res.json({ success });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/alerts
  router.delete('/', async (_req: Request, res: Response) => {
    try {
      await repository.clearAlerts();
      res.status(204).send();
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
