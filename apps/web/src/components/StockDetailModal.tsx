import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
  calculateAIPrediction,
  calculateSwingTradePlan,
} from '@marketeye/shared';
import { fetchStockOrderBook, fetchStockHistory } from '../services/api.js';
import { TrendingUp, BarChart2, Layers, Newspaper } from 'lucide-react';
import {
  StockDetailHeader,
  OhlcMetricsBar,
  QuantBlueprintCard,
  MarketDepthCard,
  PriceActionChart,
  InvestorDecisionMatrix,
  StockNewsCard,
  SwingBlueprintCard,
} from './stock-detail/index.js';

interface StockDetailModalProps {
  symbol: string;
  quote?: StockQuote;
  isWatched: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onClose: () => void;
  onSubscribeOrderBook: (symbol: string) => void;
  onUnsubscribeOrderBook: (symbol: string) => void;
  liveOrderBook?: OrderBook;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  symbol,
  quote,
  isWatched,
  onToggleWatchlist,
  onClose,
  onSubscribeOrderBook,
  onUnsubscribeOrderBook,
  liveOrderBook,
}) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(liveOrderBook || null);
  const [history, setHistory] = useState<HistoricalCandle[]>([]);
  const [interval, setInterval] = useState<ChartInterval>('1D');
  const [range] = useState<ChartRange>('1mo');
  const [loading, setLoading] = useState<boolean>(true);
  const [modalTab, setModalTab] = useState<'blueprint' | 'chart' | 'orderbook' | 'news'>('blueprint');
  const modalRef = useRef<HTMLDivElement>(null);

  // Subscribe to live order book updates over WebSocket
  useEffect(() => {
    onSubscribeOrderBook(symbol);
    return () => {
      onUnsubscribeOrderBook(symbol);
    };
  }, [symbol, onSubscribeOrderBook, onUnsubscribeOrderBook]);

  // Update order book when live update arrives
  useEffect(() => {
    if (liveOrderBook && liveOrderBook.symbol === symbol) {
      setOrderBook(liveOrderBook);
    }
  }, [liveOrderBook, symbol]);

  // Fetch initial order book and history
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    Promise.all([
      fetchStockOrderBook(symbol).catch(() => null),
      fetchStockHistory(symbol, interval, range).catch(() => []),
    ]).then(([ob, hist]) => {
      if (!isCancelled) {
        const curLtp = quote?.ltp ?? 1000;
        if (ob) {
          setOrderBook(ob);
        } else if (quote) {
          const bids = [1, 2, 3, 4, 5].map((lvl) => ({
            price: Number((curLtp * (1 - lvl * 0.001)).toFixed(2)),
            quantity: Math.round(quote.totalBuyQuantity * (0.35 - lvl * 0.05)),
            orders: 12 - lvl * 2,
          }));
          const asks = [1, 2, 3, 4, 5].map((lvl) => ({
            price: Number((curLtp * (1 + lvl * 0.001)).toFixed(2)),
            quantity: Math.round(quote.totalSellQuantity * (0.35 - lvl * 0.05)),
            orders: 11 - lvl * 2,
          }));
          setOrderBook({
            symbol,
            exchange: 'NSE',
            timestamp: new Date().toISOString(),
            bids,
            asks,
            totalBuyQuantity: quote.totalBuyQuantity,
            totalSellQuantity: quote.totalSellQuantity,
            buyPercentage: quote.buyPercentage,
            sellPercentage: quote.sellPercentage,
            imbalanceRatio: (quote.buyPercentage - quote.sellPercentage) / 100,
            source: 'MOCK_FEED',
            isStale: false,
          });
        }

        if (hist && hist.length > 0) {
          setHistory(hist);
        } else {
          // Fallback realistic candles for GitHub Pages preview
          const synthetic: HistoricalCandle[] = [];
          const now = Date.now();
          for (let i = 24; i >= 0; i--) {
            const t = now - i * 15 * 60 * 1000;
            const wave = Math.sin((24 - i) * 0.45) * (curLtp * 0.012);
            const c = Number((curLtp - wave).toFixed(2));
            const o = Number((c - Math.sin(i) * curLtp * 0.004).toFixed(2));
            const h = Number((Math.max(o, c) + curLtp * 0.003).toFixed(2));
            const l = Number((Math.min(o, c) - curLtp * 0.003).toFixed(2));
            synthetic.push({
              timestamp: new Date(t).toISOString(),
              open: o,
              high: h,
              low: l,
              close: c,
              volume: 3500 + Math.round(Math.abs(Math.cos(i)) * 8000),
            });
          }
          setHistory(synthetic);
        }

        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [symbol, interval, range]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Derived metrics
  const ltp = quote?.ltp ?? orderBook?.bids[0]?.price ?? 0;
  const change = quote?.change ?? 0;
  const changePercent = quote?.changePercent ?? 0;

  const totalBuyQty = orderBook?.totalBuyQuantity ?? quote?.totalBuyQuantity ?? 0;
  const totalSellQty = orderBook?.totalSellQuantity ?? quote?.totalSellQuantity ?? 0;
  const buyPct = orderBook?.buyPercentage ?? quote?.buyPercentage ?? 0;
  const sellPct = orderBook?.sellPercentage ?? quote?.sellPercentage ?? 0;
  const imbalance = orderBook?.imbalanceRatio ?? 0;

  // Multi-day Swing Trade Blueprint synthesized with order book & multi-day candles
  const swingPlan = useMemo(() => {
    if (quote?.swingPlan) return quote.swingPlan;
    return calculateSwingTradePlan(
      quote || { symbol, ltp, changePercent },
      orderBook,
      history.length > 0 ? history : undefined
    );
  }, [quote, symbol, ltp, changePercent, orderBook, history]);

  // AI Prediction synthesized with depth + history
  const prediction = useMemo(() => {
    if (orderBook) {
      return calculateAIPrediction(
        orderBook,
        quote ? { ltp, changePercent, volume: quote.volume } : { ltp },
        history.length > 0 ? history : undefined
      );
    }
    return quote?.prediction;
  }, [orderBook, quote, ltp, changePercent, history]);

  // Depth scaling
  const maxDepthQty = useMemo(() => {
    const maxBidQty = Math.max(...(orderBook?.bids.map((b) => b.quantity) || [1]));
    const maxAskQty = Math.max(...(orderBook?.asks.map((a) => a.quantity) || [1]));
    return Math.max(maxBidQty, maxAskQty, 1);
  }, [orderBook]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto glass-panel-elevated rounded-3xl border border-slate-700/80 bg-slate-950/95 shadow-2xl p-5 sm:p-8 z-10"
      >
        {/* Header Bar */}
        <StockDetailHeader
          symbol={symbol}
          companyName={quote?.companyName}
          isWatched={isWatched}
          onToggleWatchlist={onToggleWatchlist}
          onClose={onClose}
        />

        {/* Live LTP & OHLC Grid */}
        <OhlcMetricsBar
          ltp={ltp}
          change={change}
          changePercent={changePercent}
          quote={quote}
        />

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-b border-slate-800 my-4 overflow-x-auto pb-1">
          <button
            onClick={() => setModalTab('blueprint')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'blueprint'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>🎯 Swing Blueprint & Plan</span>
          </button>

          <button
            onClick={() => setModalTab('chart')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'chart'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>📈 Price Chart & Indicators</span>
          </button>

          <button
            onClick={() => setModalTab('orderbook')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'orderbook'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>⚖️ Order Book & Depth</span>
          </button>

          <button
            onClick={() => setModalTab('news')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'news'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-amber-400" />
            <span>📰 News & Sentiment</span>
          </button>
        </div>

        {/* Tab 1: Swing Trade Blueprint & Execution Plan */}
        {modalTab === 'blueprint' && (
          <div className="my-3 space-y-4 animate-fadeIn">
            <SwingBlueprintCard swingPlan={swingPlan} ltp={ltp} />
            {prediction && (
              <InvestorDecisionMatrix
                prediction={prediction}
                ltp={ltp}
                buyPct={buyPct}
                swingPlan={swingPlan}
                twoDayDecision={quote?.twoDayDecision ?? swingPlan?.twoDayDecision}
              />
            )}
          </div>
        )}

        {/* Tab 2: Interactive Candlestick Chart & Technical Drivers */}
        {modalTab === 'chart' && (
          <div className="my-3 space-y-5 animate-fadeIn">
            <PriceActionChart
              history={history}
              loading={loading}
              interval={interval}
              onIntervalChange={setInterval}
              prediction={prediction}
            />
            {prediction && (
              <QuantBlueprintCard
                prediction={prediction}
                totalBuyQty={totalBuyQty}
                totalSellQty={totalSellQty}
                buyPct={buyPct}
              />
            )}
          </div>
        )}

        {/* Tab 3: Live Order Book & Smart Money Liquidity */}
        {modalTab === 'orderbook' && (
          <div className="my-3 space-y-5 animate-fadeIn">
            <MarketDepthCard
              orderBook={orderBook}
              maxDepthQty={maxDepthQty}
              totalBuyQty={totalBuyQty}
              totalSellQty={totalSellQty}
              buyPct={buyPct}
              sellPct={sellPct}
              imbalance={imbalance}
            />
            {prediction && (
              <InvestorDecisionMatrix
                prediction={prediction}
                ltp={ltp}
                buyPct={buyPct}
                swingPlan={swingPlan}
                twoDayDecision={quote?.twoDayDecision ?? swingPlan?.twoDayDecision}
              />
            )}
          </div>
        )}

        {/* Tab 4: Live Financial News & Catalyst Sentiment */}
        {modalTab === 'news' && (
          <div className="my-3 animate-fadeIn">
            <StockNewsCard symbol={symbol} />
          </div>
        )}

        {/* Regulatory & Analytical Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Analytical Disclaimer:</strong> Total Buy Quantity and
          Total Sell Quantity represent cumulative unfilled pending limit orders currently registered on
          the exchange book. These figures indicate order-book liquidity imbalance and must not be
          construed as guaranteed trading recommendations or guarantees of future price direction.
        </div>
      </div>
    </div>
  );
};
