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

interface KiteDepthItem {
  price: number;
  quantity: number;
  orders: number;
}

interface KiteQuoteItem {
  instrument_token: number;
  timestamp: string;
  last_price: number;
  volume: number;
  total_buy_quantity: number;
  total_sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  depth: {
    buy: KiteDepthItem[];
    sell: KiteDepthItem[];
  };
}

export class KiteConnectProvider implements MarketDataProvider {
  readonly id = 'kite-connect';
  readonly name = 'Zerodha Kite Connect (Live Production Feed)';
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
    this.apiKey = apiKey || process.env.KITE_API_KEY || '';
    this.accessToken = accessToken || process.env.KITE_ACCESS_TOKEN || '';
  }

  setCredentials(apiKey: string, accessToken: string): void {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  async connect(): Promise<void> {
    if (!this.apiKey || !this.accessToken) {
      this.connected = false;
      this.statusMessage =
        'Market data unavailable: KITE_API_KEY or KITE_ACCESS_TOKEN is missing. Please provide credentials to connect to real exchange data.';
      console.warn(`[KiteConnectProvider] ${this.statusMessage}`);
      return;
    }

    try {
      console.log('[KiteConnectProvider] Validating Kite credentials and fetching live market quotes...');
      const success = await this.fetchLiveQuotes();
      if (success) {
        this.connected = true;
        this.statusMessage = 'Connected to Live NSE Market Feed (Zerodha Kite)';
        console.log('[KiteConnectProvider] Successfully connected to live Zerodha Kite feed.');

        // Poll live quotes every 1.5 seconds during live market session
        this.pollInterval = setInterval(() => {
          this.fetchLiveQuotes().catch((err) => {
            console.error('[KiteConnectProvider] Poll error:', err.message);
          });
        }, 1500);
      } else {
        this.connected = false;
      }
    } catch (err: any) {
      this.connected = false;
      this.statusMessage = `Market data unavailable: ${err.message}`;
      console.error('[KiteConnectProvider] Connection error:', err.message);
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
    if (!this.apiKey || !this.accessToken) return false;

    // Build query for all monitored stocks
    const queryParams = MONITORED_NSE_STOCKS.map((s) => `i=NSE:${s.symbol}`).join('&');
    const url = `https://api.kite.trade/quote?${queryParams}`;

    const res = await fetch(url, {
      headers: {
        'X-Kite-Version': '3',
        Authorization: `token ${this.apiKey}:${this.accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      this.statusMessage = `Market data unavailable: Authentication failed with Zerodha Kite (HTTP ${res.status}): ${errText}`;
      console.error('[KiteConnectProvider] API response error:', this.statusMessage);
      return false;
    }

    const json = (await res.json()) as { status: string; data: Record<string, KiteQuoteItem> };
    if (json.status !== 'success' || !json.data) {
      this.statusMessage = 'Market data unavailable: Malformed response from exchange provider';
      return false;
    }

    const nowIso = new Date().toISOString();

    for (const inst of MONITORED_NSE_STOCKS) {
      const key = `NSE:${inst.symbol}`;
      const data = json.data[key];
      if (!data) continue;

      const totalBuyQty = data.total_buy_quantity || 0;
      const totalSellQty = data.total_sell_quantity || 0;
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
        source: 'ZERODHA_KITE_LIVE',
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
        source: 'ZERODHA_KITE_LIVE',
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

    const kiteInterval =
      interval === '1m'
        ? 'minute'
        : interval === '5m'
        ? '5minute'
        : interval === '15m'
        ? '15minute'
        : interval === '1h'
        ? '60minute'
        : 'day';

    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDate = new Date(now.getTime() - (range === '1d' ? 2 : range === '5d' ? 7 : 35) * 86400000)
      .toISOString()
      .split('T')[0];

    const url = `https://api.kite.trade/instruments/historical/${inst.kiteToken}/${kiteInterval}?from=${fromDate}&to=${toDate}`;

    try {
      const res = await fetch(url, {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${this.apiKey}:${this.accessToken}`,
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
