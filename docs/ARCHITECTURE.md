# MarketEye System Architecture

## 1. System Overview

MarketEye is an autonomous, high-performance market-scanning web application designed to analyze Indian equity market data (NSE) in real-time. It continuously scans order book depth, calculates buy/sell quantity ratios, and surfaces stocks that meet user-configured threshold rules.

```
                      +---------------------------------------+
                      |   Market Data Source                  |
                      |   - MockMarketDataProvider (24/7 demo)|
                      |   - KiteConnectProvider (Production)  |
                      |   - UpstoxDataProvider (Production)   |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   MarketDataProvider Adapter          |
                      +-------------------+-------------------+
                                          | Raw Feed
                                          v
                      +---------------------------------------+
                      |   Normalizer & Quality Validator      |
                      |   - Sanitizes quantities & prices     |
                      |   - Computes TBQ/TSQ & Buy/Sell %     |
                      |   - Detects stale/missing data        |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             +--------------------+               +--------------------+
             |   Market State     |               |   Scanner Engine   |
             |   In-Memory Cache  |               |   - Rule Registry  |
             +--------------------+               |   - BuyPressureRule|
                        |                         |   - State Tracker  |
                        |                         +---------+----------+
                        |                                   |
                        | Surfaced Results / Events         |
                        +-----------------+-----------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   Real-time WebSocket & REST Server   |
                      |   (Express + ws + SQLite/Postgres)    |
                      +-------------------+-------------------+
                                          | JSON over WS & HTTP
                                          v
                      +---------------------------------------+
                      |   React + TypeScript Frontend Client  |
                      |   - Terminal Dashboard                |
                      |   - "Stocks Under Your Eyes" Table    |
                      |   - Configurable Scanner Sliders      |
                      |   - 5-Level Depth Order Book          |
                      |   - Interactive Candlestick Charts    |
                      |   - Watchlist & Audio/In-App Alerts   |
                      +---------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Market Data Ingestion & Adapter Layer
The system defines a strict provider contract (`MarketDataProvider`) guaranteeing uniform ingestion. 
- **Decoupling**: The business logic is 100% agnostic to whether quotes originate from an official broker WebSocket (Zerodha/Upstox) or the internal multi-threaded Mock engine.
- **Data Quality Pipeline**: Every received quote is enriched with:
  - `source`: identifier of provider
  - `receivedAt`: Unix timestamp when received by MarketEye
  - `exchangeTimestamp`: timestamp reported by exchange
  - `dataFreshness`: milliseconds elapsed since exchange timestamp
  - `isStale`: boolean flag indicating latency > threshold (e.g. > 5000ms)

### 2.2 Normalization & Calculation Service
Implements mathematically rigorous order-book metrics:
$$\text{Total Quantity} = \text{Total Buy Quantity} + \text{Total Sell Quantity}$$
$$\text{Buy Quantity \%} = \frac{\text{Total Buy Quantity}}{\text{Total Quantity}} \times 100$$
$$\text{Sell Quantity \%} = \frac{\text{Total Sell Quantity}}{\text{Total Quantity}} \times 100$$
$$\text{Order Book Imbalance Ratio} = \frac{\text{Total Buy Quantity} - \text{Total Sell Quantity}}{\text{Total Quantity}}$$

Edge-case rules:
1. If $\text{Total Quantity} == 0$, $\text{Buy \%} = 0$, $\text{Sell \%} = 0$, status = `NO_ORDER_DATA`.
2. Stale data (> 15 seconds without tick) triggers `STALE_DATA` warning.
3. Negative quantities or non-numeric inputs are discarded with an error log.

### 2.3 Reactive Scanner Engine
- Listens to incoming normalized ticks and order-book updates.
- Evaluates configured rules against each stock:
  - Default **Buy Pressure Rule**: `buyPercentage >= buyThreshold && sellPercentage <= sellThreshold`.
  - Additional filters: `minVolume`, `minPriceChange`, `maxPriceChange`.
- **State Transition Tracker**: Emits `SCANNER_TRIGGER` only on state entry (avoiding alert floods) and `SCANNER_REMOVE` when a stock ceases to satisfy criteria.
- **Explainability**: Every surfaced result attaches a structured explanation explaining exactly which threshold was breached.

### 2.4 Persistence Layer
- Employs a Repository pattern with dual-driver support:
  - **SQLite (Default)**: Zero-configuration local development. Database file created automatically in `data/marketeye.sqlite`.
  - **PostgreSQL**: Production deployment via standard `DATABASE_URL`.
- Persists:
  - User-configured scanner rules and thresholds
  - Watchlist items with custom user notes
  - Alert notification history
  - Historical snapshots for auditability

### 2.5 Real-Time Communication Layer (WebSocket)
- Lightweight Node.js `ws` server co-located with Express HTTP API.
- Heartbeat / ping-pong pinging every 30 seconds with automatic reconnection logic on frontend.
- Channels:
  - `subscribe:stocks`: Receives live LTP and mini-quote ticks
  - `subscribe:orderbook:<symbol>`: Receives full 5-level depth and total quantity updates
  - `subscribe:scanner`: Broadcasts surfaced stock updates, removals, and system alerts

### 2.6 Frontend Architecture
- Built with React 19 / Vite / TypeScript / Tailwind CSS.
- **Glassmorphic Financial Terminal Theme**: Dark slate palette (`#0a0f1d`, `#111827`, `#1f2937`) with Emerald (`#10b981`) for buy pressure and Rose (`#f43f5e`) for sell pressure.
- **Clear Status Visibility**:
  - Live data feed badge: `DEMO / MOCK DATA` or `LIVE PROVIDER (NSE)`
  - Exchange clock and status badge: Market Open / Market Closed / Pre-Open
  - WebSocket link status badge (Live / Connecting / Disconnected)
- **Interactive Modals & Charts**:
  - Detailed Order Book visualizer with bid/ask depth bars
  - Interactive Candlestick / Area Chart with interval switching (1m, 5m, 15m, 1h, 1D)
  - Watchlist drawer and toast alerts with optional audio chime
