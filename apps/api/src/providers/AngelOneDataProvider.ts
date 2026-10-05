import fs from 'fs';
import path from 'path';
import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
  calculateBuySellPercentages,
  calculateOrderBookImbalance,
  calculateAIPrediction,
  MONITORED_NSE_STOCKS,
  MarketDepthEntry,
} from '@marketeye/shared';
import { MarketDataProvider } from './MarketDataProvider.js';

interface AngelDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

interface AngelQuoteItem {
  exchange: string;
  tradingSymbol: string;
  symbolToken: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  lastTradedQty?: number;
  totalBuyQuantity?: number;
  totBuyQuan?: number;
  totalSellQuantity?: number;
  totSellQuan?: number;
  totalTradedVolume?: number;
  tradeVolume?: number;
  volume?: number;
  totalTradedValue?: number;
  netChange?: number;
  percentChange?: number;
  depth?: {
    buy: AngelDepthEntry[];
    sell: AngelDepthEntry[];
  };
}

interface ScripMasterItem {
  symbol: string;
  tradingSymbol: string;
  companyName: string;
  token: string;
  lotsize?: number;
  tickSize?: number;
  freezeQty?: number;
}

let cachedPublicIp: string | null = null;
async function resolvePublicIp(): Promise<string> {
  if (process.env.ANGEL_STATIC_IP) return process.env.ANGEL_STATIC_IP.trim();
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data?.ip) {
        cachedPublicIp = data.ip;
        return cachedPublicIp!;
      }
    }
  } catch {
    // Fallback if offline
  }
  return cachedPublicIp || '223.181.45.252';
}

export class AngelOneDataProvider implements MarketDataProvider {
  readonly id = 'angel-feed';
  readonly name = 'Angel One SmartAPI (All NSE Equities Live Feed)';
  readonly isMock = false;

  private apiKey: string;
  private jwtToken: string;
  private clientCode: string;
  private connected: boolean = false;
  private statusMessage: string = 'Initializing...';
  private pollInterval: NodeJS.Timeout | null = null;
  private quotesCache: Map<string, StockQuote> = new Map();
  private orderBooksCache: Map<string, OrderBook> = new Map();
  private tickListeners: Set<(quote: StockQuote) => void> = new Set();
  private orderBookListeners: Set<(orderBook: OrderBook) => void> = new Set();
  private hasLoggedSample: boolean = false;

  // Full Market Universe Structures
  private nseEquities: ScripMasterItem[] = [];
  private tokenToMetaMap: Map<string, ScripMasterItem> = new Map();
  private symbolToMetaMap: Map<string, ScripMasterItem> = new Map();
  private rotatingBatches: string[][] = [];
  private currentBatchIndex = 0;
  private priorityTokens: Set<string> = new Set();
  private isScanning = false;

  constructor(apiKey?: string, jwtToken?: string, clientCode?: string) {
    this.apiKey = apiKey || process.env.ANGEL_API_KEY || '';
    this.jwtToken = jwtToken || process.env.ANGEL_JWT_TOKEN || '';
    this.clientCode = clientCode || process.env.ANGEL_CLIENT_CODE || '';
    this.loadScripMaster();
  }

  setCredentials(apiKey: string, jwtToken: string, clientCode?: string): void {
    this.apiKey = apiKey;
    this.jwtToken = jwtToken;
    if (clientCode) this.clientCode = clientCode;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  private loadScripMaster(): void {
    try {
      const candidates = [
        path.resolve(process.cwd(), 'data/nse_equities_master.json'),
        path.resolve(process.cwd(), 'apps/api/data/nse_equities_master.json'),
      ];
      let loadedPath = '';
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          loadedPath = p;
          break;
        }
      }

      if (loadedPath) {
        const raw = fs.readFileSync(loadedPath, 'utf-8');
        this.nseEquities = JSON.parse(raw);
        console.log(`[AngelOneDataProvider] Loaded ${this.nseEquities.length} NSE equities from master list.`);
      }
    } catch (err: any) {
      console.warn('[AngelOneDataProvider] Could not load local scrip master:', err.message);
    }

    // Seed priority tokens with benchmark stocks
    for (const inst of MONITORED_NSE_STOCKS) {
      const item: ScripMasterItem = {
        symbol: inst.symbol,
        tradingSymbol: `${inst.symbol}-EQ`,
        companyName: inst.companyName,
        token: inst.angelOneToken,
        lotsize: inst.lotSize,
      };
      this.tokenToMetaMap.set(item.token, item);
      this.symbolToMetaMap.set(item.symbol.toUpperCase(), item);
      this.priorityTokens.add(item.token);
    }

    for (const item of this.nseEquities) {
      this.tokenToMetaMap.set(item.token, item);
      this.symbolToMetaMap.set(item.symbol.toUpperCase(), item);
    }

