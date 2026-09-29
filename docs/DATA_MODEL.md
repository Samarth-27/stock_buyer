# MarketEye Data Models

## 1. Domain Entities

```typescript
export interface MarketDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderBook {
  symbol: string;
  exchange: 'NSE';
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  imbalanceRatio: number; // (buy - sell) / total, range [-1.0, 1.0]
  bids: MarketDepthEntry[]; // Sorted descending by price (Level 1..5)
  asks: MarketDepthEntry[]; // Sorted ascending by price (Level 1..5)
  timestamp: string; // ISO 8601
  source: string; // e.g. 'MOCK_FEED' | 'KITE_CONNECT' | 'UPSTOX'
  isStale: boolean;
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: 'NSE';
  ltp: number; // Last Traded Price
  open: number;
  high: number;
  low: number;
  close: number; // Current or latest close
  previousClose: number;
  change: number; // ltp - previousClose
  changePercent: number; // ((ltp - previousClose) / previousClose) * 100
  volume: number; // Cumulative daily volume
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  timestamp: string;
  source: string;
  isStale: boolean;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScannerRuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  buyThreshold: number; // e.g. 60.0
  sellThreshold: number; // e.g. 40.0
  minVolume: number; // e.g. 10000
  minPriceChange?: number; // e.g. -5.0
  maxPriceChange?: number; // e.g. 20.0
  updatedAt: string;
}

export interface ScannerResult {
  symbol: string;
  companyName: string;
  ltp: number;
  changePercent: number;
  volume: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  ruleId: string;
  ruleName: string;
  reason: string;
  surfacedAt: string; // ISO timestamp
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  addedAt: string;
  notes?: string;
}

export interface MarketAlert {
  id: string;
  symbol: string;
  type: 'SCANNER_TRIGGER' | 'SCANNER_DROP' | 'PRICE_MOVE' | 'FEED_STATUS';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
```

---

## 2. Database Schema (SQLite / PostgreSQL)

### `scanner_configs`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY |
| `name` | VARCHAR(128) | NOT NULL |
| `buy_threshold` | DOUBLE PRECISION | NOT NULL DEFAULT 60.0 |
| `sell_threshold` | DOUBLE PRECISION | NOT NULL DEFAULT 40.0 |
| `min_volume` | BIGINT | NOT NULL DEFAULT 10000 |
| `min_price_change` | DOUBLE PRECISION | NULL |
| `max_price_change` | DOUBLE PRECISION | NULL |
| `enabled` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT CURRENT_TIMESTAMP |

### `watchlist`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `symbol` | VARCHAR(32) | PRIMARY KEY |
| `company_name` | VARCHAR(128) | NOT NULL |
| `notes` | TEXT | NULL |
| `added_at` | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT CURRENT_TIMESTAMP |

### `alerts`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY |
| `symbol` | VARCHAR(32) | NOT NULL |
| `type` | VARCHAR(32) | NOT NULL |
| `title` | VARCHAR(256) | NOT NULL |
| `message` | TEXT | NOT NULL |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| `read` | BOOLEAN | NOT NULL DEFAULT FALSE |

### `scanner_history`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY |
| `symbol` | VARCHAR(32) | NOT NULL |
| `buy_percentage` | DOUBLE PRECISION | NOT NULL |
| `sell_percentage` | DOUBLE PRECISION | NOT NULL |
| `reason` | TEXT | NOT NULL |
| `surfaced_at` | TIMESTAMP WITH TIME ZONE | NOT NULL |
