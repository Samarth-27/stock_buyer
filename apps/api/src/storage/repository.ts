import fs from 'fs';
import path from 'path';
import {
  ScannerRuleConfig,
  WatchlistItem,
  MarketAlert,
  PortfolioHolding,
  DEFAULT_SCANNER_CONFIG,
} from '@marketeye/shared';

interface AppStoreData {
  scannerConfig: ScannerRuleConfig;
  watchlist: Record<string, WatchlistItem>;
  alerts: MarketAlert[];
  portfolioHoldings: PortfolioHolding[];
}

export interface IRepository {
  getScannerConfig(): Promise<ScannerRuleConfig>;
  updateScannerConfig(config: Partial<ScannerRuleConfig>): Promise<ScannerRuleConfig>;
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(item: WatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(symbol: string): Promise<boolean>;
  getAlerts(limit?: number): Promise<MarketAlert[]>;
  addAlert(alert: MarketAlert): Promise<MarketAlert>;
  markAlertAsRead(id: string): Promise<boolean>;
  clearAlerts(): Promise<void>;
  getPortfolioHoldings(): Promise<PortfolioHolding[]>;
  savePortfolioHoldings(holdings: PortfolioHolding[]): Promise<PortfolioHolding[]>;
  addPortfolioHolding(holding: PortfolioHolding): Promise<PortfolioHolding>;
  deletePortfolioHolding(id: string): Promise<boolean>;
}

export class JsonFileRepository implements IRepository {
  private filePath: string;
  private data: AppStoreData;

  constructor(filePath?: string) {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Fallback to local relative directory
      }
    }

    this.filePath = filePath || path.join(dataDir, 'marketeye_store.json');
    this.data = this.loadData();
  }

  private loadData(): AppStoreData {
    const defaultData: AppStoreData = {
      scannerConfig: { ...DEFAULT_SCANNER_CONFIG },
      watchlist: {
        RELIANCE: {
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Ltd.',
          addedAt: new Date().toISOString(),
          notes: 'NIFTY 50 Heavyweight',
        },
        TCS: {
          symbol: 'TCS',
          companyName: 'Tata Consultancy Services Ltd.',
          addedAt: new Date().toISOString(),
          notes: 'IT Sector bellwether',
        },
        HDFCBANK: {
          symbol: 'HDFCBANK',
          companyName: 'HDFC Bank Ltd.',
          addedAt: new Date().toISOString(),
          notes: 'Banking sector leader',
        },
      },
      alerts: [],
      portfolioHoldings: [],
    };

    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          scannerConfig: parsed.scannerConfig || defaultData.scannerConfig,
          watchlist: parsed.watchlist || defaultData.watchlist,
          alerts: parsed.alerts || defaultData.alerts,
          portfolioHoldings: parsed.portfolioHoldings || defaultData.portfolioHoldings,
        };
      }
    } catch (err) {
      console.warn('[Repository] Failed to read store file, using in-memory defaults:', err);
    }

    this.persist(defaultData);
    return defaultData;
  }

  private persist(data: AppStoreData): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Repository] Failed to persist data to file:', err);
    }
  }

  async getScannerConfig(): Promise<ScannerRuleConfig> {
    return { ...this.data.scannerConfig };
  }

  async updateScannerConfig(update: Partial<ScannerRuleConfig>): Promise<ScannerRuleConfig> {
    this.data.scannerConfig = {
      ...this.data.scannerConfig,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.persist(this.data);
    return { ...this.data.scannerConfig };
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    return Object.values(this.data.watchlist);
  }

  async addToWatchlist(item: WatchlistItem): Promise<WatchlistItem> {
    const symbol = item.symbol.toUpperCase();
    this.data.watchlist[symbol] = {
      ...item,
      symbol,
      addedAt: item.addedAt || new Date().toISOString(),
    };
    this.persist(this.data);
    return this.data.watchlist[symbol];
  }

  async removeFromWatchlist(symbol: string): Promise<boolean> {
    const key = symbol.toUpperCase();
    if (this.data.watchlist[key]) {
      delete this.data.watchlist[key];
      this.persist(this.data);
      return true;
    }
    return false;
  }

  async getAlerts(limit: number = 50): Promise<MarketAlert[]> {
    return this.data.alerts.slice(-limit).reverse();
  }

  async addAlert(alert: MarketAlert): Promise<MarketAlert> {
    this.data.alerts.push(alert);
    // Keep last 200 alerts max
    if (this.data.alerts.length > 200) {
      this.data.alerts = this.data.alerts.slice(-200);
    }
    this.persist(this.data);
    return alert;
  }

  async markAlertAsRead(id: string): Promise<boolean> {
    const target = this.data.alerts.find((a) => a.id === id);
    if (target) {
      target.read = true;
      this.persist(this.data);
      return true;
    }
    return false;
  }

  async clearAlerts(): Promise<void> {
    this.data.alerts = [];
    this.persist(this.data);
  }

  async getPortfolioHoldings(): Promise<PortfolioHolding[]> {
    return [...(this.data.portfolioHoldings || [])];
  }

  async savePortfolioHoldings(holdings: PortfolioHolding[]): Promise<PortfolioHolding[]> {
    this.data.portfolioHoldings = [...holdings];
    this.persist(this.data);
    return this.data.portfolioHoldings;
  }

  async addPortfolioHolding(holding: PortfolioHolding): Promise<PortfolioHolding> {
    const list = this.data.portfolioHoldings || [];
    const idx = list.findIndex((h) => h.id === holding.id);
    if (idx >= 0) {
      list[idx] = holding;
    } else {
      list.push(holding);
    }
    this.data.portfolioHoldings = list;
    this.persist(this.data);
    return holding;
  }

  async deletePortfolioHolding(id: string): Promise<boolean> {
    const list = this.data.portfolioHoldings || [];
    const before = list.length;
    this.data.portfolioHoldings = list.filter((h) => h.id !== id);
    if (this.data.portfolioHoldings.length !== before) {
      this.persist(this.data);
      return true;
    }
    return false;
  }
}

export const repository = new JsonFileRepository();
