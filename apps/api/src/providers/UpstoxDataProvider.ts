import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
  calculateBuySellPercentages,
  calculateOrderBookImbalance,
  MONITORED_NSE_STOCKS,
  MarketDepthEntry,
} from '@marketeye/shared';
import { MarketDataProvider } from './MarketDataProvider.js';

interface UpstoxDepthItem {
  quantity: number;
  price: number;
  orders: number;
}

interface UpstoxQuoteItem {
  last_price: number;
  volume: number;
  tbq: number; // Total Buy Quantity
  tsq: number; // Total Sell Quantity
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  depth: {
    buy: UpstoxDepthItem[];
    sell: UpstoxDepthItem[];
  };
  timestamp: string;
}

export class UpstoxDataProvider implements MarketDataProvider {
  readonly id = 'upstox-feed';
  readonly name = 'Upstox API v2/v3 (Live Production Feed)';
  readonly isMock = false;

  private apiKey: string;
  private accessToken: string;
  private connected: boolean = false;
  private statusMessage: string = 'Initializing...';
  private pollInterval: NodeJS.Timeout | null = null;
  private quotesCache: Map<string, StockQuote> = new Map();
  private orderBooksCache: Map<string, OrderBook> = new Map();
  private tickListeners: Set<(quote: StockQuote) => void> = new Set();
  private orderBookListeners: Set<(orderBook: OrderBook) => void> = new Set();

  constructor(apiKey?: string, accessToken?: string) {
    this.apiKey = apiKey || process.env.UPSTOX_API_KEY || '';
    this.accessToken = accessToken || process.env.UPSTOX_ACCESS_TOKEN || '';
  }

