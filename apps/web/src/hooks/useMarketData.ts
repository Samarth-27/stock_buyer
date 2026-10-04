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
  const { isConnected, isConnecting, subscribeOrderBook, unsubscribeOrderBook } = useWebSocket({
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
      setScannerConfig(cfg);
      setSurfacedResults(surfaced);
      setAllStocks(stocks);

      const qMap = new Map<string, StockQuote>();
      stocks.forEach((s) => qMap.set(s.symbol, s));
      setQuotesMap(qMap);

      setWatchlist(watched);
      setAlerts(alertList);
    } catch (err: unknown) {
      console.error('[MarketEye] Data load error:', err);
      setNetworkError('Failed to connect to MarketEye backend API. Is the server running?');
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
  };
}
