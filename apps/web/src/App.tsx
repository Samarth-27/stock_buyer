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
} from './services/api.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { soundManager } from './services/audio.js';
import { Header } from './components/Header.js';
import { ScannerControls } from './components/ScannerControls.js';
import { SurfacedStocksTable } from './components/SurfacedStocksTable.js';
import { AllStocksTable } from './components/AllStocksTable.js';
import { MarketBreadth } from './components/MarketBreadth.js';
import { StockDetailModal } from './components/StockDetailModal.js';
import { WatchlistPanel } from './components/WatchlistPanel.js';
import { AlertsDrawer } from './components/AlertsDrawer.js';
import { ToastNotifications } from './components/ToastNotifications.js';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  // State
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo | null>(null);
  const [scannerConfig, setScannerConfig] = useState<ScannerRuleConfig>({ ...DEFAULT_SCANNER_CONFIG });
  const [surfacedResults, setSurfacedResults] = useState<ScannerResult[]>([]);
  const [allStocks, setAllStocks] = useState<StockQuote[]>([]);
  const [quotesMap, setQuotesMap] = useState<Map<string, StockQuote>>(new Map());
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [latestTrigger, setLatestTrigger] = useState<ScannerResult | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'scanner' | 'all-stocks'>('scanner');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [liveOrderBook, setLiveOrderBook] = useState<OrderBook | undefined>(undefined);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Derived
  const watchlistSymbols = useMemo(() => new Set(watchlist.map((w) => w.symbol)), [watchlist]);
  const surfacedSymbols = useMemo(() => new Set(surfacedResults.map((r) => r.symbol)), [surfacedResults]);
  const unreadAlertsCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);
  const selectedQuote = selectedSymbol ? quotesMap.get(selectedSymbol) : undefined;

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

    setAlerts((prev) => [
      {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        symbol: result.symbol,
        type: 'SCANNER_TRIGGER',
        title: `New Stock Under Eyes: ${result.symbol}`,
        message: result.reason,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const handleScannerRemove = useCallback((symbol: string) => {
    setSurfacedResults((prev) => prev.filter((r) => r.symbol !== symbol));
  }, []);

  const handleAlert = useCallback((alert: MarketAlert) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  // Initialize WebSocket connection
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
      const [status, cfg, surfaced, stocks, watched, alertList] = await Promise.all([
        fetchMarketStatus().catch(() => null),
        fetchScannerConfig().catch(() => DEFAULT_SCANNER_CONFIG),
        fetchScannerResults().catch(() => []),
        fetchAllStocks().catch(() => []),
        fetchWatchlist().catch(() => []),
        fetchAlerts().catch(() => []),
      ]);

      if (status) setMarketStatus(status);
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
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleUpdateConfig = async (newConfig: Partial<ScannerRuleConfig>) => {
    try {
      setIsConfigUpdating(true);
      const updated = await updateScannerConfig(newConfig);
      setScannerConfig(updated);
      const refreshed = await fetchScannerResults();
      setSurfacedResults(refreshed);
    } catch (err) {
      console.error('Config update failed:', err);
    } finally {
      setIsConfigUpdating(false);
    }
  };

  const handleToggleWatchlist = async (symbol: string) => {
    try {
      if (watchlistSymbols.has(symbol)) {
        await removeFromWatchlist(symbol);
        setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
      } else {
        const added = await addToWatchlist(symbol);
        setWatchlist((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error('Watchlist toggle failed:', err);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  const handleClearAlerts = async () => {
    await clearAllAlerts();
    setAlerts([]);
  };

  const topSurfacedStock = surfacedResults[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-market-buy selection:text-slate-950">
      {/* Network Alert if Disconnected */}
      {networkError && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2.5 text-center text-xs text-rose-200 flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{networkError}</span>
          <button
            onClick={loadInitialData}
            className="ml-2 underline font-bold hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3 inline mr-1" /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        marketStatus={marketStatus}
        isConnected={isConnected}
        isConnecting={isConnecting}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Market Breadth Summary */}
        <MarketBreadth
          quotes={allStocks}
          surfacedCount={surfacedResults.length}
          topStock={topSurfacedStock}
        />

        {/* Scanner Threshold Controls */}
        <ScannerControls
          config={scannerConfig}
          onUpdateConfig={handleUpdateConfig}
          isUpdating={isConfigUpdating}
        />

        {/* Tab View: Surfaced Stocks vs All Stocks */}
        {activeTab === 'scanner' ? (
          <SurfacedStocksTable
            results={surfacedResults}
            quotes={quotesMap}
            watchlistSymbols={watchlistSymbols}
            onSelectStock={setSelectedSymbol}
            onToggleWatchlist={handleToggleWatchlist}
            buyThreshold={scannerConfig.buyThreshold}
          />
        ) : (
          <AllStocksTable
            stocks={allStocks}
            watchlistSymbols={watchlistSymbols}
            surfacedSymbols={surfacedSymbols}
            onSelectStock={setSelectedSymbol}
            onToggleWatchlist={handleToggleWatchlist}
            buyThreshold={scannerConfig.buyThreshold}
          />
        )}
      </main>

      {/* Stock Detail Modal */}
      {selectedSymbol && (
        <StockDetailModal
          symbol={selectedSymbol}
          quote={selectedQuote}
          isWatched={watchlistSymbols.has(selectedSymbol)}
          onToggleWatchlist={handleToggleWatchlist}
          onClose={() => {
            setSelectedSymbol(null);
            setLiveOrderBook(undefined);
          }}
          onSubscribeOrderBook={subscribeOrderBook}
          onUnsubscribeOrderBook={unsubscribeOrderBook}
          liveOrderBook={liveOrderBook}
        />
      )}

      {/* Watchlist Slide-Over */}
      <WatchlistPanel
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        quotes={quotesMap}
        allStocks={allStocks}
        onSelectStock={setSelectedSymbol}
        onRemove={handleToggleWatchlist}
        onAdd={handleToggleWatchlist}
      />

      {/* Alerts Center Slide-Over */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onClearAlerts={handleClearAlerts}
        onSelectStock={setSelectedSymbol}
      />

      {/* Real-time Alert Toasts */}
      <ToastNotifications
        latestTrigger={latestTrigger}
        onSelectStock={setSelectedSymbol}
      />

      {/* Regulatory Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-slate-400">
            MarketEye is an informational market-scanning platform for Indian equity markets.
          </p>
          <p className="text-[11px] max-w-2xl mx-auto text-slate-500 leading-relaxed">
            MarketEye displays pending order-book quantities (Total Buy Quantity and Total Sell Quantity).
            It does NOT claim that surfaced stocks will rise or fall, does NOT execute trades, and does NOT
            provide investment advice. Data feed is currently operating in{' '}
            <strong className="text-amber-400">DEMO / MOCK DATA MODE</strong>.
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            © {new Date().getFullYear()} MarketEye. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
