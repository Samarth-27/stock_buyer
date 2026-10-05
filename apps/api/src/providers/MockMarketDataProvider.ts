import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
  MONITORED_NSE_STOCKS,
  NSEInstrumentDefinition,
  calculateBuySellPercentages,
  calculateOrderBookImbalance,
  calculateAIPrediction,
  calculateSwingTradePlan,
  MarketDepthEntry,
} from '@marketeye/shared';
import { MarketDataProvider } from './MarketDataProvider.js';

interface StockState {
  definition: NSEInstrumentDefinition;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  volume: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  orderBook: OrderBook;
  lastUpdated: number;
  targetBuyBias: number; // e.g. 0.64 for buy pressure, 0.50 for neutral, 0.35 for sell pressure
  dailyCandles: HistoricalCandle[];
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly id = 'mock-nse-feed';
  readonly name = 'NSE Mock Simulation Feed (Demo Mode)';
  readonly isMock = true;

  private connected: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private stockStates: Map<string, StockState> = new Map();
  private tickListeners: Set<(quote: StockQuote) => void> = new Set();
  private orderBookListeners: Set<(orderBook: OrderBook) => void> = new Set();

  constructor() {
    this.initializeStocks();
  }

  private generateDailyCandles(basePrice: number, isBullish: boolean): HistoricalCandle[] {
    const candles: HistoricalCandle[] = [];
    const count = 60;
    const now = Date.now();
    let price = isBullish ? basePrice * 0.85 : basePrice * 1.05;

    for (let i = count; i >= 1; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
      const drift = isBullish ? (basePrice - price) / (i + 1) + (Math.random() - 0.45) * (basePrice * 0.012) : (Math.random() - 0.52) * (basePrice * 0.015);
      const open = Number(price.toFixed(2));
      const close = Number(Math.max(10, open + drift).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * (basePrice * 0.008)).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * (basePrice * 0.008)).toFixed(2));
      const volume = Math.floor(Math.random() * 800000) + 150000;

      candles.push({
        timestamp: date,
        open,
        high,
        low,
        close,
        volume,
      });

