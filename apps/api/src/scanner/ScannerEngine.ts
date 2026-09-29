import {
  StockQuote,
  OrderBook,
  ScannerRuleConfig,
  ScannerResult,
  MarketAlert,
  DEFAULT_SCANNER_CONFIG,
  evaluateBuyPressure,
} from '@marketeye/shared';
import { IRepository } from '../storage/repository.js';

export interface ScannerEventListener {
  onTrigger?: (result: ScannerResult, alert: MarketAlert) => void;
  onRemove?: (symbol: string, reason: string) => void;
  onUpdate?: (results: ScannerResult[]) => void;
}

export class ScannerEngine {
  private config: ScannerRuleConfig = { ...DEFAULT_SCANNER_CONFIG };
  private activeResults: Map<string, ScannerResult> = new Map();
  private listeners: Set<ScannerEventListener> = new Set();
  private repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async init(): Promise<void> {
    this.config = await this.repository.getScannerConfig();
    console.log(
      `[ScannerEngine] Initialized with rule "${this.config.name}" (Buy >= ${this.config.buyThreshold}%, Sell <= ${this.config.sellThreshold}%)`
    );
  }

  getConfig(): ScannerRuleConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<ScannerRuleConfig>): Promise<ScannerRuleConfig> {
    this.config = await this.repository.updateScannerConfig(newConfig);
    console.log(
      `[ScannerEngine] Config updated: Buy >= ${this.config.buyThreshold}%, Sell <= ${this.config.sellThreshold}%, MinVol = ${this.config.minVolume}`
    );
    // Re-evaluate active results with new thresholds
    this.reevaluateAll();
    return { ...this.config };
  }

  getActiveResults(): ScannerResult[] {
    return Array.from(this.activeResults.values());
  }

  addListener(listener: ScannerEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Evaluates a stock quote / order book update.
   */
  processQuote(quote: StockQuote): void {
    if (!this.config.enabled) {
      if (this.activeResults.size > 0) {
        this.activeResults.clear();
        this.notifyUpdate();
      }
      return;
    }

    const evaluation = evaluateBuyPressure(
      quote.buyPercentage,
      quote.sellPercentage,
      this.config.buyThreshold,
      this.config.sellThreshold,
      quote.volume,
      this.config.minVolume,
      quote.changePercent,
      this.config.minPriceChange
    );

    const isCurrentlyActive = this.activeResults.has(quote.symbol);

    if (evaluation.matches) {
      const result: ScannerResult = {
        symbol: quote.symbol,
        companyName: quote.companyName,
        ltp: quote.ltp,
        changePercent: quote.changePercent,
        volume: quote.volume,
        totalBuyQuantity: quote.totalBuyQuantity,
        totalSellQuantity: quote.totalSellQuantity,
        buyPercentage: quote.buyPercentage,
        sellPercentage: quote.sellPercentage,
        ruleId: this.config.id,
        ruleName: this.config.name,
        reason: evaluation.reason,
        surfacedAt: isCurrentlyActive
          ? this.activeResults.get(quote.symbol)!.surfacedAt
          : new Date().toISOString(),
      };

      this.activeResults.set(quote.symbol, result);

      if (!isCurrentlyActive) {
        // Stock freshly breached threshold -> Create alert
        const alert: MarketAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          symbol: quote.symbol,
          type: 'SCANNER_TRIGGER',
          title: `New Stock Under Your Eyes: ${quote.symbol}`,
          message: evaluation.reason,
          timestamp: new Date().toISOString(),
          read: false,
          metadata: {
            buyPercentage: quote.buyPercentage,
            sellPercentage: quote.sellPercentage,
            ltp: quote.ltp,
          },
        };

        this.repository.addAlert(alert).catch((err) => {
          console.error('[ScannerEngine] Failed to persist alert:', err);
        });

        this.listeners.forEach((l) => l.onTrigger?.(result, alert));
      }

      this.notifyUpdate();
    } else if (isCurrentlyActive) {
      // Stock dropped below thresholds
      this.activeResults.delete(quote.symbol);
      const dropReason = `Buy percentage dropped to ${quote.buyPercentage.toFixed(1)}% (below ${this.config.buyThreshold.toFixed(1)}% threshold)`;
      this.listeners.forEach((l) => l.onRemove?.(quote.symbol, dropReason));
      this.notifyUpdate();
    }
  }

  private reevaluateAll(): void {
    // When config changes, clear active results and notify UI so they regenerate dynamically
    this.activeResults.clear();
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    const list = this.getActiveResults();
    this.listeners.forEach((l) => l.onUpdate?.(list));
  }
}
