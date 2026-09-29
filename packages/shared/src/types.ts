export type Exchange = 'NSE';

export interface MarketDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderBook {
  symbol: string;
  exchange: Exchange;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  imbalanceRatio: number; // in range [-1.0, 1.0]
  bids: MarketDepthEntry[]; // Top 5 bids descending by price
  asks: MarketDepthEntry[]; // Top 5 asks ascending by price
  timestamp: string; // ISO 8601
  source: string; // e.g. 'MOCK_FEED' | 'KITE_CONNECT' | 'UPSTOX'
  isStale: boolean;
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  ltp: number; // Last Traded Price
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number; // ltp - previousClose
  changePercent: number; // ((ltp - previousClose) / previousClose) * 100
  volume: number; // Cumulative daily volume
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  timestamp: string;
  source: string;
  isStale: boolean;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '1D';
export type ChartRange = '1d' | '5d' | '1mo' | '1y';

export interface ScannerRuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  buyThreshold: number; // Default 60.0%
  sellThreshold: number; // Default 40.0%
  minVolume: number; // Default 10000
  minPriceChange?: number; // Optional filter
  maxPriceChange?: number; // Optional filter
  updatedAt: string;
}

export interface ScannerResult {
  symbol: string;
  companyName: string;
  ltp: number;
  changePercent: number;
  volume: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  ruleId: string;
  ruleName: string;
  reason: string;
  surfacedAt: string;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  addedAt: string;
  notes?: string;
  quote?: StockQuote;
}

export interface MarketAlert {
  id: string;
  symbol: string;
  type: 'SCANNER_TRIGGER' | 'SCANNER_DROP' | 'FEED_STATUS' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export type MarketSessionStatus = 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'HOLIDAY';

export interface MarketStatusInfo {
  status: MarketSessionStatus;
  statusLabel: string;
  isLiveTradingHours: boolean;
  serverTimeIST: string;
  tradingHours: string;
  mode: 'mock' | 'provider';
  providerName: string;
  monitoredStocksCount: number;
}

// WebSocket Protocol Definitions
export type WSActionType = 'subscribe' | 'unsubscribe' | 'ping';
export type WSChannel = 'stocks' | 'orderbook' | 'scanner' | 'alerts';

export interface WSClientMessage {
  action: WSActionType;
  channel?: WSChannel;
  symbol?: string;
}

export type WSEventType =
  | 'CONNECTED'
  | 'TICK'
  | 'ORDER_BOOK'
  | 'SCANNER_SNAPSHOT'
  | 'SCANNER_TRIGGER'
  | 'SCANNER_REMOVE'
  | 'ALERT'
  | 'PONG'
  | 'ERROR';

export interface WSServerMessage<T = unknown> {
  type: WSEventType;
  data: T;
  timestamp: string;
}
