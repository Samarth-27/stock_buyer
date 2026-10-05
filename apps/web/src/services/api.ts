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
  StockNewsItem,
  PortfolioHolding,
  PortfolioSummary,
} from '@marketeye/shared';

export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('marketeye_backend_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }
  return '';
}

export function getApiBaseUrl(): string {
  const base = getBackendBaseUrl();
  return base ? `${base}/api` : '/api';
}

export function setCustomBackendUrl(url: string | null): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('marketeye_backend_url', url.trim().replace(/\/$/, ''));
    } else {
      localStorage.removeItem('marketeye_backend_url');
    }
  }
}

export async function testBackendConnection(url?: string): Promise<{ ok: boolean; status?: string; message?: string }> {
  try {
    const base = url !== undefined ? url.trim().replace(/\/$/, '') : getBackendBaseUrl();
    const endpoint = base ? `${base}/api/health` : '/api/health';
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, status: data.status, message: `Connected to ${data.service || 'MarketEye API'} (${data.provider?.name || 'Mock'})` };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
}

export async function fetchHealth(): Promise<{ status: string; uptimeSeconds: number; provider: any }> {
  const res = await fetch(`${getApiBaseUrl()}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchMarketStatus(): Promise<MarketStatusInfo> {
  const res = await fetch(`${getApiBaseUrl()}/market-status`);
  if (!res.ok) throw new Error('Failed to fetch market status');
  return res.json();
}

export async function fetchAllStocks(search?: string): Promise<StockQuote[]> {
  const url = search ? `${getApiBaseUrl()}/stocks?search=${encodeURIComponent(search)}` : `${getApiBaseUrl()}/stocks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch stocks');
  return res.json();
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`${getApiBaseUrl()}/stocks/${encodeURIComponent(symbol)}/quote`);
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
  return res.json();
}

export async function fetchStockOrderBook(symbol: string): Promise<OrderBook> {
  const res = await fetch(`${getApiBaseUrl()}/stocks/${encodeURIComponent(symbol)}/order-book`);
  if (!res.ok) throw new Error(`Failed to fetch order book for ${symbol}`);
  return res.json();
}

export async function fetchStockHistory(
  symbol: string,
  interval: ChartInterval = '5m',
  range: ChartRange = '1d'
): Promise<HistoricalCandle[]> {
  const res = await fetch(
    `${getApiBaseUrl()}/stocks/${encodeURIComponent(symbol)}/history?interval=${interval}&range=${range}`
  );
  if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}`);
  return res.json();
}

export async function fetchScannerResults(): Promise<ScannerResult[]> {
  const res = await fetch(`${getApiBaseUrl()}/scanner/results`);
  if (!res.ok) throw new Error('Failed to fetch scanner results');
  return res.json();
}

export async function rescanScanner(): Promise<ScannerResult[]> {
  const res = await fetch(`${getApiBaseUrl()}/scanner/rescan`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger scanner rescan');
  return res.json();
}

export async function fetchScannerConfig(): Promise<ScannerRuleConfig> {
  const res = await fetch(`${getApiBaseUrl()}/scanner/config`);
  if (!res.ok) throw new Error('Failed to fetch scanner config');
  return res.json();
}

export async function updateScannerConfig(
  config: Partial<ScannerRuleConfig>
): Promise<ScannerRuleConfig> {
  const res = await fetch(`${getApiBaseUrl()}/scanner/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update scanner config');
  return res.json();
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/watchlist`);
  if (!res.ok) throw new Error('Failed to fetch watchlist');
  return res.json();
}

export async function addToWatchlist(symbol: string, notes?: string): Promise<WatchlistItem> {
  const res = await fetch(`${getApiBaseUrl()}/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, notes }),
  });
  if (!res.ok) throw new Error('Failed to add to watchlist');
  return res.json();
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/watchlist/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove from watchlist');
}

