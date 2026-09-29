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

  // 5. Create Express App
  const app = createApp(providerHolder, scannerEngine, repository, wsServerRef);

  // 6. Create HTTP & WebSocket Server
  const server = http.createServer(app);
  const wsServer = new AppWebSocketServer(server, scannerEngine, initialProvider);
  wsServerRef.current = wsServer;

  // 7. Connect Market Data Feed
  await initialProvider.connect();

  // Initial evaluation across all stocks in feed
  const initialQuotes = await initialProvider.getAllQuotes();
  initialQuotes.forEach((q) => scannerEngine.processQuote(q));

  // 8. Start Listening
  server.listen(PORT, () => {
    console.log(`[MarketEye API] REST Server listening on: http://localhost:${PORT}/api`);
    console.log(`[MarketEye API] Swagger Documentation:     http://localhost:${PORT}/api/docs`);
    console.log(`[MarketEye API] WebSocket Feed:            ws://localhost:${PORT}/ws`);
    console.log(`[MarketEye API] Mode:                      ${initialProvider.name}`);
    console.log('----------------------------------------------------');
  });

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('\n[MarketEye API] Shutting down gracefully...');
    await providerHolder.current.disconnect();
    wsServer.close();
    server.close(() => {
      console.log('[MarketEye API] Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[MarketEye API] Fatal error during startup:', err);
  process.exit(1);
});
