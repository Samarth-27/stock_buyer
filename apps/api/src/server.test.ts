import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from './app.js';
import { MockMarketDataProvider } from './providers/MockMarketDataProvider.js';
import { ScannerEngine } from './scanner/ScannerEngine.js';
import { JsonFileRepository } from './storage/repository.js';

describe('MarketEye Backend API Integration Tests', () => {
  let app: Express;
  let provider: MockMarketDataProvider;
  let scannerEngine: ScannerEngine;
  let repository: JsonFileRepository;

  beforeAll(async () => {
    provider = new MockMarketDataProvider();
    await provider.connect();

    repository = new JsonFileRepository();
    await repository.updateScannerConfig({ buyThreshold: 60.0, sellThreshold: 40.0 });
    scannerEngine = new ScannerEngine(repository);
    await scannerEngine.init();

    // Wire ticks
    provider.onTick((q) => scannerEngine.processQuote(q));

    // Populate initial quotes
    const quotes = await provider.getAllQuotes();
    quotes.forEach((q) => scannerEngine.processQuote(q));

    app = createApp(provider, scannerEngine, repository);
  });

  it('GET /api/health returns 200 OK with provider status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.provider.isMock).toBe(true);
    expect(res.body.provider.connected).toBe(true);
  });

  it('GET /api/market-status returns IST session and trading schedule', async () => {
    const res = await request(app).get('/api/market-status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(res.body.serverTimeIST).toContain('IST');
    expect(res.body.tradingHours).toContain('09:15');
  });

  it('GET /api/stocks returns all monitored stocks with calculated buy/sell percentages', async () => {
    const res = await request(app).get('/api/stocks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(15);

    const first = res.body[0];
    expect(first.symbol).toBeDefined();
    expect(first.ltp).toBeGreaterThan(0);
    expect(first.totalBuyQuantity).toBeGreaterThan(0);
    expect(first.totalSellQuantity).toBeGreaterThan(0);
    expect(first.buyPercentage + first.sellPercentage).toBeCloseTo(100, 1);
  });

  it('GET /api/stocks/:symbol returns specific stock quote and details', async () => {
    const res = await request(app).get('/api/stocks/RELIANCE');
    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe('RELIANCE');
    expect(res.body.companyName).toContain('Reliance');
    expect(res.body.ltp).toBeGreaterThan(1000);
  });

  it('GET /api/stocks/:symbol/order-book returns 5-level market depth with bids and asks', async () => {
    const res = await request(app).get('/api/stocks/RELIANCE/order-book');
    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe('RELIANCE');
    expect(res.body.bids.length).toBe(5);
    expect(res.body.asks.length).toBe(5);
    expect(res.body.bids[0].price).toBeGreaterThan(res.body.bids[1].price); // Bids sorted descending
    expect(res.body.asks[0].price).toBeLessThan(res.body.asks[1].price);    // Asks sorted ascending
    expect(res.body.buyPercentage).toBeGreaterThan(0);
  });

  it('GET /api/stocks/:symbol/history returns historical candlestick series', async () => {
    const res = await request(app).get('/api/stocks/TCS/history?interval=5m&range=1d');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(10);
    expect(res.body[0]).toHaveProperty('open');
    expect(res.body[0]).toHaveProperty('high');
    expect(res.body[0]).toHaveProperty('low');
    expect(res.body[0]).toHaveProperty('close');
    expect(res.body[0]).toHaveProperty('volume');
  });

  it('GET /api/scanner/results returns surfaced stocks meeting configured rule', async () => {
    const res = await request(app).get('/api/scanner/results');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Any surfaced stock must have buyPercentage >= 60%
    res.body.forEach((item: any) => {
      expect(item.buyPercentage).toBeGreaterThanOrEqual(60.0);
      expect(item.sellPercentage).toBeLessThanOrEqual(40.0);
      expect(item.reason).toContain('exceeding your');
      expect(item.reason).toContain('threshold');
    });
  });

  it('PUT /api/scanner/config updates thresholds and returns updated config', async () => {
    const res = await request(app).put('/api/scanner/config').send({
      buyThreshold: 62.0,
      sellThreshold: 38.0,
      minVolume: 15000,
    });
    expect(res.status).toBe(200);
    expect(res.body.buyThreshold).toBe(62.0);
    expect(res.body.sellThreshold).toBe(38.0);
    expect(res.body.minVolume).toBe(15000);
  });

  it('GET /api/watchlist and POST /api/watchlist manage custom watched stocks', async () => {
    // Add stock
    const addRes = await request(app).post('/api/watchlist').send({
      symbol: 'INFY',
      notes: 'Testing watchlist integration',
    });
    expect(addRes.status).toBe(201);
    expect(addRes.body.symbol).toBe('INFY');

    // Get watchlist
    const getRes = await request(app).get('/api/watchlist');
    expect(getRes.status).toBe(200);
    const symbols = getRes.body.map((i: any) => i.symbol);
    expect(symbols).toContain('INFY');

    // Delete stock
    const delRes = await request(app).delete('/api/watchlist/INFY');
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