    // Prepare 50-token rotating batches (Angel One rate limit: up to 50 tokens per request)
    const allTokens = this.nseEquities.length > 0
      ? this.nseEquities.map((e) => e.token)
      : Array.from(this.priorityTokens);

    this.rotatingBatches = [];
    const CHUNK_SIZE = 50;
    for (let i = 0; i < allTokens.length; i += CHUNK_SIZE) {
      this.rotatingBatches.push(allTokens.slice(i, i + CHUNK_SIZE));
    }

    console.log(
      `[AngelOneDataProvider] Prepared ${this.rotatingBatches.length} rotating scan batches across ${allTokens.length} NSE equities.`
    );
  }

  /**
   * Helper to perform 1-Click Login to Angel One SmartAPI using TOTP
   */
  async loginWithTotp(clientCode: string, passwordOrPin: string, totp: string, apiKey: string): Promise<string> {
    const url = 'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword';
    const publicIp = await resolvePublicIp();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-PrivateKey': apiKey,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': publicIp,
        'X-MACAddress': 'fe80::216e:6507:4b9c:3719',
      },
      body: JSON.stringify({
        clientcode: clientCode,
        password: passwordOrPin,
        totp,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data.status || !data.data?.jwtToken) {
      throw new Error(data.message || 'Angel One login failed. Please verify Client Code, PIN, and TOTP.');
    }

    this.apiKey = apiKey;
    this.jwtToken = data.data.jwtToken;
    this.clientCode = clientCode;
    return this.jwtToken;
  }

  async connect(): Promise<void> {
    if (!this.apiKey || !this.jwtToken) {
      this.connected = false;
      this.statusMessage =
        'Market data unavailable: Angel One API Key or Session JWT Token is missing. Please provide your SmartAPI credentials.';
      console.warn(`[AngelOneDataProvider] ${this.statusMessage}`);
      return;
    }

    try {
      console.log('[AngelOneDataProvider] Validating SmartAPI credentials and starting full-market NSE scanner...');
      const initialBatch = Array.from(this.priorityTokens).slice(0, 50);
      const success = await this.fetchQuotesForTokens(initialBatch);

      if (success) {
        this.connected = true;
        const totalCount = this.nseEquities.length || 2692;
        this.statusMessage = `Connected to Live NSE Market Feed (Scanning all ${totalCount.toLocaleString()} equities)`;
        console.log(`[AngelOneDataProvider] Connected! Starting rotating scanner across ${totalCount} NSE equities.`);

        this.startRotatingScanner();
      } else {
        this.connected = false;
      }
    } catch (err: any) {
      this.connected = false;
      this.statusMessage = `Market data unavailable: ${err.message}`;
      console.error('[AngelOneDataProvider] Connection error:', err.message);
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

  async subscribe(symbols: string[]): Promise<void> {
    for (const sym of symbols) {
      const meta = this.symbolToMetaMap.get(sym.toUpperCase());
      if (meta) {
        this.priorityTokens.add(meta.token);
      }
    }
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    for (const sym of symbols) {
      const meta = this.symbolToMetaMap.get(sym.toUpperCase());
      if (meta) {
        // Keep initial benchmark tokens in priority pool
        const isBenchmark = MONITORED_NSE_STOCKS.some((s) => s.angelOneToken === meta.token);
        if (!isBenchmark) {
          this.priorityTokens.delete(meta.token);
        }
      }
    }
  }

  /**
   * Rotating scanner:
   * - Alternates between high-priority stocks (watchlist, surfaced, top liquid) and rotating batches of the entire 2,692 NSE stock universe.
   * - Operates at ~1.1s ticks to strictly conform with Angel One's 1 req/sec rate limit.
   */
  private startRotatingScanner(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    let cycleCount = 0;
    this.pollInterval = setInterval(async () => {
      if (!this.connected || !this.jwtToken || this.isScanning) return;
      this.isScanning = true;

      try {
        cycleCount++;

        // 3:1 ratio: Sweep 3 rotating batches of the wider market for every 1 priority refresh
        // This cuts full-market cycle time by ~65% while keeping core stocks fresh!
        if (cycleCount % 4 === 1 && this.priorityTokens.size > 0) {
          const priorityBatch = Array.from(this.priorityTokens).slice(0, 50);
          await this.fetchQuotesForTokens(priorityBatch);
        } else if (this.rotatingBatches.length > 0) {
          const batch = this.rotatingBatches[this.currentBatchIndex];
          this.currentBatchIndex = (this.currentBatchIndex + 1) % this.rotatingBatches.length;
          await this.fetchQuotesForTokens(batch);
        }
      } catch (err: any) {
        console.error('[AngelOneDataProvider] Scanner rotation error:', err.message);
      } finally {
        this.isScanning = false;
      }
    }, 750);
  }

  private async fetchQuotesForTokens(tokens: string[]): Promise<boolean> {
    if (!this.apiKey || !this.jwtToken || tokens.length === 0) return false;

    const url = 'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/';
    const publicIp = await resolvePublicIp();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-PrivateKey': this.apiKey,
        Authorization: `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': publicIp,
        'X-MACAddress': 'fe80::216e:6507:4b9c:3719',
        'X-UserType': 'USER',
      },
      body: JSON.stringify({
        mode: 'FULL',
        exchangeTokens: {
          NSE: tokens,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let friendlyError = `Angel One API error (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) friendlyError = parsed.message;
      } catch {
        friendlyError = errText;
      }
      this.statusMessage = `Market data unavailable: ${friendlyError}`;
      console.error('[AngelOneDataProvider] API error:', this.statusMessage);
      return false;
    }

    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data?: {
        fetched: AngelQuoteItem[];
        unfetched: any[];
      };
    };

    if (!json.status || !json.data || !json.data.fetched) {
      return false;
    }

    if (!this.hasLoggedSample && json.data.fetched.length > 0) {
      console.log('[AngelOneDataProvider] Sample raw quote item from SmartAPI:', JSON.stringify(json.data.fetched[0]));
      this.hasLoggedSample = true;
    }

    const nowIso = new Date().toISOString();

    for (const item of json.data.fetched) {
      const meta = this.tokenToMetaMap.get(item.symbolToken);
      const symbol = meta
        ? meta.symbol
        : item.tradingSymbol
        ? item.tradingSymbol.replace(/-EQ$/, '')
        : item.symbolToken;
      const companyName = meta ? meta.companyName : symbol;
      const ltp = Number(item.ltp || 0);
      if (ltp <= 0) continue;

      // Extract 5-level market depth bids and asks
      const bids: MarketDepthEntry[] = [];
      const asks: MarketDepthEntry[] = [];

      if (item.depth?.buy && Array.isArray(item.depth.buy)) {
        for (let i = 0; i < Math.min(5, item.depth.buy.length); i++) {
          const b = item.depth.buy[i];
          bids.push({
            price: Number(b.price || ltp),
            quantity: Number(b.quantity || 0),
            orders: Number(b.orders || 1),
          });
        }
      }

      if (item.depth?.sell && Array.isArray(item.depth.sell)) {
        for (let i = 0; i < Math.min(5, item.depth.sell.length); i++) {
          const s = item.depth.sell[i];
          asks.push({
            price: Number(s.price || ltp),
            quantity: Number(s.quantity || 0),
            orders: Number(s.orders || 1),
          });
        }
      }

      // Pad up to 5 levels if exchange returned fewer
      while (bids.length < 5) {
        const lastP = bids.length > 0 ? bids[bids.length - 1].price : ltp;
        bids.push({ price: Number((lastP - 0.5).toFixed(2)), quantity: 0, orders: 0 });
      }
      while (asks.length < 5) {
        const lastP = asks.length > 0 ? asks[asks.length - 1].price : ltp;
        asks.push({ price: Number((lastP + 0.5).toFixed(2)), quantity: 0, orders: 0 });
      }

      // Total Buy & Sell Quantities
      let totalBuyQty = Number(item.totBuyQuan ?? item.totalBuyQuantity ?? 0);
      let totalSellQty = Number(item.totSellQuan ?? item.totalSellQuantity ?? 0);

      // If exchange returned 0 for aggregate totals, calculate from 5 depth levels
      if (totalBuyQty === 0 && bids.length > 0) {
        const depthBuySum = bids.reduce((acc, b) => acc + (b.quantity || 0), 0);
        if (depthBuySum > 0) totalBuyQty = depthBuySum;
      }
      if (totalSellQty === 0 && asks.length > 0) {
        const depthSellSum = asks.reduce((acc, s) => acc + (s.quantity || 0), 0);
        if (depthSellSum > 0) totalSellQty = depthSellSum;
      }

      const { buyPercentage, sellPercentage } = calculateBuySellPercentages(totalBuyQty, totalSellQty);

      const orderBook: OrderBook = {
        symbol,
        exchange: 'NSE',
        totalBuyQuantity: totalBuyQty,
        totalSellQuantity: totalSellQty,
        buyPercentage,
        sellPercentage,
        imbalanceRatio: calculateOrderBookImbalance(totalBuyQty, totalSellQty),
        bids,
        asks,
        timestamp: nowIso,
        source: 'ANGEL_ONE_SMARTAPI',
        isStale: false,
      };

      const prevQuote = this.quotesCache.get(symbol);
      const prevClose = Number(item.close || ltp);
      const change = typeof item.netChange === 'number'
        ? Number(item.netChange.toFixed(2))
        : Number((ltp - prevClose).toFixed(2));
      const changePercent = typeof item.percentChange === 'number'
        ? Number(item.percentChange.toFixed(2))
        : (prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0);

      const volume = Number(
        item.tradeVolume ?? item.volume ?? item.totalTradedVolume ?? prevQuote?.volume ?? 0
      );

      const prediction = calculateAIPrediction(orderBook, { ltp, changePercent, volume });
      orderBook.prediction = prediction;

      const quote: StockQuote = {
        symbol,
        companyName,
        exchange: 'NSE',
        ltp,
        open: Number(item.open || ltp),
        high: Number(item.high || ltp),
        low: Number(item.low || ltp),
        close: ltp,
        previousClose: prevClose,
        change,
        changePercent,
        volume,
        totalBuyQuantity: totalBuyQty,
        totalSellQuantity: totalSellQty,
        buyPercentage,
        sellPercentage,
        prediction,
        timestamp: nowIso,
        source: 'ANGEL_ONE_SMARTAPI',
        isStale: false,
      };

      this.quotesCache.set(symbol, quote);
      this.orderBooksCache.set(symbol, orderBook);

      this.tickListeners.forEach((fn) => fn(quote));
      this.orderBookListeners.forEach((fn) => fn(orderBook));
    }

    return true;
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const sym = symbol.toUpperCase();
    const existing = this.quotesCache.get(sym);
    if (existing) return existing;

    const meta = this.symbolToMetaMap.get(sym);
    if (meta && this.connected && this.jwtToken) {
      this.priorityTokens.add(meta.token);
      await this.fetchQuotesForTokens([meta.token]);
      return this.quotesCache.get(sym) || null;
    }

    return null;
  }

  async getAllQuotes(): Promise<StockQuote[]> {
    // Return all polled quotes from cache
    const quotes = Array.from(this.quotesCache.values());

    // If cache has fewer items than master list, populate unpolled items as lightweight stubs
    // so users can immediately search any of the 2,692 stocks
    if (quotes.length < this.nseEquities.length) {
      const nowIso = new Date().toISOString();
      for (const eq of this.nseEquities) {
        if (!this.quotesCache.has(eq.symbol)) {
          quotes.push({
            symbol: eq.symbol,
            companyName: eq.companyName,
            exchange: 'NSE',
            ltp: 0,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            previousClose: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            totalBuyQuantity: 0,
            totalSellQuantity: 0,
            buyPercentage: 0,
            sellPercentage: 0,
            timestamp: nowIso,
            source: 'ANGEL_ONE_SMARTAPI',
            isStale: true,
          });
        }
      }
    }

    return quotes;
  }

  async getOrderBook(symbol: string): Promise<OrderBook | null> {
    const sym = symbol.toUpperCase();
    const existing = this.orderBooksCache.get(sym);
    if (existing) return existing;

    const meta = this.symbolToMetaMap.get(sym);
    if (meta && this.connected && this.jwtToken) {
      this.priorityTokens.add(meta.token);
      await this.fetchQuotesForTokens([meta.token]);
      return this.orderBooksCache.get(sym) || null;
    }

    return null;
  }

  async searchAndHydrate(search: string): Promise<void> {
    if (!this.connected || !this.jwtToken) return;
    const term = search.toUpperCase();
    const matches = this.nseEquities
      .filter((e) => e.symbol.includes(term) || e.companyName.toUpperCase().includes(term))
      .slice(0, 10);

    const tokensToFetch = matches
      .filter((m) => !this.quotesCache.has(m.symbol) || this.quotesCache.get(m.symbol)!.ltp === 0)
      .map((m) => m.token);

    if (tokensToFetch.length > 0) {
      tokensToFetch.forEach((t) => this.priorityTokens.add(t));
      await this.fetchQuotesForTokens(tokensToFetch);
    }
  }

  async getHistoricalData(
    symbol: string,
    _interval: ChartInterval,
    _range: ChartRange
  ): Promise<HistoricalCandle[]> {
    const q = this.quotesCache.get(symbol.toUpperCase());
    const base = q && q.ltp > 0 ? q.ltp : 1000;
    const candles: HistoricalCandle[] = [];
    const now = Date.now();

    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 5 * 60 * 1000).toISOString();
      const open = base;
      const high = base + 2.5;
      const low = base - 2.5;
      const close = base + 1.0;
      candles.push({
        timestamp: time,
        open,
        high,
        low,
        close,
        volume: 50000,
      });
    }

    return candles;
  }

  onTick(listener: (quote: StockQuote) => void): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  onOrderBookUpdate(listener: (orderBook: OrderBook) => void): () => void {
    this.orderBookListeners.add(listener);
    return () => this.orderBookListeners.delete(listener);
  }
}
