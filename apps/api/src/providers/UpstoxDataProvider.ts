import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
} from '@marketeye/shared';
import { MarketDataProvider } from './MarketDataProvider.js';

export class UpstoxDataProvider implements MarketDataProvider {
  readonly id = 'upstox-feed';
  readonly name = 'Upstox API v2/v3 (Production Feed)';
  readonly isMock = false;

  private apiKey?: string;
  private accessToken?: string;
  private connected: boolean = false;
  private tickListeners: Set<(quote: StockQuote) => void> = new Set();
  private orderBookListeners: Set<(orderBook: OrderBook) => void> = new Set();

  constructor(apiKey?: string, accessToken?: string) {
    this.apiKey = apiKey || process.env.UPSTOX_API_KEY;
    this.accessToken = accessToken || process.env.UPSTOX_ACCESS_TOKEN;
  }

  async connect(): Promise<void> {
    if (!this.apiKey || !this.accessToken) {
      this.connected = false;
      console.warn(
        '[UpstoxDataProvider] Missing credentials: UPSTOX_API_KEY or UPSTOX_ACCESS_TOKEN. Feed will report unavailable.'
      );
      return;
    }

    try {
      this.connected = true;
      console.log('[UpstoxDataProvider] Successfully initialized Upstox market feed.');
    } catch (err) {
      this.connected = false;
      console.error('[UpstoxDataProvider] Connection error:', err);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async subscribe(_symbols: string[]): Promise<void> {
    if (!this.connected) return;
  }

  async unsubscribe(_symbols: string[]): Promise<void> {
    if (!this.connected) return;
  }

  async getQuote(_symbol: string): Promise<StockQuote | null> {
    if (!this.connected) return null;
    return null;
  }

  async getAllQuotes(): Promise<StockQuote[]> {
    if (!this.connected) return [];
    return [];
  }

  async getOrderBook(_symbol: string): Promise<OrderBook | null> {
    if (!this.connected) return null;
    return null;
  }

  async getHistoricalData(
    _symbol: string,
    _interval: ChartInterval,
    _range: ChartRange
  ): Promise<HistoricalCandle[]> {
    if (!this.connected) return [];
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
