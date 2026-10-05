import { useState } from 'react';
import { useMarketData } from './hooks/useMarketData.js';
import { Header } from './components/Header.js';
import { ScannerControls } from './components/ScannerControls.js';
import { SurfacedStocksTable } from './components/SurfacedStocksTable.js';
import { AllStocksTable } from './components/AllStocksTable.js';
import { MarketBreadth } from './components/MarketBreadth.js';
import { StockDetailModal } from './components/StockDetailModal.js';
import { WatchlistPanel } from './components/WatchlistPanel.js';
import { AlertsDrawer } from './components/AlertsDrawer.js';
import { ToastNotifications } from './components/ToastNotifications.js';
import { ProviderSettingsModal } from './components/ProviderSettingsModal.js';
import { QuickStartGuide } from './components/QuickStartGuide.js';
import { TwoDaySwingBanner } from './components/TwoDaySwingBanner.js';
import { PortfolioView } from './components/PortfolioView.js';
import { AddHoldingModal } from './components/AddHoldingModal.js';
import { PortfolioHolding } from '@marketeye/shared';
import { AlertTriangle, RefreshCw, RadioTower, KeyRound } from 'lucide-react';

export function App() {
  const {
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
    triggerTurboRescan,
    isTurboScanning,
    lastScanLatencyMs,
  } = useMarketData();

  // Navigation & Dialog State
  const [activeTab, setActiveTab] = useState<'scanner' | 'all-stocks' | 'portfolio'>('scanner');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  // Manual Portfolio Add/Edit Modal State
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [holdingModalInitial, setHoldingModalInitial] = useState<{
    symbol?: string;
    price?: number;
    quantity?: number;
    notes?: string;
  } | undefined>(undefined);
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);

  const handleOpenAddHolding = (initialData?: {
    symbol?: string;
    price?: number;
    quantity?: number;
    notes?: string;
  }) => {
    setEditingHolding(null);
    setHoldingModalInitial(initialData);
    setIsAddHoldingOpen(true);
  };

  const handleEditHolding = (holding: PortfolioHolding) => {
    setEditingHolding(holding);
    setHoldingModalInitial({
      symbol: holding.symbol,
      price: holding.buyPrice,
      quantity: holding.quantity,
      notes: holding.notes,
    });
    setIsAddHoldingOpen(true);
  };

  const handleSaveHolding = async (
    holdingData: Omit<PortfolioHolding, 'id'> & { id?: string }
  ) => {
    if (holdingData.id) {
      await updatePortfolioHolding(holdingData.id, holdingData);
    } else {
      await addPortfolioHolding(holdingData);
    }
  };

  const selectedQuote = selectedSymbol ? quotesMap.get(selectedSymbol) : undefined;
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

      {/* Real Provider Status Banner if active and waiting for credentials */}
      {providerInfo && !providerInfo.isMock && !providerInfo.connected && (
        <div className="bg-amber-950/90 border-b border-amber-700/80 px-4 py-2.5 text-center text-xs text-amber-200 flex items-center justify-center space-x-2 flex-wrap gap-2">
          <RadioTower className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span>
            <strong>{providerInfo.name} Active:</strong> {providerInfo.statusMessage}
          </span>
          <button
            onClick={() => setIsProviderModalOpen(true)}
            className="ml-2 px-3 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>Enter Credentials</span>
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        marketStatus={marketStatus}
        isConnected={isConnected}
        isConnecting={isConnecting}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenProviderSettings={() => setIsProviderModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portfolioCount={portfolioSummary.holdingsCount}
        portfolioPnL={portfolioSummary.totalPnL}
        isMockProvider={providerInfo ? providerInfo.isMock : true}
        providerName={providerInfo ? providerInfo.name : 'Mock Feed'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'portfolio' ? (
          <PortfolioView
            holdings={portfolioHoldings}
            summary={portfolioSummary}
            allStocks={allStocks}
            quotesMap={quotesMap}
            onOpenAddModal={handleOpenAddHolding}
            onEditHolding={handleEditHolding}
            onDeleteHolding={deletePortfolioHolding}
            onSelectStock={setSelectedSymbol}
          />
        ) : (
          <>
            {/* Market Breadth Summary */}
            <MarketBreadth
              quotes={allStocks}
              surfacedCount={surfacedResults.length}
              topStock={topSurfacedStock}
            />

            {/* User-Friendly Quick-Start Guide */}
            <QuickStartGuide />

            {/* Authoritative 2-Day+ Swing Trading Decision Engine (Jev-Calibrated) */}
            <TwoDaySwingBanner
              quotes={allStocks}
              onSelectStock={setSelectedSymbol}
              onAddToPortfolio={handleOpenAddHolding}
            />

            {/* Scanner Threshold Controls */}
            <ScannerControls
              config={scannerConfig}
              onUpdateConfig={updateConfig}
              isUpdating={isConfigUpdating}
              onTurboRescan={triggerTurboRescan}
              isTurboScanning={isTurboScanning}
              lastScanLatencyMs={lastScanLatencyMs}
            />

            {/* Tab View: Surfaced Stocks vs All Stocks */}
            {activeTab === 'scanner' ? (
              <SurfacedStocksTable
                results={surfacedResults}
                quotes={quotesMap}
                watchlistSymbols={watchlistSymbols}
                onSelectStock={setSelectedSymbol}
                onToggleWatchlist={toggleWatchlist}
                buyThreshold={scannerConfig.buyThreshold}
                onAddToPortfolio={handleOpenAddHolding}
              />
            ) : (
              <AllStocksTable
                stocks={allStocks}
                watchlistSymbols={watchlistSymbols}
                surfacedSymbols={surfacedSymbols}
                onSelectStock={setSelectedSymbol}
                onToggleWatchlist={toggleWatchlist}
                buyThreshold={scannerConfig.buyThreshold}
                onAddToPortfolio={handleOpenAddHolding}
              />
            )}
          </>
        )}
      </main>

      {/* Manual Portfolio Add/Edit Modal */}
      <AddHoldingModal
        isOpen={isAddHoldingOpen}
        onClose={() => setIsAddHoldingOpen(false)}
        onSave={handleSaveHolding}
        quotesMap={quotesMap}
        initialSymbol={holdingModalInitial?.symbol}
        initialPrice={holdingModalInitial?.price}
        initialQuantity={holdingModalInitial?.quantity}
        editingHolding={editingHolding}
      />

      {/* Stock Detail Modal */}
      {selectedSymbol && (
        <StockDetailModal
          symbol={selectedSymbol}
          quote={selectedQuote}
          isWatched={watchlistSymbols.has(selectedSymbol)}
          onToggleWatchlist={toggleWatchlist}
          onClose={() => setSelectedSymbol(null)}
          onSubscribeOrderBook={subscribeOrderBook}
          onUnsubscribeOrderBook={unsubscribeOrderBook}
          liveOrderBook={liveOrderBook}
          onAddToPortfolio={handleOpenAddHolding}
        />
      )}

      {/* Provider & Credentials Settings Modal */}
      <ProviderSettingsModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        providerInfo={providerInfo}
        onProviderChanged={loadInitialData}
      />

      {/* Watchlist Slide-Over */}
      <WatchlistPanel
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        quotes={quotesMap}
        allStocks={allStocks}
        onSelectStock={setSelectedSymbol}
        onRemove={toggleWatchlist}
        onAdd={toggleWatchlist}
      />

      {/* Alerts Center Slide-Over */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onClearAlerts={clearAlerts}
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
            provide investment advice. Data feed mode:{' '}
            <strong className={providerInfo?.isMock ? 'text-amber-400' : 'text-emerald-400'}>
              {providerInfo?.name || 'MOCK SIMULATION'}
            </strong>
            .
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            © {new Date().getFullYear()} MarketEye. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
