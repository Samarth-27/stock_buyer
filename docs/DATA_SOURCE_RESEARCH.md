# Market Data Source Research for Indian Equity Markets (NSE)

## 1. Executive Summary

This document evaluates official, licensed, and legally compliant market-data providers for Indian equities traded on the National Stock Exchange of India (NSE). 

The primary requirement of **MarketEye** is to calculate real-time or near real-time order-book metrics:
- **Total Buy Quantity (TBQ)**
- **Total Sell Quantity (TSQ)**
- **Buy Quantity %** = $\frac{\text{Total Buy Quantity}}{\text{Total Buy Quantity} + \text{Total Sell Quantity}} \times 100$
- **Sell Quantity %** = $\frac{\text{Total Sell Quantity}}{\text{Total Buy Quantity} + \text{Total Sell Quantity}} \times 100$
- **5-Level Market Depth** (Top 5 Bids and Asks)

Web scraping (e.g., scraping `nseindia.com`) is **strictly prohibited** by NSE Terms of Service, is legally hazardous, subject to IP bans, CAPTCHA blocks, and violates SEBI regulations. MarketEye requires an official, licensed data source or compliant broker API.

---

## 2. Market Data Providers Comparison Matrix

| Provider | Official Doc URL | Type | Market Depth (Level 2) | Total Buy Qty (TBQ) | Total Sell Qty (TSQ) | Realtime Feed Protocol | Rate Limits | Pricing (Approx.) | Legal / Redistribution Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NSE Data & Analytics Ltd** (Direct Exchange Feed) | [nseindia.com/market-data](https://www.nseindia.com) | Direct Exchange Feed | Level 1, 2 (5/20 depth), Level 3 (Tick-by-tick) | Yes (Aggregated order book) | Yes (Aggregated order book) | Leased line / Multicast UDP (ITCH/OUCH) | Uncapped (Hardware bandwidth dependent) | INR 2,00,000 to 5,00,000+ /month + Exchange royalties + Leased line | Commercial redistribution / institutional license required |
| **Zerodha Kite Connect API** | [kite.trade/docs/connect/v3](https://kite.trade/docs/connect/v3/) | SEBI-registered Broker API | Yes (Top 5 bids & asks with price, qty, orders) | **Yes** (`total_buy_quantity`) | **Yes** (`total_sell_quantity`) | WebSocket Binary Stream (Full mode: quote + depth) | 3 req/sec REST; 3 WebSocket connections per API key (up to 3,000 instruments) | INR 2,000 / month (base) + INR 2,000 / month (historical) | Licensed for individual / retail developer trading applications; non-commercial redistribution terms apply |
| **Upstox API v2 / v3** | [upstox.com/developer/api-documentation](https://upstox.com/developer/api-documentation) | SEBI-registered Broker API | Yes (Top 5 depth) | **Yes** (`tbq` / `total_buy_qty`) | **Yes** (`tsq` / `total_sell_qty`) | WebSocket Protobuf / JSON Stream | 5 req/sec (Free/Standard tier) | Free for basic algorithmic trading / account holders | Licensed for account holders and developers building trading tools |
| **Angel One SmartAPI** | [smartapi.angelbroking.com](https://smartapi.angelbroking.com) | SEBI-registered Broker API | Yes (Top 5 depth) | **Yes** (`totalBuyQuantity`) | **Yes** (`totalSellQuantity`) | WebSocket (Binary / JSON) | 3-10 req/sec depending on endpoint | Free for Angel One registered clients | Licensed for individual trading and analytical interfaces |
| **Dhan HQ API** | [dhanhq.co](https://dhanhq.co) | SEBI-registered Broker API | Yes (Top 5 depth) | **Yes** (`buyQuantity`) | **Yes** (`sellQuantity`) | WebSocket Binary / JSON feed | 5 req/sec REST; 1 WebSocket connection | Free for Dhan demat account holders | Licensed for account holders building customized tools |
| **Fyers API v3** | [fyers.in/api](https://fyers.in/api) | SEBI-registered Broker API | Yes (Top 5 depth) | **Yes** (`totalbuyqty`) | **Yes** (`totalsellqty`) | WebSocket (Data socket) | 10 req/sec | Free for active Fyers account holders | Retail algorithmic and analytical usage |

---

## 3. Deep-Dive on Evaluated Providers

### A. Direct Exchange Feed: NSE Data & Analytics Ltd
* **Official URL**: `https://www.nseindia.com/market-data/real-time-data-feeds`
* **Available Endpoints / Feeds**: 
  - Level 1 (Snapshot / LTP + best bid/ask)
  - Level 2 (5-depth and 20-depth full order book)
  - Level 3 (Tick-by-tick order stream)
* **Authentication**: Fixed IP leased line, hardware VPN, or colocation within NSE datacenter (Bandra Kurla Complex, Mumbai).
* **Realtime Capability**: Ultra-low latency (< 1 millisecond).
* **Total Buy & Sell Quantities**: Available directly from the Level 2 and Level 3 order aggregation feed.
* **Pricing & Feasibility for MVP**: Prohibitive for indie/startup stage. Requires corporate licensing contracts, SEBI vendor audit compliance, and monthly infrastructure expenses starting at several thousand USD.
* **Verdict**: Not feasible for initial MVP deployment, but the gold standard for institutional deployments.

---

### B. Zerodha Kite Connect API (v3)
* **Official URL**: `https://kite.trade/docs/connect/v3/market-quotes/#market-depth`
* **Available Endpoints**:
  - `GET /quote?i=NSE:RELIANCE&i=NSE:TCS`
  - WebSocket Streaming: `wss://ws.kite.trade?api_key=xxx&access_token=yyy`
* **Packet Structure (Full Mode Streaming)**:
  - Instrument token: 4 bytes (int32)
  - Last traded price: 4 bytes (int32 / 100)
  - Last traded quantity: 4 bytes
  - Average traded price: 4 bytes
  - Volume: 4 bytes
  - **Total Buy Quantity**: 8 bytes (`total_buy_quantity`)
  - **Total Sell Quantity**: 8 bytes (`total_sell_quantity`)
  - OHLC: 4 x 4 bytes (Open, High, Low, Close)
  - Market Depth: 10 entries (5 Bids + 5 Asks), each containing:
    - Quantity (4 bytes)
    - Price (4 bytes)
    - Orders (2 bytes)
* **Rate Limits**:
  - 3 requests per second for REST APIs.
  - WebSocket: Up to 3,000 instruments monitored per socket.
* **Redistribution Terms**: Data may be consumed by an authenticated user for personal trading or scanning. Public redistribution of real-time feeds to unsubscribed third parties requires an authorized vendor agreement.
* **Verdict**: **Primary Recommended Production Target**. Highly reliable, comprehensive documentation, industry-standard in India.

---

### C. Upstox API (v2 / v3)
* **Official URL**: `https://upstox.com/developer/api-documentation`
* **Available Endpoints**:
  - `GET /v2/market-quote/quotes?instrument_key=NSE_EQ|INE002A01018`
  - WebSocket Stream: `wss://api.upstox.com/v2/feed/market-data-feed`
* **Payload Fields**:
  - `tbq`: Total Buy Quantity across the entire exchange book for the instrument.
  - `tsq`: Total Sell Quantity across the entire exchange book for the instrument.
  - `depth`: Array of 5 buy levels and 5 sell levels.
* **Rate Limits**:
  - 5 requests/sec REST.
* **Verdict**: **Secondary Recommended Target**. Free for Upstox account holders, modern protobuf/JSON streaming interface.

---

## 4. Development & Testing Limitations

1. **Authentication Token Expiry**: Indian broker APIs require daily re-authentication using OAuth 2.0 and TOTP (Time-based One-Time Password) as mandated by SEBI security guidelines. Access tokens expire at 6:00 AM IST daily.
2. **Market Hours Restriction**: Live market data is only active during NSE trading hours:
   - Normal Market: 09:15 AM to 03:30 PM IST (Monday through Friday)
   - Pre-Open: 09:00 AM to 09:08 AM IST
   - Outside these hours, live feeds return the closing snapshot or static data.
3. **Requirement for High-Fidelity Mock Mode**:
   - Because developers and users need to test scanner algorithms, WebSocket streams, and UI reactivity 24/7 without active market hours or paid credentials, MarketEye **must implement a complete, realistic Mock Market Data Provider**.
   - The mock provider generates realistic price ticks, dynamic order books with shifting buy/sell imbalances, OHLC bars, and volume profiles matching top NIFTY 50 securities.
   - It is strictly labeled `DEMO / MOCK DATA`.

---

## 5. Architectural Adapter Design

To prevent vendor lock-in and enable seamless switching between **Mock Mode**, **Zerodha Kite Connect**, and **Upstox API**, MarketEye isolates provider integration behind a unified interface:

```typescript
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
  getHistoricalData(symbol: string, interval: ChartInterval, range: ChartRange): Promise<HistoricalCandle[]>;

  onTick(listener: (quote: StockQuote) => void): () => void;
  onOrderBookUpdate(listener: (orderBook: OrderBook) => void): () => void;
}
```

This ensures that the scanner engine, normalization layer, REST endpoints, and WebSocket server operate identically regardless of whether the backend is powered by the Mock engine or a live licensed provider.
