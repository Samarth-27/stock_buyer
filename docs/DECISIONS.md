# Architectural Decision Records (ADRs)

## ADR-001: Data Ingestion Strategy & Scraping Policy
* **Status**: Accepted
* **Context**: The application scans Indian equity markets. Some developers scrape `nseindia.com` or unofficial APIs.
* **Decision**: We strictly ban web scraping. Scraping violates NSE terms, risks IP blocks, and provides fragile, unverified data. Instead, we architect an abstract `MarketDataProvider` interface supporting licensed broker APIs (Zerodha Kite Connect, Upstox) and a high-fidelity 24/7 Mock Market Data Provider for offline development and testing.
* **Consequences**: Zero legal risk, high reliability, clean separation of concerns.

---

## ADR-002: Dual-Driver Persistence (SQLite Out-of-the-Box with PostgreSQL Support)
* **Status**: Accepted
* **Context**: Requirements specify PostgreSQL for production, but local developers and QA testers should be able to run `npm run dev` with zero setup (without requiring a pre-installed, running PostgreSQL daemon on their machines).
* **Decision**: We implement an abstract storage repository layer with SQLite as the default embedded engine for local dev and PostgreSQL as the configurable target for Docker/production environments (`DATABASE_URL=postgresql://...`).
* **Consequences**: Seamless zero-friction onboarding for developers while meeting enterprise production database criteria.

---

## ADR-003: Monorepo vs Multi-Package Scaffolding
* **Status**: Accepted
* **Context**: We need clean separation between backend API, frontend web client, shared models/utilities, and end-to-end tests.
* **Decision**: Use an npm workspaces structure:
  - `apps/api`: Express, WebSocket, Scanner Engine, Data Adapters
  - `apps/web`: React, Vite, Tailwind CSS, Terminal UI
  - `packages/shared`: Shared TypeScript types, mathematical formulas, constants, and validators
* **Consequences**: Strong typing across boundaries, single `npm install` at root, and atomic full-stack commits.

---

## ADR-004: Real-time Communication Mechanism (WebSocket over SSE or Polling)
* **Status**: Accepted
* **Context**: High-frequency order book and quote ticks arrive multiple times per second. Scanning rules require instant evaluation and low-latency delivery to the UI.
* **Decision**: Use bidirectional WebSocket (`ws` on Node.js, native `WebSocket` in browser) for market data ticks, order book depth, and scanner events, with REST API for initial hydration, history, and configuration mutations.
* **Consequences**: Minimal network overhead, sub-millisecond dispatch, bi-directional subscription capability.

---

## ADR-005: Buy/Sell Quantity Terminology and Analytical Stance
* **Status**: Accepted
* **Context**: Retail traders often confuse total buy order quantities with "guaranteed buyer sentiment" or "investor count".
* **Decision**: Strictly prohibit speculative claims or prediction terms. Use factual terminology: "Total Buy Quantity", "Total Sell Quantity", "Buy Quantity %", and "Order Book Imbalance". Include clear analytical disclaimers throughout the UI and documentation.
* **Consequences**: Compliance with SEBI guidelines and regulatory risk mitigation.
