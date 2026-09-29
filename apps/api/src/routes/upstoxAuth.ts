import { Router, Request, Response } from 'express';
import { UpstoxDataProvider } from '../providers/UpstoxDataProvider.js';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';
import { ScannerEngine } from '../scanner/ScannerEngine.js';

interface UpstoxAuthContext {
  getProvider: () => MarketDataProvider;
  setProvider: (provider: MarketDataProvider) => void;
  scannerEngine: ScannerEngine;
}

export function createUpstoxAuthRouter(ctx: UpstoxAuthContext): Router {
  const router = Router();

  // GET /api/auth/upstox/login -> Redirect to Upstox Login Dialog
  router.get('/login', (req: Request, res: Response) => {
    const apiKey = (req.query.apiKey as string) || process.env.UPSTOX_API_KEY;
    const redirectUri =
      (req.query.redirectUri as string) ||
      process.env.UPSTOX_REDIRECT_URI ||
      'http://localhost:3001/api/auth/upstox/callback';

    if (!apiKey) {
      res.status(400).send(
        'Missing UPSTOX_API_KEY. Please provide your Upstox API key in .env or via settings.'
      );
      return;
    }

    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(
      apiKey
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.redirect(authUrl);
  });

  // GET /api/auth/upstox/callback -> OAuth 2.0 Code Exchange
  router.get('/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Authorization failed: No authorization code received from Upstox.');
      return;
    }

    const apiKey = process.env.UPSTOX_API_KEY;
    const apiSecret = process.env.UPSTOX_API_SECRET;
    const redirectUri =
      process.env.UPSTOX_REDIRECT_URI || 'http://localhost:3001/api/auth/upstox/callback';

    if (!apiKey || !apiSecret) {
      res.status(400).send(
        'Missing UPSTOX_API_KEY or UPSTOX_API_SECRET in environment to complete token exchange.'
      );
      return;
    }

    try {
      const tokenUrl = 'https://api.upstox.com/v2/login/authorization/token';
      const formParams = new URLSearchParams({
        code,
        client_id: apiKey,
        client_secret: apiSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: formParams.toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        res.status(500).send(`Failed to exchange token with Upstox: ${errText}`);
        return;
      }

      const tokenData = (await tokenRes.json()) as { access_token: string; user_name?: string };
      const accessToken = tokenData.access_token;

      // Initialize live Upstox provider
      const oldProvider = ctx.getProvider();
      await oldProvider.disconnect();

      const upstoxProvider = new UpstoxDataProvider(apiKey, accessToken);
      ctx.setProvider(upstoxProvider);

      upstoxProvider.onTick((quote) => {
        ctx.scannerEngine.processQuote(quote);
      });

      await upstoxProvider.connect();

      // Redirect user back to frontend dashboard
      res.redirect('http://localhost:5173/?feed=upstox_connected');
    } catch (err: any) {
      console.error('[UpstoxAuth] Token exchange error:', err);
      res.status(500).send(`Internal error during Upstox token exchange: ${err.message}`);
    }
  });

  return router;
}
