import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
} from '@marketeye/shared';

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly isMock: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  subscribe(symbols: string[]): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;

  getQuote(symbol: string): Promise<StockQuote | null>;
  getAllQuotes(): Promise<StockQuote[]>;
  getOrderBook(symbol: string): Promise<OrderBook | null>;
  getHistoricalData(
    symbol: string,
    interval: ChartInterval,
    range: ChartRange
  ): Promise<HistoricalCandle[]>;

  onTick(listener: (quote: StockQuote) => void): () => void;
  onOrderBookUpdate(listener: (orderBook: OrderBook) => void): () => void;
}
