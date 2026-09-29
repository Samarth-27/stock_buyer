# Development Guide

## Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Git

## Getting Started in 3 Steps

### 1. Clone & Install
```bash
git clone <repository_url>
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
By default, `MARKET_DATA_MODE=mock` is enabled. You can run the entire system offline immediately without any API keys or external database setup!

### 3. Start Development Server
```bash
npm run dev
```
This starts:
- **Backend API & WebSocket server** at `http://localhost:3001`
- **Frontend Dashboard** at `http://localhost:5173`

Open your browser to `http://localhost:5173` to see MarketEye live.

---

## Testing Commands
- Run all unit and integration tests:
  ```bash
  npm test
  ```
- Run tests in watch mode:
  ```bash
  npm run test:watch
  ```
- Run frontend type check and linter:
  ```bash
  npm run lint
  ```
- Verify production build:
  ```bash
  npm run build
  ```
