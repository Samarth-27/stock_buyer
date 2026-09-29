import { Router, Request, Response } from 'express';
import { ScannerEngine } from '../scanner/ScannerEngine.js';
import { ScannerConfigSchema } from '@marketeye/shared';

export function createScannerRouter(scannerEngine: ScannerEngine): Router {
  const router = Router();

  // GET /api/scanner/results
  router.get('/results', (_req: Request, res: Response) => {
    try {
      const results = scannerEngine.getActiveResults();
      res.json(results);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/scanner/config
  router.get('/config', (_req: Request, res: Response) => {
    try {
      const config = scannerEngine.getConfig();
      res.json(config);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // PUT /api/scanner/config
  router.put('/config', async (req: Request, res: Response) => {
    try {
      const validation = ScannerConfigSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.flatten(),
        });
        return;
      }

      const updated = await scannerEngine.updateConfig(validation.data);
      res.json(updated);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
