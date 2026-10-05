import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Search,
  CheckCircle,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { StockQuote } from '@marketeye/shared';

interface AllStocksTableProps {
  stocks: StockQuote[];
  watchlistSymbols: Set<string>;
  surfacedSymbols: Set<string>;
  onSelectStock: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  buyThreshold: number;
  onAddToPortfolio?: (initialData: {
    symbol: string;
    price?: number;
    quantity?: number;
    notes?: string;
  }) => void;
}

const AllStocksTableComponent: React.FC<AllStocksTableProps> = ({
  stocks,
  watchlistSymbols,
  surfacedSymbols,
  onSelectStock,
  onToggleWatchlist,
  buyThreshold,
  onAddToPortfolio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'buyPct' | 'change' | 'volume'>('buyPct');
  const [displayLimit, setDisplayLimit] = useState(50);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    return stocks
      .filter(
        (s) =>
          !term ||
          s.symbol.includes(term) ||
          s.companyName.toUpperCase().includes(term)
      )
      .sort((a, b) => {
        if (sortBy === 'buyPct') return b.buyPercentage - a.buyPercentage;
        if (sortBy === 'change') return b.changePercent - a.changePercent;
        return b.volume - a.volume;
      });
  }, [stocks, searchTerm, sortBy]);

  const displayed = useMemo(() => filtered.slice(0, displayLimit), [filtered, displayLimit]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-extrabold text-white">All Monitored Equities</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {filtered.length.toLocaleString()} Stocks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time quotes, order book balance, and liquidity across all {filtered.length.toLocaleString()} NSE securities.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-44 sm:w-56"
            />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSortBy('buyPct')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                sortBy === 'buyPct'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buy %
            </button>
            <button
              onClick={() => setSortBy('change')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                sortBy === 'change'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              % Change
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <th className="py-3 px-3">Symbol / Company</th>
              <th className="py-3 px-3 text-right">LTP (₹)</th>
              <th className="py-3 px-3 text-right">Change %</th>
              <th className="py-3 px-3 text-center">Buy / Sell Order Imbalance</th>
              <th className="py-3 px-3 text-center">Swing Blueprint (3–15D)</th>
              <th className="py-3 px-3 text-center">2-Day Decision (Jev)</th>
              <th className="py-3 px-3 text-center">AI Forecast</th>
              <th className="py-3 px-3 text-right">Volume</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {displayed.map((stock) => {
              const isWatched = watchlistSymbols.has(stock.symbol);
              const isSurfaced = surfacedSymbols.has(stock.symbol) || stock.buyPercentage >= buyThreshold;
              const isPositive = stock.changePercent >= 0;

              return (
                <tr
                  key={stock.symbol}
                  className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                        NSE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans truncate max-w-[180px]">
                      {stock.companyName}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    ₹{stock.ltp.toFixed(2)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isPositive ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="w-48 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-market-buy font-bold">{stock.buyPercentage.toFixed(1)}%</span>
                        <span className="text-market-sell font-bold">{stock.sellPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${stock.buyPercentage}%` }}
                        />
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${stock.sellPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Swing Trade Setup */}
                  <td className="py-3 px-3 text-center">
                    {stock.swingPlan ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <TrendingUp className="w-2.5 h-2.5 text-indigo-400" />
                          <span>{stock.swingPlan.setupName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                          T1: +{stock.swingPlan.target1Percent}% | R:R 1:{stock.swingPlan.riskRewardRatio}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                          {stock.swingPlan.confluence && (
                            <span
                              className={`px-1 py-0.2 rounded font-bold ${
                                stock.swingPlan.confluence.tier === 'GRADE_A_PLUS_SNIPER'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : stock.swingPlan.confluence.tier === 'GRADE_A_HIGH_CONFLUENCE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300'
                              }`}
                              title={`Institutional Confluence: ${stock.swingPlan.confluence.overallScore}% (${stock.swingPlan.confluence.tierLabel})`}
                            >
                              {stock.swingPlan.confluence.tier === 'GRADE_A_PLUS_SNIPER' ? '⭐ A+' : `⚡${stock.swingPlan.confluence.overallScore}%`}
                            </span>
                          )}
                          {stock.swingPlan.minerviniTemplate && (
                            <span className="text-emerald-400 font-semibold" title="Minervini 8-Point Trend Template">
                              M:{stock.swingPlan.minerviniTemplate.score}/8
                            </span>
                          )}
                          {stock.swingPlan.adrPercent !== undefined && (
                            <span className="text-amber-400 font-semibold" title="20D Average Daily Range">
                              ADR:{stock.swingPlan.adrPercent.toFixed(1)}%
                            </span>
                          )}
                          <span className="text-slate-500">
                            ⏱️ {stock.swingPlan.holdingHorizon}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px]">Analyzing...</span>
                    )}
                  </td>

                  {/* 2-Day Swing Verdict & Jev Edge */}
                  <td className="py-3 px-3 text-center">
                    {(() => {
                      const dec = stock.twoDayDecision ?? stock.swingPlan?.twoDayDecision;
                      const v = dec?.verdict ?? 'WATCHLIST_PULLBACK';
                      const isB = v === 'CONVINCING_BUY';
                      const isP = v === 'PASS_DO_NOT_BUY';
                      const ev = dec?.jev?.expectedValuePercent;
                      return (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide font-mono ${
                              isB
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                                : isP
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                            title={dec?.sustainabilityReason || '2-Day Swing Decision'}
                          >
                            <span>{isB ? '🟢 BUY (2-5D)' : isP ? '🔴 PASS' : '🟡 WATCH'}</span>
                          </span>
                          {ev !== undefined && (
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              JEV:{' '}
                              <strong
                                className={
                                  ev >= 1.5 ? 'text-emerald-400' : ev > 0 ? 'text-cyan-300' : 'text-rose-400'
                                }
                              >
                                {ev >= 0 ? `+${ev}%` : `${ev}%`}
                              </strong>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* AI Forecast */}
                  <td className="py-3 px-3 text-center">
                    {stock.prediction ? (
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stock.prediction.signal === 'JUMP'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : stock.prediction.signal === 'DROP'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{stock.prediction.signal}</span>
                          <span className="opacity-80">({stock.prediction.confidence}%)</span>
                        </span>
                        {stock.prediction.expectedMovePercent !== 0 && (
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {stock.prediction.expectedMovePercent > 0
                              ? `+${stock.prediction.expectedMovePercent}% target`
                              : `${stock.prediction.expectedMovePercent}% target`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px]">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                    {stock.volume.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isSurfaced ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>Under Eyes</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">Monitoring</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div
                      className="flex items-center justify-end space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onToggleWatchlist(stock.symbol)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isWatched
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'
                        }`}
                        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        {isWatched ? (
                          <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {onAddToPortfolio && (
                        <button
                          onClick={() =>
                            onAddToPortfolio({
                              symbol: stock.symbol,
                              price: stock.ltp,
                              quantity: 10,
                              notes: 'All equities list',
                            })
                          }
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                          title="Add to Portfolio"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectStock(stock.symbol)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                        title="View Depth & Chart"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > displayLimit && (
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{displayLimit}</strong> of <strong className="text-white">{filtered.length.toLocaleString()}</strong> NSE securities
          </span>
          <button
            onClick={() => setDisplayLimit((prev) => Math.min(prev + 50, filtered.length))}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-semibold transition-all hover:bg-emerald-500/10 shadow-sm"
          >
            Load 50 More Stocks
          </button>
        </div>
      )}
    </div>
  );
};

export const AllStocksTable = React.memo(AllStocksTableComponent);
