# MarketEye — Autonomous Stock Market Scanner

> *"See the stocks that deserve your attention."*

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Exchange](https://img.shields.io/badge/Exchange-NSE%20India-orange)](https://www.nseindia.com)
[![Data Mode](https://img.shields.io/badge/Data%20Feed-Demo%20%2F%20Mock%20%7C%20Production%20Adapter-indigo)]()

---

## 1. Product Purpose

**MarketEye** is a real-time information and market-scanning platform for Indian equity markets (NSE). It continuously evaluates order-book quantities across prominent liquid equities and surfaces securities that satisfy user-configured market condition thresholds.

### Key Data Principles
* **Accurate Order-Book Terminology**: Surfaces **Total Buy Quantity**, **Total Sell Quantity**, **Buy Quantity %**, **Sell Quantity %**, and **Order-book imbalance**.
* **Zero Scraping Policy**: Does not scrape websites. Integrates official licensed broker APIs (Zerodha Kite Connect, Upstox) and includes a high-fidelity 24/7 Mock Simulation Provider for offline development and testing.
* **Analytical & Educational Stance**: MarketEye does NOT claim that surfaced stocks will rise or fall, does NOT automatically place trades, and does NOT generate "guaranteed buy signals".

---

## 2. Architecture & Data Flow

```
   Market Data Provider (Mock 24/7 / Zerodha Kite / Upstox)
                        │
                        ▼
            Normalizer & Validator
   (Computes TBQ, TSQ, Buy %, Sell %, Imbalance, Freshness)
                        │
                        ▼
                 Scanner Engine
      (Evaluates Buy Pressure Rule >= 60% Buy, <= 40% Sell)
                        │
                        ▼
      WebSocket Broadcast & REST Server (Express)
                        │
                        ▼
      React Terminal Dashboard (Vite + Tailwind CSS)
```

---

## 3. Core Features

1. **"Stocks Under Your Eyes" Dashboard**:
   - Surfaces securities meeting the Buy Pressure rule (default: **Buy Quantity % ≥ 60%** and **Sell Quantity % ≤ 40%**).
   - Shows the exact human-readable reason why each stock surfaced (e.g., *"Buy quantity reached 64.2%, exceeding your 60.0% threshold."*).
   - Dual-color visual progress bars depicting real-time buy/sell order imbalance.
2. **Configurable Scanner Engine**:
   - Interactive sliders to dynamically adjust Buy Threshold (50% to 90%), Sell Threshold (10% to 50%), and Minimum Volume filter.
   - Immediate re-evaluation and live push over WebSocket.
3. **5-Level Market Depth (Order Book)**:
   - Level 2 market depth with Top 5 Bids (Price, Quantity, Orders) and Top 5 Asks.
   - Proportional volume depth visualizer.
4. **Interactive Price Charts**:
   - Candlestick and Area chart views.
   - Timeframe intervals: `1m`, `5m`, `15m`, `1h`, `1D`.
   - OHLC crosshair inspection tooltips.
5. **Watchlist with Persistence**:
   - Save custom equities to monitor.
   - Auto-saved to repository storage.
6. **Real-time Alerting**:
   - Floating toast notifications on state transitions.
   - Slide-over alert center recording trigger history.
   - Built-in Web Audio API alert chimes (toggleable).
7. **24/7 Mock Simulation Mode**:
   - Full simulation of 25 liquid NIFTY 50 securities with dynamic order book drift, tick oscillations, and historical bars.
   - Clearly badged with `DEMO / MOCK DATA`.

---

## 4. Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
*(Default settings run in high-fidelity Mock Mode with zero external dependencies required).*

### Step 3: Start Development Servers
```bash
npm run dev
```
- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **REST API**: [http://localhost:3001/api](http://localhost:3001/api)
- **Swagger Documentation**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **WebSocket Feed**: `ws://localhost:3001/ws`

---

## 5. Testing & Quality Verification

Run all unit and integration test suites:
```bash
npm test
```

Build all packages for production:
```bash
npm run build
```

---

## 6. Docker Containerization

Run the entire stack via Docker Compose:
```bash
docker-compose up --build
```
- Web Application: [http://localhost:80](http://localhost:80)
- Backend API: [http://localhost:3001/api](http://localhost:3001/api)

---

## 7. Documentation Suite

* [Data Source Research](docs/DATA_SOURCE_RESEARCH.md)
* [System Architecture](docs/ARCHITECTURE.md)
* [Architectural Decisions (ADRs)](docs/DECISIONS.md)
* [Scanner Rules & Mathematical Formulations](docs/SCANNER_RULES.md)
* [Data Models](docs/DATA_MODEL.md)
* [API & WebSocket Protocol Specification](docs/API.md)
* [Security Controls](docs/SECURITY.md)
* [Development Guide](docs/DEVELOPMENT.md)
* [Deployment Guide](docs/DEPLOYMENT.md)

---

## 8. Regulatory & Analytical Disclaimer

MarketEye is strictly an analytical market-scanning application designed for information purposes only. Data displayed represents open limit order book quantities registered on the exchange, which may be modified or cancelled by market participants at any time. MarketEye does not make trade recommendations or guarantee price movements.
