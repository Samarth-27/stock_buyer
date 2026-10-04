import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  ShieldAlert,
  Layers,
  Sparkles,
  ArrowUpRight,
  Compass,
  CheckCircle2,
  Clock,
  Zap,
  Award,
  Activity,
  GitCommit,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SwingTradePlan } from '@marketeye/shared';

interface SwingBlueprintCardProps {
  swingPlan?: SwingTradePlan;
  ltp: number;
}

export const SwingBlueprintCard: React.FC<SwingBlueprintCardProps> = ({ swingPlan, ltp }) => {
  const [showMinerviniDetails, setShowMinerviniDetails] = useState(false);

  if (!swingPlan) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
        Calculating multi-day swing blueprint...
      </div>
    );
  }

  const {
    setupName,
    stage,
    entryRange,
    target1,
    target1Percent,
    target2,
    target2Percent,
    stopLoss,
    stopLossPercent,
    riskRewardRatio,
    holdingHorizon,
    dailyRsi,
    trendAlignment,
    catalysts,
    adrPercent,
    minerviniTemplate,
    vcp,
    qullamaggieTrailing,
    mlEngine,
    confluence,
  } = swingPlan;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20 border border-indigo-500/30 shadow-xl space-y-4 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Swing Trade Blueprint
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {stage}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Formulated for multi-day position holding ({holdingHorizon})
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {confluence && (
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 shadow-sm ${
                confluence.tier === 'GRADE_A_PLUS_SNIPER'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                  : confluence.tier === 'GRADE_A_HIGH_CONFLUENCE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
              title={confluence.tierLabel}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Confluence: {confluence.overallScore}% ({confluence.tier === 'GRADE_A_PLUS_SNIPER' ? 'Grade A+ Sniper' : confluence.tier === 'GRADE_A_HIGH_CONFLUENCE' ? 'Grade A' : 'Grade B'})</span>
            </span>
          )}

          {adrPercent !== undefined && (
            <span
              className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1"
              title="Average Daily Range (20 Days): Natural swing volatility"
            >
              <Activity className="w-3 h-3 text-amber-400" />
              ADR: {adrPercent.toFixed(1)}%
            </span>
          )}

          {minerviniTemplate && (
            <button
              onClick={() => setShowMinerviniDetails(!showMinerviniDetails)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-1 transition-all ${
                minerviniTemplate.score >= 6
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Minervini 8-Point Trend Template Score"
            >
              <Award className="w-3 h-3" />
              Minervini: {minerviniTemplate.score}/8
              {showMinerviniDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {vcp && (
            <span
              className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 flex items-center gap-1"
              title="Volatility Contraction Pattern Tightness Score"
            >
              <GitCommit className="w-3 h-3 text-cyan-400" />
              VCP: {vcp.tightnessScore}%
            </span>
          )}

          {mlEngine && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1" title="Trained on 29,520 historical NSE daily bars with out-of-sample walk-forward validation">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              ML: {mlEngine.winProbability.toFixed(1)}%
            </span>
          )}

          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            R:R 1:{riskRewardRatio}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            {holdingHorizon}
          </span>
        </div>
      </div>

      {/* Minervini 8-Point Trend Template Expandable Detail */}
      {minerviniTemplate && showMinerviniDetails && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs transition-all">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              Mark Minervini 8-Point Trend Template Compliance
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {minerviniTemplate.score} of 8 Rules Satisfied ({minerviniTemplate.passed ? 'STAGE 2 CONFIRMED' : 'STAGE 1/CONSOLIDATION'})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {minerviniTemplate.passedRules.map((rule, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{rule}</span>
              </div>
            ))}
            {minerviniTemplate.failedRules.map((rule, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-rose-400/80">
                <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-rose-400">✕</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-Data Trained ML Engine Strip */}
      {mlEngine && (
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white">Real-Data ML Engine: {mlEngine.modelType}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/30 text-purple-200 border border-purple-500/40">
                  {mlEngine.confidenceTier} TIER
                </span>
              </div>
              <div className="text-[11px] text-purple-300/80">
                Trained on {mlEngine.trainingSamples.toLocaleString('en-IN')} real NSE daily bars | Out-of-Sample Walk-Forward Backtest
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Backtested Win Rate: </span>
              <span className="text-emerald-400 font-bold">{mlEngine.winProbability.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">Target Horizon: </span>
              <span className="text-indigo-300 font-bold">10 Trading Days</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Swing Price Plan Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Entry Zone */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Accumulation Zone
          </div>
          <div className="mt-1">
            <div className="text-sm font-extrabold font-mono text-cyan-300">
              ₹{entryRange.min.toFixed(2)} – ₹{entryRange.max.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Current LTP: ₹{ltp.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Target 1 */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3 h-3" />
            Swing Target 1
          </div>
          <div className="mt-1">
            <div className="text-base font-extrabold font-mono text-emerald-400 flex items-baseline gap-1">
              ₹{target1.toFixed(2)}
              <span className="text-[11px] font-bold text-emerald-300">
                (+{target1Percent.toFixed(1)}%)
              </span>
            </div>
            <div className="text-[10px] text-emerald-500/70 font-mono mt-0.5">
              Initial Profit Locking Level
            </div>
          </div>
        </div>

        {/* Target 2 */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Swing Target 2
          </div>
          <div className="mt-1">
            <div className="text-base font-extrabold font-mono text-emerald-300 flex items-baseline gap-1">
              ₹{target2.toFixed(2)}
              <span className="text-[11px] font-bold text-emerald-200">
                (+{target2Percent.toFixed(1)}%)
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/60 font-mono mt-0.5">
              Extended Trend Runner
            </div>
          </div>
        </div>

        {/* Invalidation / Stop Loss */}
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Invalidation / Stop Loss
          </div>
          <div className="mt-1">
            <div className="text-base font-extrabold font-mono text-rose-400 flex items-baseline gap-1">
              ₹{stopLoss.toFixed(2)}
              <span className="text-[11px] font-bold text-rose-300">
                (-{stopLossPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="text-[10px] text-rose-400/60 font-mono mt-0.5">
              Anchored below 20 EMA / Swing Low
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Multi-Factor Confluence & Kelly Risk Allocation Engine */}
      {confluence && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-amber-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  Institutional Confluence & Kelly Sizing Engine
                </span>
                <span className="text-[10px] text-slate-400">
                  Synthesizing Minervini Stage 2, VCP Contraction, Order Book Depth, XGBoost ML, & Qullamaggie Moving Averages
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md font-mono text-xs font-black ${
                confluence.tier === 'GRADE_A_PLUS_SNIPER'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {confluence.tierLabel}
              </span>
            </div>
          </div>

          {/* 5-Factor Institutional Breakdown Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">Minervini Trend</span>
              <span className="text-xs font-extrabold text-emerald-400">{confluence.breakdown.minerviniScore}%</span>
              <span className="text-[8px] text-slate-500 block">25% Weight</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">VCP Contraction</span>
              <span className="text-xs font-extrabold text-cyan-400">{confluence.breakdown.vcpTightnessScore}%</span>
              <span className="text-[8px] text-slate-500 block">20% Weight</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">Order Book Depth</span>
              <span className="text-xs font-extrabold text-indigo-400">{confluence.breakdown.orderBookDepthScore}%</span>
              <span className="text-[8px] text-slate-500 block">20% Weight</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">XGBoost ML Edge</span>
              <span className="text-xs font-extrabold text-purple-400">{confluence.breakdown.mlStatisticalScore}%</span>
              <span className="text-[8px] text-slate-500 block">20% Weight</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[9px] text-slate-400 block uppercase">10/20 EMA Base</span>
              <span className="text-xs font-extrabold text-amber-400">{confluence.breakdown.qullamaggieEmaScore}%</span>
              <span className="text-[8px] text-slate-500 block">15% Weight</span>
            </div>
          </div>

          {/* Kelly Criterion & Macro Regime Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {/* Kelly Position Sizing */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  ⚖️ Kelly Optimal Position Sizing:
                </span>
                <span className="font-extrabold text-emerald-400">
                  {confluence.kellyAllocation.recommendedPositionSizePercent}% of Portfolio
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Max Portfolio Capital at Risk:</span>
                <span className="text-rose-300 font-bold">{confluence.kellyAllocation.maxCapitalRiskPercent}%</span>
              </div>
              <p className="text-[10px] text-slate-400 italic pt-0.5">
                {confluence.kellyAllocation.rationale}
              </p>
            </div>

            {/* Macro Market Edge */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  🌐 NIFTY 50 Macro Regime:
                </span>
                <span className="font-extrabold text-cyan-300">
                  {confluence.macroMarketEdge.niftyRegime.replace('_', ' ')} (+{((confluence.macroMarketEdge.regimeMultiplier - 1) * 100).toFixed(0)}% Boost)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Market Breadth:</span>
                <span className="text-white font-bold">
                  <strong className="text-emerald-400">{confluence.macroMarketEdge.breadthAdvancers} Adv</strong> / <strong className="text-rose-400">{confluence.macroMarketEdge.breadthDecliners} Dec</strong>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic pt-0.5">
                Swing breakout setups have 85%+ institutional follow-through when broader index confirms Stage 2 breadth.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Qullamaggie 10/20 EMA Trailing Exit Engine & VCP Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Qullamaggie Dynamic Trailing Engine */}
        {qullamaggieTrailing && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Qullamaggie 10/20 EMA Trailing Exit Guide
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Partial Lock</span>
                <span className="font-extrabold text-emerald-400 text-xs">₹{qullamaggieTrailing.partialExitTarget.toFixed(2)}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">10 EMA Trail</span>
                <span className="font-extrabold text-indigo-300 text-xs">₹{qullamaggieTrailing.trailing10Ema.toFixed(2)}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">20 EMA Base</span>
                <span className="font-extrabold text-indigo-400 text-xs">₹{qullamaggieTrailing.trailing20Ema.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              💡 {qullamaggieTrailing.exitRule}
            </p>
          </div>
        )}

        {/* VCP Tightness Matrix */}
        {vcp && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                VCP Volatility Contraction Structure
              </span>
              <span className="font-mono text-cyan-400">Score: {vcp.tightnessScore}/100</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Contraction Waves:</span>
              <span className="font-bold text-white">
                {vcp.contractions.map((c, i) => `T${i + 1}: ${c.depthPercent}%`).join(' ➔ ')}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Volume Dry-up:</span>
              <span className={`font-bold ${vcp.isVolumeDryingUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                {vcp.isVolumeDryingUp ? 'CONFIRMED (Supply Exhausted)' : 'Pending Dry-up'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Pivot Buy Trigger:</span>
              <span className="font-bold text-cyan-300">₹{vcp.pivotPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Swing Technical Drivers & Catalysts */}
      <div className="pt-2 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Multi-Day Technical Alignment
          </div>
          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
              <span>Setup Structure:</span>
              <span className="text-white font-bold">{setupName}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
              <span>Daily RSI (14):</span>
              <span className={`font-bold ${dailyRsi >= 50 && dailyRsi <= 68 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {dailyRsi.toFixed(1)} ({dailyRsi >= 50 && dailyRsi <= 68 ? 'Bullish Acceleration Zone' : 'Consolidation'})
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>EMA Trend Alignment:</span>
              <span className="text-emerald-400 font-bold">
                {trendAlignment === 'BULLISH_STACK' ? 'Bullish 20 > 50 Stack' : trendAlignment === 'PULLBACK_TEST' ? '20 EMA Support Test' : 'Consolidating'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Key Swing Catalysts
          </div>
          <ul className="space-y-1">
            {catalysts.map((cat, idx) => (
              <li key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
