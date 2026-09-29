# MarketEye Security Architecture

## 1. Principles

1. **Zero Secret Leakage**: API credentials, exchange tokens, and secrets are strictly loaded via `.env` and environment variables. Secrets are excluded from git through `.gitignore` and sanitized from logs.
2. **Fail-Closed Production Feeds**: In `MARKET_DATA_MODE=provider`, missing or rejected credentials immediately halt the feed with an explicit "Market data unavailable" state; under no circumstances are fake or simulated figures substituted in production mode.
3. **Rigorous Input Validation**: Every REST payload and WebSocket message is validated through `Zod` schemas with strict type constraints.
4. **Defense in Depth**:
   - HTTP Security Headers using `Helmet`
   - Cross-Origin Resource Sharing (CORS) restricted to trusted origins
   - Rate limiting on API routes via `express-rate-limit`
   - WebSocket origin verification and packet payload size limits

---

## 2. API Security Measures

- **Helmet**: Disables `X-Powered-By`, sets `X-Content-Type-Options: nosniff`, and configures Content Security Policy (CSP).
- **CORS**: Configured with explicit `CORS_ORIGIN` whitelist (defaults to `http://localhost:5173` in local development).
- **Rate Limiting**:
  - Global API limiter: 300 requests per minute per IP.
  - Scanner config mutation limiter: 30 requests per minute per IP.
- **Payload Limits**: Max request size capped at 100kb to mitigate denial-of-service attempts.

---

## 3. Credential Handling

The application requires `.env` configuration. A sanitized template `.env.example` is committed to the repository:

```bash
# Application Environment
NODE_ENV=development
PORT=3001

# Data Provider Configuration
# Supported modes: 'mock' | 'kite' | 'upstox'
MARKET_DATA_MODE=mock

# Broker Credentials (Required ONLY if MARKET_DATA_MODE is 'kite' or 'upstox')
KITE_API_KEY=
KITE_API_SECRET=
KITE_ACCESS_TOKEN=

UPSTOX_API_KEY=
UPSTOX_API_SECRET=
UPSTOX_REDIRECT_URI=
UPSTOX_ACCESS_TOKEN=

# Database Configuration (Defaults to embedded SQLite if empty)
DATABASE_URL=

# CORS & Security
CORS_ORIGIN=http://localhost:5173
```
