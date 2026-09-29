import { Router, Request, Response } from 'express';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';
import { ScannerEngine } from '../scanner/ScannerEngine.js';
import { createMarketDataProvider } from '../providers/index.js';
import { AppWebSocketServer } from '../websocket/wsServer.js';

interface ProviderSwitchContext {
  getProvider: () => MarketDataProvider;
  setProvider: (provider: MarketDataProvider) => void;
  scannerEngine: ScannerEngine;
  wsServerRef: { current: AppWebSocketServer | null };
}

export function createProviderRouter(ctx: ProviderSwitchContext): Router {
  const router = Router();

  // GET /api/provider
  router.get('/', (_req: Request, res: Response) => {
    const p = ctx.getProvider();
    const statusMsg = (p as any).getStatusMessage ? (p as any).getStatusMessage() : (p.isConnected() ? 'Connected' : 'Disconnected');

    res.json({
      id: p.id,
      name: p.name,
      isMock: p.isMock,
      connected: p.isConnected(),
      statusMessage: statusMsg,
      supportedProviders: [
        {
          id: 'kite',
          name: 'Zerodha Kite Connect',
          requiresCredentials: true,
          docsUrl: 'https://kite.trade/docs/connect/v3/',
          fields: ['apiKey', 'accessToken'],
          description: 'Official API of Zerodha. Provides live order-book depth and quotes across NSE.',
        },
        {
          id: 'upstox',
          name: 'Upstox API (v2 / v3)',
          requiresCredentials: true,
          docsUrl: 'https://upstox.com/developer/api-documentation',
          fields: ['accessToken'],
          description: 'Official Upstox developer feed. Provides TBQ, TSQ, and market depth.',
        },
        {
          id: 'dhan',
          name: 'Dhan HQ API',
          requiresCredentials: true,
          docsUrl: 'https://dhanhq.co/',
          fields: ['clientId', 'accessToken'],
          description: 'Free developer API from Dhan. Direct Personal Access Token from settings.',
        },
        {
          id: 'mock',
          name: 'Mock Simulation Feed (24/7 Demo)',
          requiresCredentials: false,
          description: 'High-fidelity offline market simulator for weekends and off-market testing.',
        },
      ],
    });
  });

  // POST /api/provider/switch
  router.post('/switch', async (req: Request, res: Response) => {
    try {
      const { mode, apiKey, accessToken, clientId } = req.body;
      if (!mode) {
        res.status(400).json({ error: 'Missing required field: mode' });
        return;
      }

      const oldProvider = ctx.getProvider();
      await oldProvider.disconnect();

      const newProvider = createMarketDataProvider(mode, {
        apiKey,
        accessToken,
        clientId,
      });

      // Wire new provider into scanner engine
      newProvider.onTick((quote) => {
        ctx.scannerEngine.processQuote(quote);
      });

      // Update provider reference
      ctx.setProvider(newProvider);

      // Connect new provider
      await newProvider.connect();

      // Hydrate scanner with current quotes
      const quotes = await newProvider.getAllQuotes();
      quotes.forEach((q) => ctx.scannerEngine.processQuote(q));

      const statusMsg = (newProvider as any).getStatusMessage
        ? (newProvider as any).getStatusMessage()
        : newProvider.isConnected()
        ? 'Connected'
        : 'Market data unavailable';

      res.json({
        success: true,
        mode,
        name: newProvider.name,
        isMock: newProvider.isMock,
        connected: newProvider.isConnected(),
        statusMessage: statusMsg,
      });
    } catch (err: any) {
      console.error('[ProviderRouter] Switch error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
