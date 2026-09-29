import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Zap,
  BarChart2,
  Info,
} from 'lucide-react';
import { ScannerResult, StockQuote } from '@marketeye/shared';

interface SurfacedStocksTableProps {
  results: ScannerResult[];
  quotes: Map<string, StockQuote>;
  watchlistSymbols: Set<string>;
  onSelectStock: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  buyThreshold: number;
}

export const SurfacedStocksTable: React.FC<SurfacedStocksTableProps> = ({
  results,
  quotes,
  watchlistSymbols,
  onSelectStock,
  onToggleWatchlist,
  buyThreshold,
}) => {
  if (results.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800/80 my-4 shadow-xl">
        <div className="inline-flex p-4 rounded-2xl bg-slate-900/90 text-slate-500 border border-slate-800 mb-4">
          <Zap className="w-8 h-8 text-amber-500/60" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          No stocks currently meet your configured conditions
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Currently, no monitored securities have order books with Buy Quantity % ≥{' '}
          {buyThreshold.toFixed(1)}%. The scanner is continuously monitoring live exchange ticks.
        </p>
        <div className="inline-flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Tip: Try lowering the Buy Threshold slider (e.g. to 55%) to widen the scanner criteria.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <h2 className="text-lg font-extrabold text-white tracking-tight">
            Stocks Under Your Eyes
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {results.length} Surfaced
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Auto-updating via WebSocket
        </div>
      </div>

      {/* Grid of Surfaced Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((item) => {
          const liveQuote = quotes.get(item.symbol);
          const ltp = liveQuote?.ltp ?? item.ltp;
          const changePercent = liveQuote?.changePercent ?? item.changePercent;
          const buyPct = liveQuote?.buyPercentage ?? item.buyPercentage;
          const sellPct = liveQuote?.sellPercentage ?? item.sellPercentage;
          const totalBuy = liveQuote?.totalBuyQuantity ?? item.totalBuyQuantity;
          const totalSell = liveQuote?.totalSellQuantity ?? item.totalSellQuantity;
          const isPositive = changePercent >= 0;
          const isWatched = watchlistSymbols.has(item.symbol);

          return (
            <div
              key={item.symbol}
              className="glass-panel-elevated rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 group relative flex flex-col justify-between"
            >
              {/* Top Row: Symbol, Company, Watchlist */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-lg text-white font-mono tracking-tight group-hover:text-emerald-400 transition-colors">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        NSE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{item.companyName}</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onToggleWatchlist(item.symbol)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isWatched
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : 'bg-slate-900/80 text-slate-500 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isWatched ? (
                        <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onSelectStock(item.symbol)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                      title="Inspect Market Depth & Chart"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price & Change Row */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Last Traded Price
                    </div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                      ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isPositive ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`}</span>
                  </div>
                </div>

                {/* Buy vs Sell Percentage Ratio Visualizer */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-market-buy font-bold flex items-center gap-1">
                      Buy Qty: {buyPct.toFixed(1)}%
                    </span>
                    <span className="text-market-sell font-bold flex items-center gap-1">
                      Sell Qty: {sellPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Dual Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-market-buy transition-all duration-300"
                      style={{ width: `${buyPct}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-market-sell to-rose-600 transition-all duration-300"
                      style={{ width: `${sellPct}%` }}
                    />
                  </div>

                  {/* Quantities breakdown */}
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                    <span>TBQ: {totalBuy.toLocaleString('en-IN')}</span>
                    <span>TSQ: {totalSell.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Explicit Reason Surfaced Badge */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Why did this stock surface?
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>

              {/* Card Footer: Volume & Inspect CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                  <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Vol: {item.volume.toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => onSelectStock(item.symbol)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 group/btn"
                >
                  <span>Depth & Chart</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