      price = close;
    }
    return candles;
  }

  private initializeStocks(): void {
    const biases: Record<string, number> = {
      RELIANCE: 0.635,    // Surfaced stock (Buy Pressure > 60%)
      TATAMOTORS: 0.658,  // Surfaced stock (Buy Pressure > 60%)
      BAJFINANCE: 0.622,  // Surfaced stock (Buy Pressure > 60%)
      SUNPHARMA: 0.614,   // Surfaced stock (Buy Pressure > 60%)
      TCS: 0.495,         // Balanced
      HDFCBANK: 0.512,    // Balanced
      INFY: 0.380,        // Sell pressure
      ICICIBANK: 0.480,   // Balanced
      SBIN: 0.585,        // Near boundary
      ITC: 0.450,         // Slight sell
    };

    for (const inst of MONITORED_NSE_STOCKS) {
      const basePrice = inst.basePrice;
      const prevClose = Number((basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2));
      const openPrice = Number((prevClose * (1 + (Math.random() * 0.01 - 0.005))).toFixed(2));
      const ltp = openPrice;
      const high = Math.max(openPrice, ltp) + Number((Math.random() * 5).toFixed(2));
      const low = Math.min(openPrice, ltp) - Number((Math.random() * 5).toFixed(2));
      const volume = Math.floor(Math.random() * 800000) + 150000;

      const bias = biases[inst.symbol] ?? (0.42 + Math.random() * 0.22);
      const totalOrdersBase = Math.floor(Math.random() * 500000) + 200000;
      const totalBuyQty = Math.round(totalOrdersBase * bias);
      const totalSellQty = Math.round(totalOrdersBase * (1 - bias));

      const { buyPercentage, sellPercentage } = calculateBuySellPercentages(totalBuyQty, totalSellQty);
      const imbalanceRatio = calculateOrderBookImbalance(totalBuyQty, totalSellQty);

      const bids = this.generateBids(ltp, totalBuyQty);
      const asks = this.generateAsks(ltp, totalSellQty);

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
        timestamp: new Date().toISOString(),
        source: 'MOCK_FEED',
        isStale: false,
      };

      this.stockStates.set(inst.symbol, {
        definition: inst,
        ltp,
        open: openPrice,
        high,
        low,
        close: ltp,
        previousClose: prevClose,
        volume,
        totalBuyQuantity: totalBuyQty,
        totalSellQuantity: totalSellQty,
        orderBook,
        lastUpdated: Date.now(),
        targetBuyBias: bias,
        dailyCandles: this.generateDailyCandles(basePrice, bias >= 0.58),
      });
    }
  }

  private generateBids(ltp: number, totalBuyQty: number): MarketDepthEntry[] {
    const bids: MarketDepthEntry[] = [];
    let currentPrice = Number((ltp - 0.05).toFixed(2));
    const levelQtyBase = Math.round(totalBuyQty * 0.06);

    for (let i = 0; i < 5; i++) {
      bids.push({
        price: currentPrice,
        quantity: Math.max(10, Math.round(levelQtyBase * (1 + Math.random() * 0.4 - 0.2))),
        orders: Math.floor(Math.random() * 40) + 5,
      });
      currentPrice = Number((currentPrice - (0.05 + Math.random() * 0.15)).toFixed(2));
    }
    return bids;
  }

  private generateAsks(ltp: number, totalSellQty: number): MarketDepthEntry[] {
    const asks: MarketDepthEntry[] = [];
    let currentPrice = Number((ltp + 0.05).toFixed(2));
    const levelQtyBase = Math.round(totalSellQty * 0.06);

    for (let i = 0; i < 5; i++) {
      asks.push({
        price: currentPrice,
        quantity: Math.max(10, Math.round(levelQtyBase * (1 + Math.random() * 0.4 - 0.2))),
        orders: Math.floor(Math.random() * 40) + 5,
      });
      currentPrice = Number((currentPrice + (0.05 + Math.random() * 0.15)).toFixed(2));
    }
    return asks;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    console.log('[MockMarketDataProvider] Connected to mock NSE feed');

    // Run high-speed simulation tick every 600ms
    this.intervalTimer = setInterval(() => {
      this.simulateMarketTick();
    }, 600);
  }

  async disconnect(): Promise<void> {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.connected = false;
    console.log('[MockMarketDataProvider] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async subscribe(_symbols: string[]): Promise<void> {
    // All monitored stocks automatically subscribed in mock mode
  }

  async unsubscribe(_symbols: string[]): Promise<void> {
    // No-op for mock feed
  }

  private simulateMarketTick(): void {
    if (!this.connected) return;

    // Pick 6 to 12 stocks to tick rapidly
    const symbols = Array.from(this.stockStates.keys());
    const countToUpdate = Math.floor(Math.random() * 7) + 6;
    const shuffled = [...symbols].sort(() => 0.5 - Math.random()).slice(0, countToUpdate);

    const now = new Date();
    const nowIso = now.toISOString();

    for (const sym of shuffled) {
      const state = this.stockStates.get(sym);
      if (!state) continue;

      // Realistic tick price step (-0.15% to +0.15%)
      const priceDriftPercent = (Math.random() * 0.3 - 0.15) / 100;
      const rawPriceChange = state.ltp * priceDriftPercent;
      // Round to NSE tick size of 0.05 INR
      const tickDelta = Math.round(rawPriceChange / 0.05) * 0.05;
      const newLtp = Number(Math.max(1, state.ltp + tickDelta).toFixed(2));

      state.ltp = newLtp;
      state.high = Math.max(state.high, newLtp);
      state.low = Math.min(state.low, newLtp);
      state.close = newLtp;

      // Volume increment
      const volumeAdd = Math.floor(Math.random() * 800) + 50;
      state.volume += volumeAdd;

      // Mildly fluctuate buy bias around target bias (+/- 0.015)
      const dynamicBias = Math.max(
        0.1,
        Math.min(0.9, state.targetBuyBias + (Math.random() * 0.03 - 0.015))
      );

      // Order book quantity variation
      const totalOrdersDelta = Math.floor(Math.random() * 4000) - 2000;
      const currentTotal = state.totalBuyQuantity + state.totalSellQuantity + totalOrdersDelta;
      const safeTotal = Math.max(100000, currentTotal);

      state.totalBuyQuantity = Math.round(safeTotal * dynamicBias);
      state.totalSellQuantity = Math.round(safeTotal * (1 - dynamicBias));

      const { buyPercentage, sellPercentage } = calculateBuySellPercentages(
        state.totalBuyQuantity,
        state.totalSellQuantity
      );
      const imbalanceRatio = calculateOrderBookImbalance(
        state.totalBuyQuantity,
        state.totalSellQuantity
      );

      // Refresh top-5 bids & asks
      const bids = this.generateBids(state.ltp, state.totalBuyQuantity);
      const asks = this.generateAsks(state.ltp, state.totalSellQuantity);

      state.orderBook = {
        symbol: state.definition.symbol,
        exchange: 'NSE',
        totalBuyQuantity: state.totalBuyQuantity,
        totalSellQuantity: state.totalSellQuantity,
        buyPercentage,
        sellPercentage,
        imbalanceRatio,
        bids,
        asks,
        timestamp: nowIso,
        source: 'MOCK_FEED',
        isStale: false,
      };

      state.lastUpdated = Date.now();

      const quote = this.buildQuote(state, nowIso);

      // Dispatch tick and order book update
      this.tickListeners.forEach((fn) => fn(quote));
      this.orderBookListeners.forEach((fn) => fn(state.orderBook));
    }
  }

  private buildQuote(state: StockState, timestamp: string): StockQuote {
    const change = Number((state.ltp - state.previousClose).toFixed(2));
    const changePercent = Number(((change / state.previousClose) * 100).toFixed(2));
    const { buyPercentage, sellPercentage } = calculateBuySellPercentages(
      state.totalBuyQuantity,
      state.totalSellQuantity
    );

    const prediction = calculateAIPrediction(state.orderBook, {
      ltp: state.ltp,
      changePercent,
      volume: state.volume,
    });
    if (state.orderBook) {
      state.orderBook.prediction = prediction;
    }

    const swingPlan = calculateSwingTradePlan(
      {
        symbol: state.definition.symbol,
        ltp: state.ltp,
        previousClose: state.previousClose,
        changePercent,
        volume: state.volume,
        high: state.high,
        low: state.low,
        buyPercentage,
        sellPercentage,
      },
      state.orderBook,
      state.dailyCandles
    );

    return {
      symbol: state.definition.symbol,
      companyName: state.definition.companyName,
      exchange: 'NSE',
      ltp: state.ltp,
      open: state.open,
      high: state.high,
      low: state.low,
      close: state.close,
      previousClose: state.previousClose,
      change,
      changePercent,
      volume: state.volume,
      totalBuyQuantity: state.totalBuyQuantity,
      totalSellQuantity: state.totalSellQuantity,
      buyPercentage,
      sellPercentage,
      prediction,
      swingPlan,
      swingSetup: swingPlan.setupType,
      twoDayDecision: swingPlan.twoDayDecision,
      timestamp,
      source: 'MOCK_FEED',
      isStale: false,
    };
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const state = this.stockStates.get(symbol.toUpperCase());
    if (!state) return null;
    return this.buildQuote(state, new Date().toISOString());
  }

  async getAllQuotes(): Promise<StockQuote[]> {
    const nowIso = new Date().toISOString();
    return Array.from(this.stockStates.values()).map((state) =>
      this.buildQuote(state, nowIso)
    );
  }

  async getOrderBook(symbol: string): Promise<OrderBook | null> {
    const state = this.stockStates.get(symbol.toUpperCase());
    if (!state) return null;
    return { ...state.orderBook };
  }

  async getHistoricalData(
    symbol: string,
    interval: ChartInterval = '5m',
    range: ChartRange = '1d'
  ): Promise<HistoricalCandle[]> {
    const state = this.stockStates.get(symbol.toUpperCase());
    if (interval === '1D' && state?.dailyCandles?.length) {
      return state.dailyCandles;
    }
    const basePrice = state ? state.ltp : 1000;

    const candlesCount = range === '1d' ? (interval === '1m' ? 60 : interval === '5m' ? 45 : 25) : 30;
    const intervalMinutes = interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : interval === '1h' ? 60 : 1440;

    const candles: HistoricalCandle[] = [];
    const now = Date.now();
    let currentPrice = basePrice * 0.985; // Start slightly below current

    for (let i = candlesCount; i >= 0; i--) {
      const candleTime = new Date(now - i * intervalMinutes * 60 * 1000).toISOString();
      const open = Number(currentPrice.toFixed(2));
      const variance = (Math.random() - 0.48) * (basePrice * 0.006);
      const close = Number((open + variance).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * (basePrice * 0.004)).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * (basePrice * 0.004)).toFixed(2));
      const volume = Math.floor(Math.random() * 45000) + 5000;

      candles.push({
        timestamp: candleTime,
        open,
        high,
        low,
        close,
        volume,
      });

      currentPrice = close;
    }

    return candles;
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
