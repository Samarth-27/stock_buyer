# MarketEye API Reference

## 1. REST Endpoints

Base URL: `http://localhost:3001/api`

### Health & System Status
* `GET /health`
  - Returns backend health, uptime, provider status, and active persistence driver.
* `GET /market-status`
  - Returns current Indian stock market session: `OPEN` (09:15-15:30 IST), `PRE_OPEN` (09:00-09:08 IST), `CLOSED`, or `HOLIDAY`, along with server time in IST and data feed mode.

### Stocks & Quotes
* `GET /stocks`
  - Returns all monitored equity symbols with latest quote, LTP, TBQ, TSQ, and buy/sell percentages.
  - Query parameters: `?search=RELIANCE&limit=50`
* `GET /stocks/:symbol`
  - Returns comprehensive stock metadata, OHLC, current depth, and metrics.
* `GET /stocks/:symbol/quote`
  - Returns lightweight real-time quote for the symbol.
* `GET /stocks/:symbol/order-book`
  - Returns top-5 market depth (bids and asks), total buy quantity, total sell quantity, and calculated percentages.
* `GET /stocks/:symbol/history`
  - Returns historical OHLC candlestick array.
  - Query parameters: `?interval=1m|5m|15m|1h|1D&range=1d|5d|1mo|1y`

### Scanner
* `GET /scanner/results`
  - Returns currently surfaced stocks matching configured criteria, with human-readable rationale.
* `GET /scanner/config`
  - Returns active scanner threshold configuration.
* `PUT /scanner/config`
  - Updates scanner thresholds.
  - Request body:
    ```json
    {
      "buyThreshold": 62.5,
      "sellThreshold": 37.5,
      "minVolume": 15000,
      "minPriceChange": -2.0
    }
    ```

### Watchlist
* `GET /watchlist`
  - Returns list of symbols currently in user watchlist with live quotes.
* `POST /watchlist`
  - Adds symbol to watchlist.
  - Body: `{ "symbol": "TCS", "notes": "Core tech holding" }`
* `DELETE /watchlist/:symbol`
  - Removes symbol from watchlist.

### Alerts
* `GET /alerts`
  - Returns recent alerts triggered by the scanner engine.
* `POST /alerts/:id/read`
  - Marks an alert as read.
* `DELETE /alerts`
  - Clears alert history.

---

## 2. WebSocket Protocol

WebSocket Endpoint: `ws://localhost:3001/ws`

### Client Messages:
```json
{ "action": "subscribe", "channel": "stocks" }
{ "action": "subscribe", "channel": "orderbook", "symbol": "RELIANCE" }
{ "action": "unsubscribe", "channel": "orderbook", "symbol": "RELIANCE" }
```

### Server Events:
* `TICK`: Stream of updated stock quotes.
* `ORDER_BOOK`: Stream of 5-level depth updates.
* `SCANNER_TRIGGER`: Emitted when a stock satisfies configured thresholds.
* `SCANNER_REMOVE`: Emitted when a previously surfaced stock drops below thresholds.
* `ALERT`: In-app alert notification.
