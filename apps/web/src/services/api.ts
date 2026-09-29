import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ScannerRuleConfig,
  ScannerResult,
  WatchlistItem,
  MarketAlert,
  MarketStatusInfo,
  ChartInterval,
  ChartRange,
} from '@marketeye/shared';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; uptimeSeconds: number; provider: any }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchMarketStatus(): Promise<MarketStatusInfo> {
  const res = await fetch(`${API_BASE}/market-status`);
  if (!res.ok) throw new Error('Failed to fetch market status');
  return res.json();
}

export async function fetchAllStocks(search?: string): Promise<StockQuote[]> {
  const url = search ? `${API_BASE}/stocks?search=${encodeURIComponent(search)}` : `${API_BASE}/stocks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch stocks');
  return res.json();
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/quote`);
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
  return res.json();
}

export async function fetchStockOrderBook(symbol: string): Promise<OrderBook> {
  const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/order-book`);
  if (!res.ok) throw new Error(`Failed to fetch order book for ${symbol}`);
  return res.json();
}

export async function fetchStockHistory(
  symbol: string,
  interval: ChartInterval = '5m',
  range: ChartRange = '1d'
): Promise<HistoricalCandle[]> {
  const res = await fetch(
    `${API_BASE}/stocks/${encodeURIComponent(symbol)}/history?interval=${interval}&range=${range}`
  );
  if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}`);
  return res.json();
}

export async function fetchScannerResults(): Promise<ScannerResult[]> {
  const res = await fetch(`${API_BASE}/scanner/results`);
  if (!res.ok) throw new Error('Failed to fetch scanner results');
  return res.json();
}

export async function fetchScannerConfig(): Promise<ScannerRuleConfig> {
  const res = await fetch(`${API_BASE}/scanner/config`);
  if (!res.ok) throw new Error('Failed to fetch scanner config');
  return res.json();
}

export async function updateScannerConfig(
  config: Partial<ScannerRuleConfig>
): Promise<ScannerRuleConfig> {
  const res = await fetch(`${API_BASE}/scanner/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update scanner config');
  return res.json();
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const res = await fetch(`${API_BASE}/watchlist`);
  if (!res.ok) throw new Error('Failed to fetch watchlist');
  return res.json();
}

export async function addToWatchlist(symbol: string, notes?: string): Promise<WatchlistItem> {
  const res = await fetch(`${API_BASE}/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, notes }),
  });
  if (!res.ok) throw new Error('Failed to add to watchlist');
  return res.json();
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove from watchlist');
}

export async function fetchAlerts(): Promise<MarketAlert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function markAlertRead(id: string): Promise<void> {
  await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export async function clearAllAlerts(): Promise<void> {
  await fetch(`${API_BASE}/alerts`, { method: 'DELETE' });
}
