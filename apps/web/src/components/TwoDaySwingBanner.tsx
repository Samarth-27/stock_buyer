import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertOctagon,
  Eye,
  Clock,
  Calculator,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { StockQuote, TwoDaySwingVerdict } from '@marketeye/shared';

interface TwoDaySwingBannerProps {
  quotes: StockQuote[];
  onSelectStock: (symbol: string) => void;
}

export const TwoDaySwingBanner: React.FC<TwoDaySwingBannerProps> = ({
  quotes,
  onSelectStock,
}) => {
  const [filterVerdict, setFilterVerdict] = useState<TwoDaySwingVerdict | 'ALL'>('ALL');
  const [showFormulaExplanation, setShowFormulaExplanation] = useState(false);

  // Group quotes by verdict
  const { convincingBuys, watchlistPullbacks, passStocks } = useMemo(() => {
    const buys: StockQuote[] = [];
    const watch: StockQuote[] = [];
    const pass: StockQuote[] = [];

    quotes.forEach((q) => {
      const v = q.twoDayDecision?.verdict ?? (q.swingPlan?.twoDayDecision?.verdict || 'WATCHLIST_PULLBACK');
      if (v === 'CONVINCING_BUY') buys.push(q);
      else if (v === 'PASS_DO_NOT_BUY') pass.push(q);
      else watch.push(q);
    });

    // Sort buys by JEV expected value descending
    buys.sort((a, b) => {
      const evA = a.twoDayDecision?.jev.expectedValuePercent ?? 0;
      const evB = b.twoDayDecision?.jev.expectedValuePercent ?? 0;
      return evB - evA;
    });

    return {
      convincingBuys: buys,
      watchlistPullbacks: watch,
      passStocks: pass,
    };
  }, [quotes]);

  const displayedStocks = useMemo(() => {
    if (filterVerdict === 'CONVINCING_BUY') return convincingBuys;
    if (filterVerdict === 'WATCHLIST_PULLBACK') return watchlistPullbacks;
    if (filterVerdict === 'PASS_DO_NOT_BUY') return passStocks;
    return quotes.slice(0, 12);
  }, [filterVerdict, convincingBuys, watchlistPullbacks, passStocks, quotes]);

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 shadow-2xl mb-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header section */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>JEV TRI-CONSENSUS</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>VALIDITY: 2 TO 5 TRADING DAYS</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            2-Day Swing Trading Decision Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
            Unambiguously tells you <strong>WHAT TO BUY</strong> vs <strong>WHAT TO PASS</strong>.
            Synthesizes <strong>JEV Mathematical Expectancy</strong> ($EV$), <strong>Minervini Stage 2</strong>, <strong>VCP Compression</strong>, <strong>XGBoost ML</strong> (29,520 NSE Setups), <strong>Order Book Microstructure</strong>, and <strong>Qullamaggie 10/20 EMA Support</strong>.
          </p>
        </div>

        {/* Action / Formula Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFormulaExplanation(!showFormulaExplanation)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showFormulaExplanation ? 'Hide JEV Formula' : 'How JEV Works'}</span>
          </button>
        </div>
      </div>

      {/* Explainer Drawer */}
      {showFormulaExplanation && (
        <div className="relative z-10 my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
          <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono text-sm">
            <Calculator className="w-4 h-4" />
            <span>Mathematical Joint Expected Value (JEV) Principle</span>
          </div>
          <p className="leading-relaxed">
            In quantitative swing trading, an entry is mathematically favorable only when the expected return across repeated trades is strictly positive:
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-center text-cyan-300 text-sm font-bold">
            Expected Value (EV) = (Win Probability × Target 1 Gain%) − (Loss Probability × Stop Loss%)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-emerald-400 block mb-1">🟢 Positive Expectancy (EV &gt; +1.0%)</strong>
              Validates holding across 2–5 trading days without being stopped out by normal intraday noise.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-purple-400 block mb-1">📐 Daily Anchor vs Noise Stop</strong>
              Invalidation stops are anchored to the <strong>Daily 20 EMA and structural base lows</strong> (-2.0% to -3.2%), preventing 5-minute whipsaws.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <strong className="text-amber-400 block mb-1">⚖️ Half-Kelly Capital Bet</strong>
              Calculates exact recommended allocation % so you never overleverage any single swing idea.
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 pt-4 pb-4">
        <button
          onClick={() => setFilterVerdict('CONVINCING_BUY')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'CONVINCING_BUY'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>🟢 Convincing Buys ({convincingBuys.length})</span>
        </button>

        <button
          onClick={() => setFilterVerdict('WATCHLIST_PULLBACK')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'WATCHLIST_PULLBACK'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>🟡 Watchlist Pullbacks ({watchlistPullbacks.length})</span>
        </button>

        <button
          onClick={() => setFilterVerdict('PASS_DO_NOT_BUY')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
            filterVerdict === 'PASS_DO_NOT_BUY'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>🔴 Pass / Do Not Buy ({passStocks.length})</span>
        </button>

        <button
          onClick={() => setFilterVerdict('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
            filterVerdict === 'ALL'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
          }`}
        >
          All Equities ({quotes.length})
        </button>
      </div>

      {/* Convincing Buys Spotlight / Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedStocks.slice(0, 6).map((stock) => {
          const plan = stock.swingPlan;
          const decision = stock.twoDayDecision ?? plan?.twoDayDecision;
          const verdict = decision?.verdict ?? 'WATCHLIST_PULLBACK';
          const isBuy = verdict === 'CONVINCING_BUY';
          const isPass = verdict === 'PASS_DO_NOT_BUY';
          const jev = decision?.jev;

          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock.symbol)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                isBuy
                  ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10'
                  : isPass
                  ? 'bg-slate-950/70 border-rose-500/30 hover:border-rose-400'
                  : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        ₹{stock.ltp.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
                      {stock.companyName}
                    </p>
                  </div>

                  {/* Verdict Badge */}
                  <div
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black tracking-wide flex items-center space-x-1 ${
                      isBuy
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                        : isPass
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isBuy ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isPass ? (
                      <XCircle className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Eye className="w-3 h-3 text-amber-400" />
                    )}
                    <span>{isBuy ? 'BUY (2-5D)' : isPass ? 'PASS' : 'WATCH'}</span>
                  </div>
                </div>

                {/* JEV Key Metrics */}
                {jev && (
                  <div className="grid grid-cols-3 gap-2 py-3 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">JEV EV%</span>
                      <span
                        className={`text-xs font-black ${
                          jev.expectedValuePercent >= 1.5
                            ? 'text-emerald-400'
                            : jev.expectedValuePercent > 0
                            ? 'text-cyan-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {jev.expectedValuePercent >= 0 ? `+${jev.expectedValuePercent}%` : `${jev.expectedValuePercent}%`}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Win Prob</span>
                      <span className="text-xs font-bold text-white">
                        {jev.winProbability}%
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Kelly Size</span>
                      <span className="text-xs font-bold text-purple-300">
                        {jev.halfKellyCapitalPercent}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Trade Execution Zone */}
                {decision && isBuy && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entry Zone:</span>
                      <span className="text-white font-bold">
                        ₹{decision.entryZone.min.toFixed(2)} – ₹{decision.entryZone.max.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target 1 (2–4D):</span>
                      <span className="text-emerald-400 font-bold">
                        ₹{decision.target1Price.toFixed(2)} (+{decision.target1Percent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Invalidation SL:</span>
                      <span className="text-rose-400 font-bold">
                        ₹{decision.invalidationStopPrice.toFixed(2)} (-{decision.invalidationStopPercent}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* Risk Warning if PASS */}
                {isPass && decision?.riskWarnings && decision.riskWarnings.length > 0 && (
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-300 font-sans mt-2 space-y-0.5">
                    <div className="font-bold flex items-center gap-1 text-rose-400">
                      <AlertOctagon className="w-3 h-3" />
                      <span>Pass Reason:</span>
                    </div>
                    <p className="line-clamp-2">{decision.riskWarnings[0]}</p>
                  </div>
                )}

                {/* Watchlist Setup if WATCH */}
                {!isBuy && !isPass && (
                  <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200 font-sans mt-2">
                    <span className="font-semibold block text-amber-300">Coiling near 20 EMA:</span>
                    <span>Awaiting volume pivot breakout before committing capital.</span>
                  </div>
                )}
              </div>

              {/* Bottom Invalidation & Inspection rule */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate max-w-[200px]" title={decision?.holdingHorizonDays}>
                  ⏱ {decision?.holdingHorizonDays || '2 to 5 Trading Days'}
                </span>
                <span className="text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Tri-Consensus <ChevronRight className="w-3 h-3 inline" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
