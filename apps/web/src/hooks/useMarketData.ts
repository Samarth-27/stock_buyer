import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StockQuote,
  OrderBook,
  ScannerResult,
  ScannerRuleConfig,
  WatchlistItem,
  MarketAlert,
  MarketStatusInfo,
  DEFAULT_SCANNER_CONFIG,
  MONITORED_NSE_STOCKS,
  calculateSwingTradePlan,
} from '@marketeye/shared';
import {
  fetchMarketStatus,
  fetchAllStocks,
  fetchScannerResults,
  fetchScannerConfig,
  updateScannerConfig,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  fetchAlerts,
  clearAllAlerts,
  fetchProviderInfo,
  ProviderInfo,
} from '../services/api.js';
import { useWebSocket } from './useWebSocket.js';
import { soundManager } from '../services/audio.js';

export interface UseMarketDataReturn {
  marketStatus: MarketStatusInfo | null;
  providerInfo: ProviderInfo | null;
  scannerConfig: ScannerRuleConfig;
  surfacedResults: ScannerResult[];
  allStocks: StockQuote[];
  quotesMap: Map<string, StockQuote>;
  watchlist: WatchlistItem[];
  watchlistSymbols: Set<string>;
  surfacedSymbols: Set<string>;
  alerts: MarketAlert[];
  unreadAlertsCount: number;
  latestTrigger: ScannerResult | null;
  networkError: string | null;
  isConfigUpdating: boolean;
  soundEnabled: boolean;
  liveOrderBook: OrderBook | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  loadInitialData: () => Promise<void>;
  updateConfig: (newConfig: Partial<ScannerRuleConfig>) => Promise<void>;
  toggleWatchlist: (symbol: string) => Promise<void>;
  toggleSound: () => void;
  clearAlerts: () => Promise<void>;
  subscribeOrderBook: (symbol: string) => void;
  unsubscribeOrderBook: (symbol: string) => void;
  reconnect: () => void;
}

