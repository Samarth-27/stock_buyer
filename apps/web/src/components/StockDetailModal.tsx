import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  StockQuote,
  OrderBook,
  HistoricalCandle,
  ChartInterval,
  ChartRange,
} from '@marketeye/shared';
import { fetchStockOrderBook, fetchStockHistory } from '../services/api.js';

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
  const [interval, setInterval] = useState<ChartInterval>('5m');
  const [range] = useState<ChartRange>('1d');
  const [chartType, setChartType] = useState<'area' | 'candle'>('candle');
  const [hoveredCandle, setHoveredCandle] = useState<HistoricalCandle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
        if (ob) setOrderBook(ob);
        setHistory(hist);
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

  const ltp = quote?.ltp ?? orderBook?.bids[0]?.price ?? 0;
  const change = quote?.change ?? 0;
  const changePercent = quote?.changePercent ?? 0;
  const isPositive = changePercent >= 0;

  const totalBuyQty = orderBook?.totalBuyQuantity ?? quote?.totalBuyQuantity ?? 0;
  const totalSellQty = orderBook?.totalSellQuantity ?? quote?.totalSellQuantity ?? 0;
  const buyPct = orderBook?.buyPercentage ?? quote?.buyPercentage ?? 0;
  const sellPct = orderBook?.sellPercentage ?? quote?.sellPercentage ?? 0;
  const imbalance = orderBook?.imbalanceRatio ?? 0;

  // Max quantity for depth bar scaling
  const maxBidQty = Math.max(...(orderBook?.bids.map((b) => b.quantity) || [1]));
  const maxAskQty = Math.max(...(orderBook?.asks.map((a) => a.quantity) || [1]));
  const maxDepthQty = Math.max(maxBidQty, maxAskQty, 1);

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
        <div className="flex items-start justify-between pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {symbol}
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                NSE EQUITIES
              </span>
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>DEMO / MOCK FEED</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-1">{quote?.companyName || symbol}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleWatchlist(symbol)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isWatched
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {isWatched ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span className="hidden sm:inline">{isWatched ? 'Watched' : 'Add to Watchlist'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live LTP & OHLC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
          {/* LTP & Price Move */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 md:col-span-1">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Last Traded Price
            </div>
            <div className="text-3xl font-black text-white font-mono mt-1">
              ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`flex items-center space-x-1 text-xs font-mono font-bold mt-2 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {change >= 0 ? `+₹${change.toFixed(2)}` : `-₹${Math.abs(change).toFixed(2)}`} (
                {changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`})
              </span>
            </div>
          </div>

          {/* OHLC Cards */}
          <div className="grid grid-cols-4 gap-2 md:col-span-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-center border-r border-slate-800/80 pr-2">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Open</span>
              <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
                ₹{quote?.open?.toFixed(2) ?? '-'}
              </div>
            </div>
            <div className="text-center border-r border-slate-800/80 pr-2">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">High</span>
              <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-1">
                ₹{quote?.high?.toFixed(2) ?? '-'}
              </div>
            </div>
            <div className="text-center border-r border-slate-800/80 pr-2">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Low</span>
              <div className="text-sm sm:text-base font-bold text-rose-400 font-mono mt-1">
                ₹{quote?.low?.toFixed(2) ?? '-'}
              </div>
            </div>
            <div className="text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Prev. Close</span>
              <div className="text-sm sm:text-base font-bold text-slate-300 font-mono mt-1">
                ₹{quote?.previousClose?.toFixed(2) ?? '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Order Book Depth & Market Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
          {/* 5-Level Market Depth (Order Book) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  5-Level Market Depth
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                L2 Aggregate Orders
              </span>
            </div>

            {/* Depth Columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Bid Side (Buyers) */}
              <div>
                <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase font-bold pb-2 border-b border-slate-800/80 font-mono">
                  <span>Orders</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right text-emerald-400">Bid (₹)</span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {orderBook?.bids.map((b, idx) => (
                    <div
                      key={`bid-${idx}`}
                      className="relative grid grid-cols-3 text-xs font-mono py-1 px-1.5 rounded overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 bg-emerald-500/10 -z-10 rounded transition-all"
                        style={{ width: `${(b.quantity / maxDepthQty) * 100}%` }}
                      />
                      <span className="text-slate-400">{b.orders}</span>
                      <span className="text-right font-medium text-slate-200">
                        {b.quantity.toLocaleString('en-IN')}
                      </span>
                      <span className="text-right font-bold text-emerald-400">
                        {b.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask Side (Sellers) */}
              <div>
                <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase font-bold pb-2 border-b border-slate-800/80 font-mono">
                  <span className="text-rose-400">Ask (₹)</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Orders</span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {orderBook?.asks.map((a, idx) => (
                    <div
                      key={`ask-${idx}`}
                      className="relative grid grid-cols-3 text-xs font-mono py-1 px-1.5 rounded overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 bg-rose-500/10 -z-10 rounded transition-all right-0 left-auto"
                        style={{ width: `${(a.quantity / maxDepthQty) * 100}%` }}
                      />
                      <span className="font-bold text-rose-400">{a.price.toFixed(2)}</span>
                      <span className="text-right font-medium text-slate-200">
                        {a.quantity.toLocaleString('en-IN')}
                      </span>
                      <span className="text-right text-slate-400">{a.orders}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Depth Totals & Ratio */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500">Total Buy Qty:</span>{' '}
                  <strong className="text-market-buy">{totalBuyQty.toLocaleString('en-IN')}</strong>{' '}
                  <span className="text-emerald-400">({buyPct.toFixed(1)}%)</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Sell Qty:</span>{' '}
                  <strong className="text-market-sell">{totalSellQty.toLocaleString('en-IN')}</strong>{' '}
                  <span className="text-rose-400">({sellPct.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-market-buy transition-all duration-300"
                  style={{ width: `${buyPct}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-market-sell to-rose-600 transition-all duration-300"
                  style={{ width: `${sellPct}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>
                  Order Book Imbalance:{' '}
                  <strong
                    className={
                      imbalance > 0 ? 'text-emerald-400' : imbalance < 0 ? 'text-rose-400' : 'text-slate-400'
                    }
                  >
                    {imbalance > 0 ? `+${(imbalance * 100).toFixed(1)}%` : `${(imbalance * 100).toFixed(1)}%`}
                  </strong>
                </span>
                <span className="text-slate-500 font-mono">
                  Feed Freshness: Live (0ms)
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Price Action Chart
                  </h3>
                </div>

                {/* Interval Selectors */}
                <div className="flex items-center space-x-1">
                  {(['1m', '5m', '15m', '1h', '1D'] as ChartInterval[]).map((int) => (
                    <button
                      key={int}
                      onClick={() => setInterval(int)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                        interval === int
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white bg-slate-950'
                      }`}
                    >
                      {int}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Canvas Rendering */}
              {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                  Loading candlestick data...
                </div>
              ) : history.length > 0 ? (
                <div className="relative h-64 w-full">
                  <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Compute bounds */}
                    {(() => {
                      const prices = history.flatMap((c) => [c.high, c.low]);
                      const minPrice = Math.min(...prices) * 0.998;
                      const maxPrice = Math.max(...prices) * 1.002;
                      const priceRange = maxPrice - minPrice || 1;
                      const candleWidth = 600 / history.length;

                      // Area path points
                      const areaPoints = history.map((c, i) => {
                        const x = i * candleWidth + candleWidth / 2;
                        const y = 220 - ((c.close - minPrice) / priceRange) * 200;
                        return `${x},${y}`;
                      });
                      const areaPath = `M 0,220 L ${areaPoints.join(' L ')} L 600,220 Z`;

                      return (
                        <>
                          {/* Grid Lines */}
                          <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeDasharray="4" />
                          <line x1="0" y1="110" x2="600" y2="110" stroke="#1e293b" strokeDasharray="4" />
                          <line x1="0" y1="170" x2="600" y2="170" stroke="#1e293b" strokeDasharray="4" />

                          {chartType === 'area' ? (
                            <>
                              <path d={areaPath} fill="url(#areaGradient)" />
                              <polyline
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                points={areaPoints.join(' ')}
                              />
                            </>
                          ) : (
                            /* Candlesticks */
                            history.map((c, i) => {
                              const x = i * candleWidth + candleWidth / 2;
                              const highY = 220 - ((c.high - minPrice) / priceRange) * 200;
                              const lowY = 220 - ((c.low - minPrice) / priceRange) * 200;
                              const openY = 220 - ((c.open - minPrice) / priceRange) * 200;
                              const closeY = 220 - ((c.close - minPrice) / priceRange) * 200;
                              const isGreen = c.close >= c.open;
                              const candleBodyTop = Math.min(openY, closeY);
                              const candleBodyHeight = Math.max(2, Math.abs(closeY - openY));
                              const color = isGreen ? '#10b981' : '#f43f5e';

                              return (
                                <g
                                  key={i}
                                  onMouseEnter={() => setHoveredCandle(c)}
                                  onMouseLeave={() => setHoveredCandle(null)}
                                  className="cursor-crosshair"
                                >
                                  {/* Wick */}
                                  <line
                                    x1={x}
                                    y1={highY}
                                    x2={x}
                                    y2={lowY}
                                    stroke={color}
                                    strokeWidth="1.2"
                                  />
                                  {/* Body */}
                                  <rect
                                    x={x - candleWidth * 0.35}
                                    y={candleBodyTop}
                                    width={candleWidth * 0.7}
                                    height={candleBodyHeight}
                                    fill={color}
                                    rx="1"
                                  />
                                </g>
                              );
                            })
                          )}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                  No historical data available
                </div>
              )}

              {/* Hover / Candle Stats Bar */}
              <div className="mt-2 h-6 flex items-center justify-between text-[11px] font-mono text-slate-400">
                {hoveredCandle ? (
                  <>
                    <span>O: ₹{hoveredCandle.open.toFixed(2)}</span>
                    <span>H: ₹{hoveredCandle.high.toFixed(2)}</span>
                    <span>L: ₹{hoveredCandle.low.toFixed(2)}</span>
                    <span>C: ₹{hoveredCandle.close.toFixed(2)}</span>
                    <span>Vol: {hoveredCandle.volume.toLocaleString('en-IN')}</span>
                  </>
                ) : (
                  <span className="text-slate-500">Hover over any candle to inspect OHLC metrics</span>
                )}
              </div>
            </div>

            {/* Chart Footer Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setChartType('candle')}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    chartType === 'candle'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Candlestick
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    chartType === 'area'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Area
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                DATA SOURCE: MOCK FEED (NSE)
              </div>
            </div>
          </div>
        </div>

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
