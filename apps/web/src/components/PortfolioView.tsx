import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  Edit2,
  Trash2,
  Sparkles,
  Info,
  Calendar,
  Target,
  ShoppingBag,
} from 'lucide-react';
import {
  PortfolioHolding,
  PortfolioSummary,
  PortfolioHoldingVerdict,
  StockQuote,
  calculateSwingTradePlan,
} from '@marketeye/shared';

interface PortfolioViewProps {
  holdings: PortfolioHolding[];
  summary: PortfolioSummary;
  allStocks: StockQuote[];
  quotesMap: Map<string, StockQuote>;
  onOpenAddModal: (initialData?: {
    symbol?: string;
    price?: number;
    quantity?: number;
    notes?: string;
  }) => void;
  onEditHolding: (holding: PortfolioHolding) => void;
  onDeleteHolding: (id: string) => void;
  onSelectStock: (symbol: string) => void;
}

const PortfolioViewComponent: React.FC<PortfolioViewProps> = ({
  holdings,
  summary,
  allStocks,
  quotesMap,
  onOpenAddModal,
  onEditHolding,
  onDeleteHolding,
  onSelectStock,
}) => {
  const [filterVerdict, setFilterVerdict] = useState<'ALL' | PortfolioHoldingVerdict>('ALL');

  // Filter holdings by model verdict
  const filteredHoldings = useMemo(() => {
    if (filterVerdict === 'ALL') return holdings;
    return holdings.filter((h) => h.holdingVerdict === filterVerdict);
  }, [holdings, filterVerdict]);

  // Model-surfaced 2-Day Convincing Buys (Buy As Per Our Model)
  const convincingBuyOpportunities = useMemo(() => {
    return allStocks
      .map((q) => {
        const plan = q.swingPlan || calculateSwingTradePlan(q);
        return {
          quote: q,
          plan,
          decision: plan.twoDayDecision,
        };
      })
      .filter((item) => item.decision?.verdict === 'CONVINCING_BUY')
      .sort((a, b) => (b.decision?.jev.expectedValuePercent || 0) - (a.decision?.jev.expectedValuePercent || 0));
  }, [allStocks]);

  const isPositiveNet = summary.totalPnL >= 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Portfolio Executive Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                My Holdings & Multi-Day Swing Portfolio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Manually tracked positions evaluated dynamically against real-time NSE quotes, Qullamaggie 20 EMA trailing stops, Target 1 profit rules, and JEV mathematical expectancy.
            </p>
          </div>

          <button
            onClick={() => onOpenAddModal()}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Manual Holding</span>
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5">
          {/* Total Invested */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Invested
            </span>
            <div className="text-lg sm:text-2xl font-black text-white font-mono mt-1">
              ₹{summary.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Across {summary.holdingsCount} {summary.holdingsCount === 1 ? 'position' : 'positions'}
            </span>
          </div>

          {/* Current Portfolio Value */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Current Market Value
            </span>
            <div className="text-lg sm:text-2xl font-black text-cyan-300 font-mono mt-1">
              ₹{summary.totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Real-time tick evaluated
            </span>
          </div>

          {/* Net Unrealized P&L */}
          <div
            className={`p-4 rounded-xl border ${
              isPositiveNet
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Net Unrealized P&L
            </span>
            <div
              className={`text-lg sm:text-2xl font-black font-mono mt-1 flex items-center space-x-1 ${
                isPositiveNet ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositiveNet ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>
                {isPositiveNet ? `+₹${summary.totalPnL.toLocaleString('en-IN')}` : `-₹${Math.abs(summary.totalPnL).toLocaleString('en-IN')}`}
              </span>
            </div>
            <span
              className={`text-[11px] font-bold font-mono mt-0.5 block ${
                isPositiveNet ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositiveNet ? `+${summary.totalPnLPercent}%` : `${summary.totalPnLPercent}%`} overall
            </span>
          </div>

          {/* Action Signals Summary */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Model Action Signals
            </span>
            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
              <div className="flex items-center justify-between px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span>Hold:</span>
                <span className="font-bold">{summary.holdCount}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span>T1 Hit:</span>
                <span className="font-bold">{summary.takeProfitCount}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <span>Exit SL:</span>
                <span className="font-bold">{summary.exitCount}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <span>Pyramid:</span>
                <span className="font-bold">{summary.addCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Model Verdict */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterVerdict('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
            filterVerdict === 'ALL'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Positions ({holdings.length})
        </button>

        <button
          onClick={() => setFilterVerdict('HOLD_TRAIL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'HOLD_TRAIL'
              ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>🟢 Hold & Trail ({summary.holdCount})</span>
        </button>

        <button
          onClick={() => setFilterVerdict('TAKE_PROFIT_T1')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'TAKE_PROFIT_T1'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>🟡 Take Profit T1 ({summary.takeProfitCount})</span>
        </button>

        <button
          onClick={() => setFilterVerdict('EXIT_STOP_LOSS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'EXIT_STOP_LOSS'
              ? 'bg-rose-500 text-white font-extrabold shadow-md'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>🔴 Exit / Stop Loss ({summary.exitCount})</span>
        </button>

        <button
          onClick={() => setFilterVerdict('ADD_PYRAMID')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'ADD_PYRAMID'
              ? 'bg-purple-500 text-white font-extrabold shadow-md'
              : 'bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>🟣 Add / Pyramid ({summary.addCount})</span>
        </button>
      </div>

      {/* Holdings List / Empty State */}
      {holdings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Holdings In Your Portfolio Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Add which shares you are holding and your purchase price. MarketEye will automatically track real-time P&L and make authoritative swing trading decisions for you.
          </p>
          <button
            onClick={() => onOpenAddModal()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition-all inline-flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Add Your First Holding</span>
          </button>
        </div>
      ) : filteredHoldings.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400 text-sm">
          No holdings match the selected model filter "{filterVerdict}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHoldings.map((h) => {
            const pnl = h.unrealizedPnL ?? 0;
            const pnlPct = h.unrealizedPnLPercent ?? 0;
            const isGain = pnl >= 0;
            const quote = quotesMap.get(h.symbol.toUpperCase());

            return (
              <div
                key={h.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition-all p-5 shadow-lg relative overflow-hidden"
              >
                {/* Decision Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80 gap-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-white font-mono">{h.symbol}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {h.quantity} Shares
                        </span>
                        {h.daysHeld !== undefined && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {h.daysHeld} {h.daysHeld === 1 ? 'day held' : 'days held'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block truncate max-w-xs sm:max-w-md">
                        {h.companyName}
                      </span>
                    </div>
                  </div>

                  {/* Model Verdict Badge */}
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase font-mono tracking-wider flex items-center space-x-1.5 shadow-sm ${
                        h.holdingVerdict === 'TAKE_PROFIT_T1'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : h.holdingVerdict === 'EXIT_STOP_LOSS'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : h.holdingVerdict === 'ADD_PYRAMID'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {h.holdingVerdict === 'TAKE_PROFIT_T1' ? (
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                      ) : h.holdingVerdict === 'EXIT_STOP_LOSS' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      ) : h.holdingVerdict === 'ADD_PYRAMID' ? (
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{h.holdingVerdictLabel || 'HOLD & TRAIL'}</span>
                    </span>

                    {/* Actions: Inspect, Edit, Delete */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onSelectStock(h.symbol)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Inspect Live Blueprint & Charts"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditHolding(h)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Edit Price or Quantity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteHolding(h.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
                        title="Remove Holding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs font-mono">
                  {/* Buy Price vs Current LTP */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Buy Price → LTP
                    </span>
                    <div className="font-bold text-white mt-1">
                      ₹{h.buyPrice.toFixed(2)} →{' '}
                      <span className={isGain ? 'text-emerald-400' : 'text-rose-400'}>
                        ₹{(h.currentLtp || h.buyPrice).toFixed(2)}
                      </span>
                    </div>
                    {quote && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Today: {quote.changePercent >= 0 ? `+${quote.changePercent.toFixed(2)}%` : `${quote.changePercent.toFixed(2)}%`}
                      </span>
                    )}
                  </div>

                  {/* Total Value */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Invested → Current
                    </span>
                    <div className="font-bold text-white mt-1">
                      ₹{(h.investedValue || h.buyPrice * h.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })} →{' '}
                      <span className="text-cyan-300 font-bold">
                        ₹{(h.currentValue || (h.currentLtp || h.buyPrice) * h.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {h.quantity} shares
                    </span>
                  </div>

                  {/* Net P&L */}
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isGain
                        ? 'bg-emerald-950/20 border-emerald-500/20'
                        : 'bg-rose-950/20 border-rose-500/20'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Unrealized P&L
                    </span>
                    <div
                      className={`font-black text-sm mt-1 flex items-center space-x-1 ${
                        isGain ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>
                        {isGain ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold block mt-0.5 ${
                        isGain ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isGain ? `+${pnlPct.toFixed(2)}%` : `${pnlPct.toFixed(2)}%`}
                    </span>
                  </div>

                  {/* Targets & Trailing Stop */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Target 1 / Trail SL
                    </span>
                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className="text-slate-400">T1:</span>
                      <span className="text-emerald-400 font-bold">
                        ₹{h.target1Price?.toFixed(2) || (h.buyPrice * 1.07).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] mt-0.5">
                      <span className="text-slate-400">SL:</span>
                      <span className="text-rose-400 font-bold">
                        ₹{h.trailingStopPrice?.toFixed(2) || (h.buyPrice * 0.97).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Model Recommendation Reason Box */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-start space-x-2.5 text-xs">
                  <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 mt-0.5 flex-shrink-0">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-200 block mb-0.5">
                      Model Decision Guideline:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {h.holdingReason || 'Position is healthy. Let the multi-day swing momentum compound.'}
                    </p>
                    {h.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic font-mono">
                        Thesis note: {h.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Model-Driven Buying Section ("Buy As Per Our Model") */}
      <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/20 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Buy As Per Our Model (2-Day Convincing Buys)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Top setups right now meeting the 6-pillar confluence (Mark Minervini Stage 2, VCP tightness, ML win prob, positive JEV expectancy). Click "1-Click Buy / Add" to record them into your portfolio.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
            {convincingBuyOpportunities.length} Qualified Setups
          </span>
        </div>

        {convincingBuyOpportunities.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
            No stocks currently meet the strict 2-Day Convincing Buy filters. Our model patiently preserves capital until high-expectancy setups trigger.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {convincingBuyOpportunities.slice(0, 6).map(({ quote, decision }) => {
              if (!decision) return null;
              const jev = decision.jev;

              return (
                <div
                  key={quote.symbol}
                  className="rounded-xl border border-slate-800 bg-slate-950/90 hover:border-emerald-500/40 p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-white text-base">
                            {quote.symbol}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            +EV {jev.expectedValuePercent}%
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                          {quote.companyName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          ₹{quote.ltp.toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            quote.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {quote.changePercent >= 0 ? `+${quote.changePercent.toFixed(2)}%` : `${quote.changePercent.toFixed(2)}%`}
                        </span>
                      </div>
                    </div>

                    {/* Setup Targets */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target 1:</span>
                        <span className="text-emerald-400 font-bold">
                          ₹{decision.target1Price.toFixed(2)} (+{decision.target1Percent}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Daily SL:</span>
                        <span className="text-rose-400 font-bold">
                          ₹{decision.invalidationStopPrice.toFixed(2)} (-{decision.invalidationStopPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Half-Kelly Size:</span>
                        <span className="text-purple-300 font-bold">
                          {jev.halfKellyCapitalPercent}% of capital
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => onSelectStock(quote.symbol)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-center"
                    >
                      Blueprint
                    </button>
                    <button
                      onClick={() =>
                        onOpenAddModal({
                          symbol: quote.symbol,
                          price: quote.ltp,
                          quantity: 10,
                          notes: `2-Day Convincing Buy (+${jev.expectedValuePercent}% EV)`,
                        })
                      }
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1 shadow-md shadow-emerald-500/20"
                    >
                      <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>1-Click Buy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const PortfolioView = React.memo(PortfolioViewComponent);
