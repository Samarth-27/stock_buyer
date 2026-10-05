import dotenv from 'dotenv';
import http from 'http';
import path from 'path';

// Load .env from root or apps/api
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config(); // fallback local .env

import { repository } from './storage/repository.js';
import { createMarketDataProvider } from './providers/index.js';
import { ScannerEngine } from './scanner/ScannerEngine.js';
import { createApp } from './app.js';
import { AppWebSocketServer } from './websocket/wsServer.js';
import { NewsService } from './services/NewsService.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('  MarketEye — Autonomous Stock Market Scanner (NSE)');
  console.log('----------------------------------------------------');

  // 1. Initialize Scanner Engine with persistent repository
  const scannerEngine = new ScannerEngine(repository);
  await scannerEngine.init();

  // 2. Initialize Market Data Provider (Mock or Broker)
  const initialProvider = createMarketDataProvider();
  const providerHolder = { current: initialProvider };

  // 3. Connect Scanner Engine to Provider Ticks
  initialProvider.onTick((quote) => {
    scannerEngine.processQuote(quote);
  });

  // 4. Create references
  const wsServerRef: { current: AppWebSocketServer | null } = { current: null };

  // 5. Initialize Financial News & Sentiment Engine
  const newsService = new NewsService(repository, wsServerRef);
  await newsService.init();

  // 6. Create Express App
  const app = createApp(providerHolder, scannerEngine, repository, wsServerRef, newsService);

  // 7. Create HTTP & WebSocket Server
  const server = http.createServer(app);
  const wsServer = new AppWebSocketServer(server, scannerEngine, initialProvider);
  wsServerRef.current = wsServer;

  // 7. Connect Market Data Feed
  await initialProvider.connect();

  // Initial evaluation across all stocks in feed
  const initialQuotes = await initialProvider.getAllQuotes();
  initialQuotes.forEach((q) => scannerEngine.processQuote(q));

  // 8. Start Listening
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`[MarketEye API] REST Server listening on: http://${HOST}:${PORT}/api`);
    console.log(`[MarketEye API] Swagger Documentation:     http://${HOST}:${PORT}/api/docs`);
    console.log(`[MarketEye API] WebSocket Feed:            ws://${HOST}:${PORT}/ws`);
    console.log(`[MarketEye API] Mode:                      ${initialProvider.name}`);
    console.log('----------------------------------------------------');
  });

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('\n[MarketEye API] Shutting down gracefully...');
    newsService.stop();
    await providerHolder.current.disconnect();
    wsServer.close();
    server.close(() => {
      console.log('[MarketEye API] Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  process.on('unhandledRejection', (reason) => {
    console.warn('[MarketEye API] Handled UnhandledRejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[MarketEye API] Handled UncaughtException:', err);
  });
}

bootstrap().catch((err) => {
  console.error('[MarketEye API] Fatal error during startup:', err);
  process.exit(1);
});
