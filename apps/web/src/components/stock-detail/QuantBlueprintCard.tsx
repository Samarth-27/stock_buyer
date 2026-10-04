import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { AIPrediction } from '@marketeye/shared';

interface QuantBlueprintCardProps {
  prediction: AIPrediction;
  totalBuyQty: number;
  totalSellQty: number;
  buyPct: number;
}

export const QuantBlueprintCard: React.FC<QuantBlueprintCardProps> = React.memo(({
  prediction,
  totalBuyQty,
  totalSellQty,
  buyPct,
}) => {
  const isJump = prediction.signal === 'JUMP';
  const isDrop = prediction.signal === 'DROP';

  return (
    <div
      className={`my-6 p-5 sm:p-6 rounded-2xl border transition-all ${
        isJump
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-cyan-950/30 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
          : isDrop
          ? 'bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-amber-950/30 border-rose-500/40 shadow-lg shadow-rose-950/30'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Header: Title, Signal Pill, Confidence Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-xl border ${
              isJump
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : isDrop
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-white tracking-wide">
                AI Microstructure Directional Forecast
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Live LOB Model
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sub-millisecond quant model calculating fair Micro-Price & 5-level order book momentum.
            </p>
          </div>
        </div>

        {/* Signal Pill & Confidence */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono font-black text-sm tracking-wider flex items-center space-x-1.5 shadow-md ${
              isJump
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10 animate-pulse'
                : isDrop
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/10'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isJump ? (
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            ) : isDrop ? (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            ) : null}
            <span>{isJump ? 'PREDICTING JUMP' : isDrop ? 'PREDICTING DROP' : 'RANGE-BOUND'}</span>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Model Confidence</div>
            <div className="text-base font-black text-white font-mono">{prediction.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Metrics Row: 4 Quant Attributes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
        {/* Expected Move */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            Expected Move Target
          </div>
          <div
            className={`text-lg font-black font-mono mt-1 ${
              prediction.expectedMovePercent > 0
                ? 'text-cyan-300'
                : prediction.expectedMovePercent < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {prediction.expectedMovePercent > 0
              ? `+${prediction.expectedMovePercent.toFixed(2)}%`
              : prediction.expectedMovePercent < 0
              ? `${prediction.expectedMovePercent.toFixed(2)}%`
              : '0.00%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Short-term projection</div>
        </div>

        {/* Micro-Price Equilibrium */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            Micro-Price (Fair Value)
          </div>
          <div className="text-lg font-black font-mono text-white mt-1">
            ₹{prediction.microPrice.toFixed(2)}
          </div>
          <div
            className={`text-[10px] font-mono mt-0.5 font-bold ${
              prediction.microPriceDeltaBps > 0
                ? 'text-emerald-400'
                : prediction.microPriceDeltaBps < 0
                ? 'text-rose-400'
                : 'text-slate-500'
            }`}
          >
            {prediction.microPriceDeltaBps > 0 ? `+${prediction.microPriceDeltaBps} bps` : `${prediction.microPriceDeltaBps} bps`} vs LTP
          </div>
        </div>

        {/* Weighted 5-Level Depth Imbalance */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            5-Level Weighted Depth
          </div>
          <div
            className={`text-lg font-black font-mono mt-1 ${
              prediction.weightedImbalance > 0
                ? 'text-emerald-400'
                : prediction.weightedImbalance < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {prediction.weightedImbalance > 0 ? `+${(prediction.weightedImbalance * 100).toFixed(1)}%` : `${(prediction.weightedImbalance * 100).toFixed(1)}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Weight decay: 40/25/15/10/10</div>
        </div>

        {/* Top-of-Book Touch Pressure */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
            Order Flow Dominance
          </div>
          <div className="text-lg font-black font-mono text-white mt-1">
            {buyPct.toFixed(1)}% Buy
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            TBQ {totalBuyQty.toLocaleString('en-IN')} vs TSQ {totalSellQty.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Explainable Microstructure Drivers */}
      {prediction.reasons && prediction.reasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-2">
            Microstructure Alpha Drivers Detected:
          </div>
          <div className="flex flex-wrap gap-2">
            {prediction.reasons.map((r, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{r}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calibrated Quant Trade Execution Blueprint (Jev Decision Layer) */}
      {prediction.executionPlan && prediction.executionPlan.action !== 'WAIT' && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Quant Trade Execution Blueprint (Jev-Calibrated)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Action: {prediction.executionPlan.action.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Entry Price */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Entry Level</span>
              <span className="text-base font-bold font-mono text-white">
                ₹{prediction.executionPlan.entryPrice.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Market / Limit</span>
            </div>

            {/* Target Price */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 bg-cyan-950/10">
              <span className="text-[10px] text-cyan-400 uppercase font-semibold block">Take Profit Target</span>
              <span className="text-base font-bold font-mono text-cyan-300">
                ₹{prediction.executionPlan.targetPrice.toFixed(2)}
              </span>
              <span className="text-[10px] text-cyan-400/80 block font-mono">
                +{prediction.executionPlan.expectedMovePercent.toFixed(2)}% move
              </span>
            </div>

            {/* Stop Loss */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-rose-500/30 bg-rose-950/10">
              <span className="text-[10px] text-rose-400 uppercase font-semibold block">Depth Stop Loss</span>
              <span className="text-base font-bold font-mono text-rose-400">
                ₹{prediction.executionPlan.stopLossPrice.toFixed(2)}
              </span>
              <span className="text-[10px] text-rose-400/80 block font-mono">
                {prediction.executionPlan.stopLossPercent.toFixed(2)}% risk
              </span>
            </div>

            {/* Risk : Reward & Kelly */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">R:R & Kelly Bet</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {prediction.executionPlan.riskRewardRatio} : 1
              </span>
              <span className="text-[10px] text-slate-300 block font-mono">
                Kelly: {prediction.executionPlan.kellyAllocationPercent}% capital
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <span>
                Calibrated Win Probability:{' '}
                <strong className="text-cyan-300">
                  {prediction.executionPlan.calibratedWinProbability}%
                </strong>
              </span>
              <span>•</span>
              <span>
                Regime:{' '}
                <strong className="text-white">
                  {prediction.executionPlan.regime.replace('_', ' ')}
                </strong>
              </span>
            </div>
            <div>
              Spoofing Shield Risk:{' '}
              <strong
                className={
                  prediction.executionPlan.spoofRisk === 'LOW'
                    ? 'text-emerald-400'
                    : prediction.executionPlan.spoofRisk === 'MEDIUM'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {prediction.executionPlan.spoofRisk}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
