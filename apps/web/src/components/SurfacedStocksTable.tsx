import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Zap,
  BarChart2,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
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
  const [expandedProofs, setExpandedProofs] = useState<Record<string, boolean>>({});

  const toggleProof = (symbol: string) => {
    setExpandedProofs((prev) => ({
      ...prev,
      [symbol]: !prev[symbol],
    }));
  };

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
          <span>Tip: Try lowering the Buy Threshold slider (e.g. to 55%) or choosing a different strategy preset.</span>
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
          Auto-updating via Live WebSocket
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
          const prediction = liveQuote?.prediction ?? item.prediction;
          const swingPlan = liveQuote?.swingPlan ?? item.swingPlan;
          const isProofExpanded = Boolean(expandedProofs[item.symbol]);

          // Unified, single source-of-truth calculations
          const target1Price =
            swingPlan?.target1 ??
            (prediction?.executionPlan?.targetPrice ? prediction.executionPlan.targetPrice : ltp * 1.06);
          const target1Pct =
            swingPlan?.target1Percent ??
            (prediction?.executionPlan?.targetPrice
              ? Number((((prediction.executionPlan.targetPrice - ltp) / ltp) * 100).toFixed(1))
              : 6.0);

          const target2Price = swingPlan?.target2 ?? ltp * 1.12;
          const target2Pct = swingPlan?.target2Percent ?? 12.0;

          const stopLossPrice =
            swingPlan?.stopLoss ??
            (prediction?.executionPlan?.stopLossPrice ? prediction.executionPlan.stopLossPrice : ltp * 0.97);
          const stopLossPct =
            swingPlan?.stopLossPercent ??
            (prediction?.executionPlan?.stopLossPrice
              ? Number((((ltp - prediction.executionPlan.stopLossPrice) / ltp) * 100).toFixed(1))
              : 3.0);

          const riskReward =
            swingPlan?.riskRewardRatio ?? (prediction?.executionPlan?.riskRewardRatio ?? 2.8);
          const winProb =
            swingPlan?.mlEngine?.winProbability ??
            (prediction?.executionPlan?.calibratedWinProbability ?? (prediction?.confidence ?? 72));
          const kellySize =
            swingPlan?.confluence?.kellyAllocation?.recommendedPositionSizePercent ??
            (prediction?.executionPlan?.kellyAllocationPercent ?? 15);
          const setupTitle =
            swingPlan?.setupName ??
            (prediction?.signal === 'JUMP' ? 'Institutional Volume Surge' : 'Order Imbalance Momentum');
          const horizon = swingPlan?.holdingHorizon ?? '5 – 15 Days';
          const entryMin = swingPlan?.entryRange?.min ?? ltp * 0.995;
          const entryMax = swingPlan?.entryRange?.max ?? ltp * 1.008;

          return (
            <div
              key={item.symbol}
              className="glass-panel-elevated rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 group relative flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Symbol, Exchange, Watchlist & Quick View */}
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
                      title="Inspect Blueprint & Price Chart"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price & Change Row */}
                <div className="mt-3.5 flex items-baseline justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Current Price (LTP)
                    </div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                      ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isPositive ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`}</span>
                  </div>
                </div>

                {/* Buy Zone & Setup Banner */}
                <div className="mt-3.5 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                      Target Buy Zone
                    </span>
                    <span className="text-xs font-mono font-extrabold text-white">
                      ₹{entryMin.toFixed(2)} - ₹{entryMax.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block">
                      {setupTitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      ⏱️ {horizon}
                    </span>
                  </div>
                </div>

                {/* 3 Actionable Target Cards */}
                <div className="grid grid-cols-3 gap-2 mt-2.5 text-center font-mono">
                  {/* Target 1 */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-sm">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Target 1 (50%)</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">
                      ₹{target1Price.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500/90">
                      +{target1Pct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Target 2 */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-sm">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Target 2 (Runner)</div>
                    <div className="text-xs font-black text-cyan-300 mt-0.5">
                      ₹{target2Price.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-cyan-400/90">
                      +{target2Pct.toFixed(1)}%
                    </div>
                  </div>

                  {/* Stop Loss */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-rose-500/30 shadow-sm">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Stop Loss</div>
                    <div className="text-xs font-black text-rose-400 mt-0.5">
                      ₹{stopLossPrice.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-rose-500/90">
                      -{stopLossPct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Kelly Sizing & Risk:Reward Edge */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kelly Size:</span>
                    <strong className="text-emerald-400 font-bold">{kellySize}% Capital</strong>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>
                    R:R: <strong className="text-white font-bold">1:{riskReward}</strong>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>
                    Win Prob: <strong className="text-cyan-300 font-bold">{winProb.toFixed(0)}%</strong>
                  </span>
                </div>

                {/* Buy vs Sell Order Imbalance Ratio Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      Buy Orders: {buyPct.toFixed(1)}%
                    </span>
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      Sell Orders: {sellPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Dual Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                      style={{ width: `${buyPct}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300"
                      style={{ width: `${sellPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>TBQ: {totalBuy.toLocaleString('en-IN')}</span>
                    <span>TSQ: {totalSell.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Why did this stock surface? */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 font-medium leading-snug">
                    {item.reason}
                  </p>
                </div>

                {/* Collapsible Institutional Proof & Backtest Details */}
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => toggleProof(item.symbol)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Institutional Proof & ML Edge</span>
                    </span>
                    {isProofExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isProofExpanded && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 animate-in fade-in duration-200">
                      {/* Minervini & VCP badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {swingPlan?.minerviniTemplate && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Minervini: {swingPlan.minerviniTemplate.score}/8 Rules
                          </span>
                        )}
                        {swingPlan?.vcp && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            VCP Tightness: {swingPlan.vcp.tightnessScore}%
                          </span>
                        )}
                        {prediction?.executionPlan?.spoofRisk && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Spoof Risk: {prediction.executionPlan.spoofRisk}
                          </span>
                        )}
                        {swingPlan?.adrPercent !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            ADR: {swingPlan.adrPercent.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {prediction?.reasons && prediction.reasons.length > 0 && (
                        <div className="text-[11px] text-slate-400 leading-relaxed pl-2 border-l-2 border-cyan-500/40">
                          {prediction.reasons[0]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Volume & Blueprint CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                  <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Vol: {item.volume.toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => onSelectStock(item.symbol)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Inspect Blueprint & Chart</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