export function useMarketData(): UseMarketDataReturn {
  // Core State
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo | null>(null);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [scannerConfig, setScannerConfig] = useState<ScannerRuleConfig>({ ...DEFAULT_SCANNER_CONFIG });
  const [surfacedResults, setSurfacedResults] = useState<ScannerResult[]>([]);
  const [allStocks, setAllStocks] = useState<StockQuote[]>([]);
  const [quotesMap, setQuotesMap] = useState<Map<string, StockQuote>>(new Map());
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [latestTrigger, setLatestTrigger] = useState<ScannerResult | null>(null);

  // Transient / Status State
  const [liveOrderBook, setLiveOrderBook] = useState<OrderBook | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Derived Lookup Sets & Metrics
  const watchlistSymbols = useMemo(() => new Set(watchlist.map((w) => w.symbol)), [watchlist]);
  const surfacedSymbols = useMemo(() => new Set(surfacedResults.map((r) => r.symbol)), [surfacedResults]);
  const unreadAlertsCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  // Real-time WebSocket Callbacks
  const handleTick = useCallback((quote: StockQuote) => {
    setQuotesMap((prev) => {
      const next = new Map(prev);
      next.set(quote.symbol, quote);
      return next;
    });

    setAllStocks((prev) => {
      const idx = prev.findIndex((s) => s.symbol === quote.symbol);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = quote;
        return copy;
      }
      return [...prev, quote];
    });

    setSurfacedResults((prev) => {
      const idx = prev.findIndex((r) => r.symbol === quote.symbol);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          ltp: quote.ltp,
          changePercent: quote.changePercent,
          volume: quote.volume,
          totalBuyQuantity: quote.totalBuyQuantity,
          totalSellQuantity: quote.totalSellQuantity,
          buyPercentage: quote.buyPercentage,
          sellPercentage: quote.sellPercentage,
          prediction: quote.prediction ?? copy[idx].prediction,
          swingPlan: quote.swingPlan ?? copy[idx].swingPlan,
          swingSetup: quote.swingSetup ?? copy[idx].swingSetup,
        };
        return copy;
      }
      return prev;
    });
  }, []);

  const handleOrderBook = useCallback((ob: OrderBook) => {
    setLiveOrderBook(ob);
  }, []);

  const handleScannerSnapshot = useCallback((results: ScannerResult[]) => {
    setSurfacedResults(results);
  }, []);

  const handleScannerTrigger = useCallback((result: ScannerResult) => {
    setLatestTrigger(result);
    setSurfacedResults((prev) => {
      const exists = prev.some((r) => r.symbol === result.symbol);
      if (exists) {
        return prev.map((r) => (r.symbol === result.symbol ? result : r));
      }
      return [result, ...prev];
    });
  }, []);

  const handleScannerRemove = useCallback((symbol: string) => {
    setSurfacedResults((prev) => prev.filter((r) => r.symbol !== symbol));
  }, []);

  const handleAlert = useCallback((alert: MarketAlert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) return prev;
      return [alert, ...prev];
    });
  }, []);

  // WebSocket Connection
  const { isConnected, isConnecting, subscribeOrderBook, unsubscribeOrderBook, reconnect } = useWebSocket({
    onTick: handleTick,
    onOrderBook: handleOrderBook,
    onScannerSnapshot: handleScannerSnapshot,
    onScannerTrigger: handleScannerTrigger,
    onScannerRemove: handleScannerRemove,
    onAlert: handleAlert,
  });

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      setNetworkError(null);
      const [status, pInfo, cfg, surfaced, stocks, watched, alertList] = await Promise.all([
        fetchMarketStatus().catch(() => null),
        fetchProviderInfo().catch(() => null),
        fetchScannerConfig().catch(() => DEFAULT_SCANNER_CONFIG),
        fetchScannerResults().catch(() => []),
        fetchAllStocks().catch(() => []),
        fetchWatchlist().catch(() => []),
        fetchAlerts().catch(() => []),
      ]);

      if (status) setMarketStatus(status);
      if (pInfo) setProviderInfo(pInfo);
      if (stocks.length > 0) {
        setAllStocks(stocks);
        setSurfacedResults(surfaced);
        const qMap = new Map<string, StockQuote>();
        stocks.forEach((s) => qMap.set(s.symbol, s));
        setQuotesMap(qMap);
      } else {
        // Fallback simulation mode for static deployments (GitHub Pages)
        const simQuotes: StockQuote[] = MONITORED_NSE_STOCKS.map((inst, index) => {
          const buyPct = 48 + ((index * 9 + 7) % 36);
          const sellPct = 100 - buyPct;
          const priceOffset = Math.sin(index + 1) * 0.015;
          const ltp = Number((inst.basePrice * (1 + priceOffset)).toFixed(2));
          const changePercent = Number((priceOffset * 100).toFixed(2));
          const change = Number((ltp - inst.basePrice).toFixed(2));
          const totalQty = 60000 + index * 4500;
          const totalBuy = Math.round(totalQty * (buyPct / 100));
          const totalSell = totalQty - totalBuy;

          const baseQuote: StockQuote = {
            symbol: inst.symbol,
            companyName: inst.companyName,
            exchange: 'NSE',
            ltp,
            open: Number((inst.basePrice * 0.995).toFixed(2)),
            high: Number((ltp * 1.012).toFixed(2)),
            low: Number((ltp * 0.988).toFixed(2)),
            close: ltp,
            previousClose: inst.basePrice,
            change,
            changePercent,
            volume: totalQty,
            totalBuyQuantity: totalBuy,
            totalSellQuantity: totalSell,
            buyPercentage: buyPct,
            sellPercentage: sellPct,
            timestamp: new Date().toISOString(),
            source: 'GitHub Pages Demo Simulation',
            isStale: false,
          };
          baseQuote.swingPlan = calculateSwingTradePlan(baseQuote);
          return baseQuote;
        });

        const simSurfaced: ScannerResult[] = simQuotes
          .filter((q) => q.buyPercentage >= cfg.buyThreshold)
          .map((q) => ({
            symbol: q.symbol,
            companyName: q.companyName,
            ltp: q.ltp,
            changePercent: q.changePercent,
            volume: q.volume,
            totalBuyQuantity: q.totalBuyQuantity,
            totalSellQuantity: q.totalSellQuantity,
            buyPercentage: q.buyPercentage,
            sellPercentage: q.sellPercentage,
            ruleId: 'rule-institutional-sniper',
            ruleName: 'Institutional Sniper (Grade A+)',
            reason: `Buy quantity reached ${q.buyPercentage.toFixed(1)}%, exceeding your ${cfg.buyThreshold.toFixed(1)}% threshold.`,
            surfacedAt: new Date().toISOString(),
            swingPlan: q.swingPlan,
          }));

        setAllStocks(simQuotes);
        setSurfacedResults(simSurfaced);
        const qMap = new Map<string, StockQuote>();
        simQuotes.forEach((s) => qMap.set(s.symbol, s));
        setQuotesMap(qMap);

        if (!status) {
          setMarketStatus({
            status: 'OPEN',
            statusLabel: 'Market Open (Simulation)',
            isLiveTradingHours: true,
            serverTimeIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
            tradingHours: '09:15 - 15:30 IST',
            mode: 'mock',
            providerName: 'MarketEye Live Browser Simulation',
            monitoredStocksCount: MONITORED_NSE_STOCKS.length,
          });
        }
        if (!pInfo) {
          setProviderInfo({
            id: 'mock-sim',
            name: 'Simulation Provider',
            isMock: true,
            connected: true,
            statusMessage: 'Client-side simulation running (GitHub Pages)',
            supportedProviders: [],
          });
        }
      }

      setWatchlist(watched);
      setAlerts(alertList);
    } catch (err: unknown) {
      console.error('[MarketEye] Data load error:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic Market Status Polling (every 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMarketStatus().then(setMarketStatus).catch(() => {});
      fetchProviderInfo().then(setProviderInfo).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const updateConfig = async (newConfig: Partial<ScannerRuleConfig>) => {
    try {
      setIsConfigUpdating(true);
      const updated = await updateScannerConfig(newConfig);
      setScannerConfig(updated);
      const refreshed = await fetchScannerResults();
      setSurfacedResults(refreshed);
    } catch (err) {
      console.error('[MarketEye] Config update failed:', err);
    } finally {
      setIsConfigUpdating(false);
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    try {
      if (watchlistSymbols.has(symbol)) {
        await removeFromWatchlist(symbol);
        setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
      } else {
        const added = await addToWatchlist(symbol);
        setWatchlist((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error('[MarketEye] Watchlist toggle failed:', err);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  const clearAlerts = async () => {
    try {
      await clearAllAlerts();
      setAlerts([]);
    } catch (err) {
      console.error('[MarketEye] Clear alerts failed:', err);
    }
  };

  return {
    marketStatus,
    providerInfo,
    scannerConfig,
    surfacedResults,
    allStocks,
    quotesMap,
    watchlist,
    watchlistSymbols,
    surfacedSymbols,
    alerts,
    unreadAlertsCount,
    latestTrigger,
    networkError,
    isConfigUpdating,
    soundEnabled,
    liveOrderBook,
    isConnected,
    isConnecting,
    loadInitialData,
    updateConfig,
    toggleWatchlist,
    toggleSound,
    clearAlerts,
    subscribeOrderBook,
    unsubscribeOrderBook,
    reconnect,
  };
}
