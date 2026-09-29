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

export class DhanDataProvider implements MarketDataProvider {
  readonly id = 'dhan-feed';
  readonly name = 'Dhan HQ API (Live Production Feed)';
  readonly isMock = false;

  private clientId: string;
  private accessToken: string;
  private connected: boolean = false;
  private statusMessage: string = 'Initializing...';
  private pollInterval: NodeJS.Timeout | null = null;
  private quotesCache: Map<string, StockQuote> = new Map();
  private orderBooksCache: Map<string, OrderBook> = new Map();
  private tickListeners: Set<(quote: StockQuote) => void> = new Set();
  private orderBookListeners: Set<(orderBook: OrderBook) => void> = new Set();

  constructor(clientId?: string, accessToken?: string) {
    this.clientId = clientId || process.env.DHAN_CLIENT_ID || '';
    this.accessToken = accessToken || process.env.DHAN_ACCESS_TOKEN || '';
  }

  setCredentials(clientId: string, accessToken: string): void {
    this.clientId = clientId;
    this.accessToken = accessToken;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  async connect(): Promise<void> {
    if (!this.accessToken || !this.clientId) {
      this.connected = false;
      this.statusMessage =
        'Market data unavailable: DHAN_CLIENT_ID or DHAN_ACCESS_TOKEN is missing. Please provide credentials to connect to live market data.';
      console.warn(`[DhanDataProvider] ${this.statusMessage}`);
      return;
    }

    try {
      console.log('[DhanDataProvider] Validating Dhan HQ credentials and fetching live market quotes...');
      const success = await this.fetchLiveQuotes();
      if (success) {
        this.connected = true;
        this.statusMessage = 'Connected to Live NSE Market Feed (Dhan HQ)';
        console.log('[DhanDataProvider] Successfully connected to live Dhan feed.');

        this.pollInterval = setInterval(() => {
          this.fetchLiveQuotes().catch((err) => {
            console.error('[DhanDataProvider] Poll error:', err.message);
          });
        }, 1500);
      } else {
        this.connected = false;
      }
    } catch (err: any) {
      this.connected = false;
      this.statusMessage = `Market data unavailable: ${err.message}`;
      console.error('[DhanDataProvider] Connection error:', err.message);
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
    if (!this.accessToken || !this.clientId) return false;

    const securityIds = MONITORED_NSE_STOCKS.map((s) => s.dhanSecurityId);
    const url = 'https://api.dhan.co/v2/marketfeed/quote';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'access-token': this.accessToken,
        'client-id': this.clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        NSE_EQ: securityIds,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.statusMessage = `Market data unavailable: Dhan API error (HTTP ${res.status}): ${errText}`;
      console.error('[DhanDataProvider] API error:', this.statusMessage);
      return false;
    }

    const json = (await res.json()) as { status: string; data?: { NSE_EQ?: Record<string, any> } };
    const nseData = json.data?.NSE_EQ;
    if (!nseData) {
      this.statusMessage = 'Market data unavailable: Empty feed returned from Dhan';
      return false;
    }

    const nowIso = new Date().toISOString();

    for (const inst of MONITORED_NSE_STOCKS) {
      const data = nseData[inst.dhanSecurityId];
      if (!data) continue;

      const totalBuyQty = data.buyQuantity || data.totalBuyQuantity || 0;
      const totalSellQty = data.sellQuantity || data.totalSellQuantity || 0;
      const { buyPercentage, sellPercentage } = calculateBuySellPercentages(totalBuyQty, totalSellQty);
      const imbalanceRatio = calculateOrderBookImbalance(totalBuyQty, totalSellQty);

      const ltp = data.last_price || data.ltp || 0;
      const prevClose = data.ohlc?.close || ltp;
      const change = Number((ltp - prevClose).toFixed(2));
      const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

      const bids: MarketDepthEntry[] = (data.depth?.buy || []).map((b: any) => ({
        price: b.price,
        quantity: b.quantity,
        orders: b.orders,
      }));

      const asks: MarketDepthEntry[] = (data.depth?.sell || []).map((a: any) => ({
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
        source: 'DHAN_LIVE',
        isStale: false,
      };

      const quote: StockQuote = {
        symbol: inst.symbol,
        companyName: inst.companyName,
        exchange: 'NSE',
        ltp,
        open: data.ohlc?.open || ltp,
        high: data.ohlc?.high || ltp,
        low: data.ohlc?.low || ltp,
        close: ltp,
        previousClose: prevClose,
        change,
        changePercent,
        volume: data.volume || 0,
        totalBuyQuantity: totalBuyQty,
        totalSellQuantity: totalSellQty,
        buyPercentage,
        sellPercentage,
        timestamp: data.timestamp || nowIso,
        source: 'DHAN_LIVE',
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
    _symbol: string,
    _interval: ChartInterval = '5m',
    _range: ChartRange = '1d'
  ): Promise<HistoricalCandle[]> {
    return [];
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
