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
import { createMarketStatusRouter } from './routes/marketStatus.js';
import { createHealthRouter } from './routes/health.js';
import { openApiSpec } from './docs/swagger.js';

export function createApp(
  provider: MarketDataProvider,
  scannerEngine: ScannerEngine,
  repository: IRepository
): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render smoothly
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, true); // Dev-friendly permissive for local testing
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

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

  // Mount API Routers
  app.use('/api/health', createHealthRouter(provider));
  app.use('/api/market-status', createMarketStatusRouter(provider));
  app.use('/api/stocks', createStocksRouter(provider));
  app.use('/api/scanner', createScannerRouter(scannerEngine));
  app.use('/api/watchlist', createWatchlistRouter(repository, provider));
  app.use('/api/alerts', createAlertsRouter(repository));

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