  setCredentials(apiKey: string, accessToken: string): void {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  async connect(): Promise<void> {
    if (!this.accessToken) {
      this.connected = false;
      this.statusMessage =
        'Market data unavailable: UPSTOX_ACCESS_TOKEN is missing. Please provide your Upstox access token to connect to live market data.';
      console.warn(`[UpstoxDataProvider] ${this.statusMessage}`);
      return;
    }

    try {
      console.log('[UpstoxDataProvider] Validating Upstox access token and fetching live market quotes...');
      const success = await this.fetchLiveQuotes();
      if (success) {
        this.connected = true;
        this.statusMessage = 'Connected to Live NSE Market Feed (Upstox)';
        console.log('[UpstoxDataProvider] Successfully connected to live Upstox feed.');

        // Poll every 1.5 seconds during active session
        this.pollInterval = setInterval(() => {
          this.fetchLiveQuotes().catch((err) => {
            console.error('[UpstoxDataProvider] Poll error:', err.message);
          });
        }, 1500);
      } else {
        this.connected = false;
      }
    } catch (err: any) {
      this.connected = false;
      this.statusMessage = `Market data unavailable: ${err.message}`;
      console.error('[UpstoxDataProvider] Connection error:', err.message);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.connected = false;
    this.statusMessage = 'Disconnected';
  }

  isConnected(): boolean {
    return this.connected;
  }

  async subscribe(_symbols: string[]): Promise<void> {}
  async unsubscribe(_symbols: string[]): Promise<void> {}

  private async fetchLiveQuotes(): Promise<boolean> {
    if (!this.accessToken) return false;

    // Upstox allows comma separated instrument keys
    const instrumentKeys = MONITORED_NSE_STOCKS.map((s) => s.upstoxKey).join(',');
    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
      instrumentKeys
    )}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let friendlyError = `Upstox API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.errors?.[0]?.errorCode === 'UDAPI100050') {
          friendlyError = 'Invalid or expired Access Token (UDAPI100050). The Upstox access token must be a long JWT starting with "eyJ...". Ensure you generated it today in the Upstox Developer Console.';
        } else if (parsed.errors?.[0]?.message) {
          friendlyError = parsed.errors[0].message;
        }
      } catch {
        friendlyError = errText;
      }
      this.statusMessage = `Market data unavailable: ${friendlyError}`;
      console.error('[UpstoxDataProvider] API error:', this.statusMessage);
      return false;
    }

    const json = (await res.json()) as { status: string; data: Record<string, UpstoxQuoteItem> };
    if (json.status !== 'success' || !json.data) {
      this.statusMessage = 'Market data unavailable: Invalid payload from Upstox';
      return false;
    }

    const nowIso = new Date().toISOString();

    for (const inst of MONITORED_NSE_STOCKS) {
      // Upstox response keys are symbol or instrument_key formatted
      const key = inst.upstoxKey.replace('|', ':') || inst.upstoxKey;
      const data = json.data[key] || json.data[inst.upstoxKey] || json.data[`NSE_EQ:${inst.symbol}`];
      if (!data) continue;

      const totalBuyQty = data.tbq || 0;
      const totalSellQty = data.tsq || 0;
      const { buyPercentage, sellPercentage } = calculateBuySellPercentages(totalBuyQty, totalSellQty);
      const imbalanceRatio = calculateOrderBookImbalance(totalBuyQty, totalSellQty);

      const change = Number((data.last_price - data.ohlc.close).toFixed(2));
      const changePercent = data.ohlc.close > 0 ? Number(((change / data.ohlc.close) * 100).toFixed(2)) : 0;

      const bids: MarketDepthEntry[] = (data.depth?.buy || []).map((b) => ({
        price: b.price,
        quantity: b.quantity,
        orders: b.orders,
      }));

      const asks: MarketDepthEntry[] = (data.depth?.sell || []).map((a) => ({
        price: a.price,
        quantity: a.quantity,
        orders: a.orders,
      }));

      const orderBook: OrderBook = {
        symbol: inst.symbol,
        exchange: 'NSE',
        totalBuyQuantity: totalBuyQty,
        totalSellQuantity: totalSellQty,
        buyPercentage,
        sellPercentage,
        imbalanceRatio,
        bids,
        asks,
        timestamp: data.timestamp || nowIso,
        source: 'UPSTOX_LIVE',
        isStale: false,
      };

      const quote: StockQuote = {
        symbol: inst.symbol,
        companyName: inst.companyName,
        exchange: 'NSE',
        ltp: data.last_price,
        open: data.ohlc.open,
        high: data.ohlc.high,
        low: data.ohlc.low,
        close: data.last_price,
        previousClose: data.ohlc.close,
        change,
        changePercent,
        volume: data.volume,
        totalBuyQuantity: totalBuyQty,
        totalSellQuantity: totalSellQty,
        buyPercentage,
        sellPercentage,
        timestamp: data.timestamp || nowIso,
        source: 'UPSTOX_LIVE',
        isStale: false,
      };

      this.quotesCache.set(inst.symbol, quote);
      this.orderBooksCache.set(inst.symbol, orderBook);

      this.tickListeners.forEach((fn) => fn(quote));
      this.orderBookListeners.forEach((fn) => fn(orderBook));
    }

    return true;
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    if (!this.connected) return null;
    return this.quotesCache.get(symbol.toUpperCase()) || null;
  }

  async getAllQuotes(): Promise<StockQuote[]> {
    if (!this.connected) return [];
    return Array.from(this.quotesCache.values());
  }

  async getOrderBook(symbol: string): Promise<OrderBook | null> {
    if (!this.connected) return null;
    return this.orderBooksCache.get(symbol.toUpperCase()) || null;
  }

  async getHistoricalData(
    symbol: string,
    interval: ChartInterval = '5m',
    range: ChartRange = '1d'
  ): Promise<HistoricalCandle[]> {
    if (!this.connected) return [];
    const inst = MONITORED_NSE_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
    if (!inst) return [];

    const unit = interval === '1m' ? '1minute' : interval === '5m' ? '5minute' : interval === '15m' ? '15minute' : interval === '1h' ? '60minute' : 'day';
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDate = new Date(now.getTime() - (range === '1d' ? 2 : range === '5d' ? 7 : 35) * 86400000)
      .toISOString()
      .split('T')[0];

    const url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(
      inst.upstoxKey
    )}/${unit}/${toDate}/${fromDate}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) return [];
      const json = (await res.json()) as { status: string; data: { candles: any[] } };
      if (!json.data?.candles) return [];

      return json.data.candles.map((c) => ({
        timestamp: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      }));
    } catch {
      return [];
    }
  }

  onTick(listener: (quote: StockQuote) => void): () => void {
    this.tickListeners.add(listener);
    return () => {
      this.tickListeners.delete(listener);
    };
  }

  onOrderBookUpdate(listener: (orderBook: OrderBook) => void): () => void {
    this.orderBookListeners.add(listener);
    return () => {
      this.orderBookListeners.delete(listener);
    };
  }
}