export async function fetchAlerts(): Promise<MarketAlert[]> {
  const res = await fetch(`${getApiBaseUrl()}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function markAlertRead(id: string): Promise<void> {
  await fetch(`${getApiBaseUrl()}/alerts/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export async function clearAllAlerts(): Promise<void> {
  await fetch(`${getApiBaseUrl()}/alerts`, { method: 'DELETE' });
}

export interface ProviderInfo {
  id: string;
  name: string;
  isMock: boolean;
  connected: boolean;
  statusMessage: string;
  supportedProviders: Array<{
    id: string;
    name: string;
    requiresCredentials: boolean;
    docsUrl?: string;
    fields?: string[];
    description: string;
  }>;
}

export async function fetchProviderInfo(): Promise<ProviderInfo> {
  const res = await fetch(`${getApiBaseUrl()}/provider`);
  if (!res.ok) throw new Error('Failed to fetch provider info');
  return res.json();
}

export async function switchProviderMode(payload: {
  mode: string;
  apiKey?: string;
  accessToken?: string;
  clientId?: string;
}): Promise<any> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/provider/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to switch provider' }));
      throw new Error(err.error || 'Failed to switch provider');
    }
    return res.json();
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    const backend = getBackendBaseUrl();
    throw new Error(
      backend
        ? `Cannot connect to remote MarketEye API at ${backend}. Ensure your Render.com service is active.`
        : 'Cannot connect to MarketEye backend API. Please make sure the local server is running via `npm run dev` at http://localhost:5173, or configure your Render.com cloud URL in Settings.'
    );
  }
}

export async function angelOneLogin(payload: {
  clientCode: string;
  pin: string;
  totp: string;
  apiKey: string;
}): Promise<any> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/provider/angel-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Angel One login failed' }));
      throw new Error(err.error || 'Angel One login failed');
    }
    return res.json();
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    const backend = getBackendBaseUrl();
    throw new Error(
      backend
        ? `Cannot connect to remote MarketEye API at ${backend}. Ensure your Render.com service is active.`
        : 'Cannot connect to MarketEye backend API. Please make sure the local server is running via `npm run dev` at http://localhost:5173, or configure your Render.com cloud URL in Settings.'
    );
  }
}

export async function fetchMarketNews(limit = 30): Promise<StockNewsItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/news?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch market news');
  return res.json();
}

export async function fetchStockNews(symbol: string): Promise<StockNewsItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/news/stock/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to fetch news for ${symbol}`);
  return res.json();
}

const LOCAL_STORAGE_PORTFOLIO_KEY = 'marketeye_manual_portfolio_holdings';

export function loadPortfolioHoldingsLocally(): PortfolioHolding[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[MarketEye API] Failed to parse local portfolio:', err);
    return [];
  }
}

export function savePortfolioHoldingsLocally(holdings: PortfolioHolding[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PORTFOLIO_KEY, JSON.stringify(holdings));
  } catch (err) {
    console.warn('[MarketEye API] Failed to save local portfolio:', err);
  }
}

export async function fetchPortfolioData(): Promise<{
  holdings: PortfolioHolding[];
  summary?: PortfolioSummary;
}> {
  // Always check remote first if possible, fall back to local
  try {
    const res = await fetch(`${getApiBaseUrl()}/portfolio`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.holdings) && data.holdings.length > 0) {
        savePortfolioHoldingsLocally(data.holdings);
        return data;
      }
    }
  } catch {
    // Backend offline or running purely client-side
  }

  const localHoldings = loadPortfolioHoldingsLocally();
  return { holdings: localHoldings };
}

export async function addPortfolioHoldingRemote(
  holding: Omit<PortfolioHolding, 'id'> & { id?: string }
): Promise<PortfolioHolding> {
  const fullHolding: PortfolioHolding = {
    ...holding,
    id: holding.id || `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };

  // Sync locally first
  const current = loadPortfolioHoldingsLocally();
  const existingIdx = current.findIndex((h) => h.id === fullHolding.id);
  if (existingIdx >= 0) {
    current[existingIdx] = fullHolding;
  } else {
    current.push(fullHolding);
  }
  savePortfolioHoldingsLocally(current);

  // Sync remotely if available
  try {
    const res = await fetch(`${getApiBaseUrl()}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullHolding),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline or client-only mode
  }

  return fullHolding;
}

export async function deletePortfolioHoldingRemote(id: string): Promise<void> {
  const current = loadPortfolioHoldingsLocally().filter((h) => h.id !== id);
  savePortfolioHoldingsLocally(current);

  try {
    await fetch(`${getApiBaseUrl()}/portfolio/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    // Offline or client-only mode
  }
}



