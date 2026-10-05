import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StockQuote,
  OrderBook,
  ScannerResult,
  ScannerRuleConfig,
  WatchlistItem,
  MarketAlert,
  MarketStatusInfo,
  PortfolioHolding,
  PortfolioSummary,
  DEFAULT_SCANNER_CONFIG,
  MONITORED_NSE_STOCKS,
  calculateSwingTradePlan,
  evaluatePortfolioHolding,
  calculatePortfolioSummary,
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
  rescanScanner,
  fetchPortfolioData,
  addPortfolioHoldingRemote,
  deletePortfolioHoldingRemote,
  loadPortfolioHoldingsLocally,
  fetchStockQuote,
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
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  liveOrderBook: OrderBook | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  portfolioHoldings: PortfolioHolding[];
  portfolioSummary: PortfolioSummary;
  addPortfolioHolding: (holding: Omit<PortfolioHolding, 'id'> & { id?: string }) => Promise<void>;
  updatePortfolioHolding: (id: string, updates: Partial<PortfolioHolding>) => Promise<void>;
  deletePortfolioHolding: (id: string) => Promise<void>;
  loadInitialData: () => Promise<void>;
  updateConfig: (newConfig: Partial<ScannerRuleConfig>) => Promise<void>;
  toggleWatchlist: (symbol: string) => Promise<void>;
  toggleSound: () => void;
  clearAlerts: () => Promise<void>;
  subscribeOrderBook: (symbol: string) => void;
  unsubscribeOrderBook: (symbol: string) => void;
  reconnect: () => void;
  triggerTurboRescan: () => Promise<void>;
  isTurboScanning: boolean;
  lastScanLatencyMs: number | null;
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
  const [rawPortfolioHoldings, setRawPortfolioHoldings] = useState<PortfolioHolding[]>(() =>
    loadPortfolioHoldingsLocally()
  );

  const [liveOrderBook, setLiveOrderBook] = useState<OrderBook | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('marketeye_notifications_enabled');
      return stored !== null ? stored === 'true' : false; // Default disabled as requested
    } catch {
      return false;
    }
  });
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isTurboScanning, setIsTurboScanning] = useState(false);
  const [lastScanLatencyMs, setLastScanLatencyMs] = useState<number | null>(null);

  // Derived Lookup Sets & Metrics
  const watchlistSymbols = useMemo(() => new Set(watchlist.map((w) => w.symbol)), [watchlist]);
  const surfacedSymbols = useMemo(() => new Set(surfacedResults.map((r) => r.symbol)), [surfacedResults]);
  const unreadAlertsCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  // Dynamically evaluate portfolio holdings against real-time quotes & models
  const portfolioHoldings = useMemo(() => {
    return rawPortfolioHoldings.map((h) => {
      const quote = quotesMap.get(h.symbol.toUpperCase());
      return evaluatePortfolioHolding(h, quote);
    });
  }, [rawPortfolioHoldings, quotesMap]);

  // Dynamically calculate aggregate portfolio performance
  const portfolioSummary = useMemo(() => {
    return calculatePortfolioSummary(portfolioHoldings);
  }, [portfolioHoldings]);

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
          baseQuote.swingSetup = baseQuote.swingPlan.setupType;
          baseQuote.twoDayDecision = baseQuote.swingPlan.twoDayDecision;
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
            swingSetup: q.swingSetup,
            twoDayDecision: q.twoDayDecision ?? q.swingPlan?.twoDayDecision,
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

      const portfolioData = await fetchPortfolioData().catch(() => ({
        holdings: loadPortfolioHoldingsLocally(),
      }));
      if (portfolioData.holdings && portfolioData.holdings.length > 0) {
        setRawPortfolioHoldings(portfolioData.holdings);
        // Hydrate quote cache for any portfolio holding symbols
        portfolioData.holdings.forEach((h) => {
          const sym = h.symbol.toUpperCase();
          fetchStockQuote(sym)
            .then((q) => {
              if (q) {
                setQuotesMap((prev) => {
                  const next = new Map(prev);
                  next.set(q.symbol, q);
                  return next;
                });
              }
            })
            .catch(() => {});
        });
      }
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

  // High-Speed In-Browser Real-Time Simulation Ticker
  // When running on GitHub Pages or when offline, this active engine simulates live ticks,
  // order book volume jiggles, and recalculates setups every 1.5 seconds!
  useEffect(() => {
    if (isConnected) return;

    const simTimer = setInterval(() => {
      setAllStocks((prev) => {
        if (!prev || prev.length === 0) return prev;

        const count = Math.min(prev.length, Math.floor(Math.random() * 3) + 2);
        const indices = new Set<number>();
        while (indices.size < count) {
          indices.add(Math.floor(Math.random() * prev.length));
        }

        const next = [...prev];
        const newlySurfaced: ScannerResult[] = [];

        indices.forEach((idx) => {
          const old = next[idx];
          const priceJiggle = (Math.random() - 0.48) * (old.ltp * 0.003);
          const newLtp = Number(Math.max(1, old.ltp + priceJiggle).toFixed(2));
          const change = Number((newLtp - old.previousClose).toFixed(2));
          const changePercent = Number(((change / old.previousClose) * 100).toFixed(2));

          const buyJiggle = Math.round((Math.random() - 0.48) * 4);
          const newBuyPct = Math.max(25, Math.min(92, old.buyPercentage + buyJiggle));
          const newSellPct = 100 - newBuyPct;
          const volDelta = Math.floor(Math.random() * 1200) + 150;
          const newVol = old.volume + volDelta;

          const updatedQuote: StockQuote = {
            ...old,
            ltp: newLtp,
            high: Math.max(old.high, newLtp),
            low: Math.min(old.low, newLtp),
            close: newLtp,
            change,
            changePercent,
            volume: newVol,
            buyPercentage: newBuyPct,
            sellPercentage: newSellPct,
            totalBuyQuantity: Math.round(newVol * (newBuyPct / 100)),
            totalSellQuantity: Math.round(newVol * (newSellPct / 100)),
            timestamp: new Date().toISOString(),
          };

          updatedQuote.swingPlan = calculateSwingTradePlan(updatedQuote);
          updatedQuote.swingSetup = updatedQuote.swingPlan.setupType;
          updatedQuote.twoDayDecision = updatedQuote.swingPlan.twoDayDecision;
          next[idx] = updatedQuote;

          if (newBuyPct >= scannerConfig.buyThreshold) {
            newlySurfaced.push({
              symbol: updatedQuote.symbol,
              companyName: updatedQuote.companyName,
              ltp: updatedQuote.ltp,
              changePercent: updatedQuote.changePercent,
              volume: updatedQuote.volume,
              totalBuyQuantity: updatedQuote.totalBuyQuantity,
              totalSellQuantity: updatedQuote.totalSellQuantity,
              buyPercentage: updatedQuote.buyPercentage,
              sellPercentage: updatedQuote.sellPercentage,
              ruleId: scannerConfig.id || 'rule-institutional-sniper',
              ruleName: scannerConfig.name || 'Institutional Sniper (Grade A+)',
              reason: `Buy quantity reached ${newBuyPct.toFixed(1)}%, exceeding your ${scannerConfig.buyThreshold.toFixed(1)}% threshold.`,
              surfacedAt: new Date().toISOString(),
              swingPlan: updatedQuote.swingPlan,
              swingSetup: updatedQuote.swingSetup,
              twoDayDecision: updatedQuote.twoDayDecision,
            });
          }
        });

        setQuotesMap((prevMap) => {
          const m = new Map(prevMap);
          indices.forEach((idx) => m.set(next[idx].symbol, next[idx]));
          return m;
        });

        if (newlySurfaced.length > 0) {
          setSurfacedResults((prevResults) => {
            const map = new Map(prevResults.map((r) => [r.symbol, r]));
            newlySurfaced.forEach((r) => {
              if (!map.has(r.symbol)) {
                if (soundEnabled) {
                  soundManager.playAlertChime();
                }
                if (notificationsEnabled) {
                  setLatestTrigger(r);
                }
                setAlerts((prevAlerts) => [
                  {
                    id: `alert-sim-${Date.now()}-${r.symbol}`,
                    symbol: r.symbol,
                    type: 'SCANNER_TRIGGER',
                    title: `${r.symbol} Sniper Setup Triggered`,
                    message: `${r.symbol}: Buy Pressure at ${r.buyPercentage}%! Stage 2 Setup confirmed.`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    metadata: { ltp: r.ltp, changePercent: r.changePercent },
                  },
                  ...prevAlerts,
                ]);
              }
              map.set(r.symbol, r);
            });
            return Array.from(map.values());
          });
        }

        return next;
      });
    }, 1500);

    return () => clearInterval(simTimer);
  }, [isConnected, scannerConfig]);

  // Instant Turbo Rescan
  const triggerTurboRescan = useCallback(async () => {
    const t0 = performance.now();
    setIsTurboScanning(true);
    try {
      if (isConnected) {
        const refreshed = await rescanScanner();
        setSurfacedResults(refreshed);
      } else {
        setAllStocks((currentStocks) => {
          const surfaced: ScannerResult[] = [];
          const updatedStocks = currentStocks.map((q) => {
            const plan = calculateSwingTradePlan(q);
            const copy = {
              ...q,
              swingPlan: plan,
              swingSetup: plan.setupType,
              twoDayDecision: plan.twoDayDecision,
            };
            if (copy.buyPercentage >= scannerConfig.buyThreshold) {
              surfaced.push({
                symbol: copy.symbol,
                companyName: copy.companyName,
                ltp: copy.ltp,
                changePercent: copy.changePercent,
                volume: copy.volume,
                totalBuyQuantity: copy.totalBuyQuantity,
                totalSellQuantity: copy.totalSellQuantity,
                buyPercentage: copy.buyPercentage,
                sellPercentage: copy.sellPercentage,
                ruleId: scannerConfig.id,
                ruleName: scannerConfig.name,
                reason: `Buy quantity is ${copy.buyPercentage.toFixed(1)}% (Threshold: ${scannerConfig.buyThreshold.toFixed(1)}%).`,
                surfacedAt: new Date().toISOString(),
                swingPlan: copy.swingPlan,
                swingSetup: copy.swingSetup,
                twoDayDecision: copy.twoDayDecision,
              });
            }
            return copy;
          });
          setSurfacedResults(surfaced);
          return updatedStocks;
        });
      }
      soundManager.playAlertChime();
    } catch (err) {
      console.warn('[MarketEye] Turbo rescan error:', err);
    } finally {
      const elapsed = Math.round(performance.now() - t0);
      setLastScanLatencyMs(Math.max(1, elapsed));
      setIsTurboScanning(false);
    }
  }, [isConnected, scannerConfig]);

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

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('marketeye_notifications_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const clearAlerts = async () => {
    try {
      await clearAllAlerts();
      setAlerts([]);
    } catch (err) {
      console.error('[MarketEye] Clear alerts failed:', err);
    }
  };

  const addPortfolioHolding = useCallback(
    async (holding: Omit<PortfolioHolding, 'id'> & { id?: string }) => {
      const saved = await addPortfolioHoldingRemote(holding);
      setRawPortfolioHoldings((prev) => {
        const idx = prev.findIndex((h) => h.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });

      // Hydrate live quote for this symbol into quotesMap if not already cached
      const sym = saved.symbol.toUpperCase();
      if (!quotesMap.has(sym)) {
        fetchStockQuote(sym)
          .then((quote) => {
            if (quote) {
              setQuotesMap((prev) => {
                const next = new Map(prev);
                next.set(quote.symbol, quote);
                return next;
              });
            }
          })
          .catch(() => {});
      }
    },
    [quotesMap]
  );

  const updatePortfolioHolding = useCallback(
    async (id: string, updates: Partial<PortfolioHolding>) => {
      setRawPortfolioHoldings((prev) => {
        const idx = prev.findIndex((h) => h.id === id);
        if (idx < 0) return prev;
        const updated = { ...prev[idx], ...updates };
        addPortfolioHoldingRemote(updated);
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      });
    },
    []
  );

  const deletePortfolioHolding = useCallback(async (id: string) => {
    await deletePortfolioHoldingRemote(id);
    setRawPortfolioHoldings((prev) => prev.filter((h) => h.id !== id));
  }, []);

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
    latestTrigger: notificationsEnabled ? latestTrigger : null,
    networkError,
    isConfigUpdating,
    soundEnabled,
    notificationsEnabled,
    toggleNotifications,
    liveOrderBook,
    isConnected,
    isConnecting,
    portfolioHoldings,
    portfolioSummary,
    addPortfolioHolding,
    updatePortfolioHolding,
    deletePortfolioHolding,
    loadInitialData,
    updateConfig,
    toggleWatchlist,
    toggleSound,
    clearAlerts,
    subscribeOrderBook,
    unsubscribeOrderBook,
    reconnect,
    triggerTurboRescan,
    isTurboScanning,
    lastScanLatencyMs,
  };
}
