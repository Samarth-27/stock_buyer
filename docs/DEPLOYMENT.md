# Deployment & Containerization Guide

## 1. Docker Deployment

MarketEye is containerized using Docker and Docker Compose.

### Quick Start with Docker Compose
```bash
docker-compose up --build -d
```

Services started:
- `marketeye-api`: Express REST + WebSocket server on port 3001
- `marketeye-web`: Nginx-served static React bundle on port 80
- `postgres`: PostgreSQL 16 database on port 5432 (optional when DATABASE_URL is configured)

---

## 2. Environment Variables

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment | `development` | Yes (`production`) |
| `PORT` | API Server Port | `3001` | No |
| `MARKET_DATA_MODE` | Data source: `mock`, `kite`, `upstox` | `mock` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Empty (SQLite fallback) | Recommended for prod |
| `CORS_ORIGIN` | Allowed web client origin | `http://localhost:5173` | Yes |
| `KITE_API_KEY` | Zerodha Kite Connect API key | None | Yes if `mode=kite` |
| `KITE_ACCESS_TOKEN` | Zerodha Kite Session token | None | Yes if `mode=kite` |
| `UPSTOX_API_KEY` | Upstox API key | None | Yes if `mode=upstox` |
| `UPSTOX_ACCESS_TOKEN` | Upstox OAuth access token | None | Yes if `mode=upstox` |

---

## 3. Production Health Checks
- HTTP check: `GET http://localhost:3001/api/health`
- Response:
  ```json
  {
    "status": "ok",
    "uptime": 12480,
    "provider": {
      "id": "mock-nse-feed",
      "mode": "mock",
      "connected": true
    },
    "storage": "sqlite",
    "timestamp": "2026-09-30T00:30:00.000Z"
  }
  ```
