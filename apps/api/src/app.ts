import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { MarketDataProvider } from './providers/MarketDataProvider.js';
import { ScannerEngine } from './scanner/ScannerEngine.js';
import { IRepository } from './storage/repository.js';
import { createStocksRouter } from './routes/stocks.js';
import { createScannerRouter } from './routes/scanner.js';
import { createWatchlistRouter } from './routes/watchlist.js';
import { createAlertsRouter } from './routes/alerts.js';
import { createPortfolioRouter } from './routes/portfolio.js';
import { createMarketStatusRouter } from './routes/marketStatus.js';
import { createHealthRouter } from './routes/health.js';
import { createProviderRouter } from './routes/provider.js';
import { createUpstoxAuthRouter } from './routes/upstoxAuth.js';
import { createNewsRouter } from './routes/news.js';
import { NewsService } from './services/NewsService.js';
import { openApiSpec } from './docs/swagger.js';
import { AppWebSocketServer } from './websocket/wsServer.js';

export interface ProviderHolder {
  current: MarketDataProvider;
}

export function createApp(
  providerHolder: ProviderHolder,
  scannerEngine: ScannerEngine,
  repository: IRepository,
  wsServerRef?: { current: AppWebSocketServer | null },
  newsService?: NewsService
): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      if (
        origin === allowedOrigin ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.github.io') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('github.io')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Welcome Route for root (e.g. visiting https://<app>.onrender.com directly)
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'MarketEye Autonomous Indian Stock Scanner API',
      status: 'active',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health',
      frontend: 'https://samarth-27.github.io/stock_buyer/',
    });
  });

  // Rate Limiting (300 requests per 1 minute window)
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // JSON Body Parser with strict limit
  app.use(express.json({ limit: '100kb' }));

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Dynamic Provider proxy so routes always query the active provider
  const dynamicProviderProxy = new Proxy({} as MarketDataProvider, {
    get(_target, prop) {
      const p = providerHolder.current as any;
      const val = p[prop];
      if (typeof val === 'function') {
        return val.bind(p);
      }
      return val;
    },
  });

  // Mount API Routers
  app.use('/api/health', createHealthRouter(dynamicProviderProxy));
  app.use('/api/market-status', createMarketStatusRouter(dynamicProviderProxy));
  app.use('/api/stocks', createStocksRouter(dynamicProviderProxy, newsService));
  app.use('/api/scanner', createScannerRouter(scannerEngine));
  app.use('/api/watchlist', createWatchlistRouter(repository, dynamicProviderProxy));
  app.use('/api/portfolio', createPortfolioRouter(repository, dynamicProviderProxy));
  app.use('/api/alerts', createAlertsRouter(repository));
  app.use(
    '/api/provider',
    createProviderRouter({
      getProvider: () => providerHolder.current,
      setProvider: (newP) => {
        providerHolder.current = newP;
        if (wsServerRef?.current) {
          wsServerRef.current.setProvider(newP);
        }
      },
      scannerEngine,
      wsServerRef: wsServerRef || { current: null },
    })
  );

  app.use(
    '/api/auth/upstox',
    createUpstoxAuthRouter({
      getProvider: () => providerHolder.current,
      setProvider: (newP) => {
        providerHolder.current = newP;
        if (wsServerRef?.current) {
          wsServerRef.current.setProvider(newP);
        }
      },
      scannerEngine,
    })
  );

  if (newsService) {
    app.use('/api/news', createNewsRouter(newsService));
  }

  // 404 Handler
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]:', err.stack);
    res.status(500).json({
      error: 'An internal server error occurred',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}
