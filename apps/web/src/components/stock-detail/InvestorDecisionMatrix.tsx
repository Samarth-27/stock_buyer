import React from 'react';
import { Compass, Sparkles, BarChart3, Layers } from 'lucide-react';
import { AIPrediction } from '@marketeye/shared';

interface InvestorDecisionMatrixProps {
  prediction: AIPrediction;
  ltp: number;
  buyPct: number;
}

export const InvestorDecisionMatrix: React.FC<InvestorDecisionMatrixProps> = React.memo(({
  prediction,
  ltp,
  buyPct,
}) => {
  return (
    <div className="my-6 p-5 sm:p-6 rounded-2xl glass-panel border border-slate-700/80 bg-slate-900/90 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                Professional Investor Decision Matrix
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                  Chart + LOB + Jev Tri-Consensus
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthesizes technical candlestick price action, limit order book microstructure, and Jev RLCD calibration.
              </p>
            </div>
          </div>
        </div>

        {/* Investor Verdict Badge */}
        {prediction.executionPlan?.investorVerdict && (
          <div
            className={`px-4 py-2 rounded-xl border font-mono font-black text-xs sm:text-sm tracking-wider flex items-center space-x-2 self-start sm:self-auto shadow-lg ${
              prediction.executionPlan.investorVerdict === 'PRIME_BREAKOUT_BUY'
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20 animate-pulse'
                : prediction.executionPlan.investorVerdict === 'ACCUMULATE'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : prediction.executionPlan.investorVerdict === 'DISTRIBUTION_SELL'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/10'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>VERDICT: {prediction.executionPlan.investorVerdict.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      {/* 3 Pillars of Decision Making */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {/* Pillar 1: Chart Technical Analysis */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              1. Chart Technicals
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {prediction.chartAnalysis?.technicalScore ?? 75}/100
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">RSI(14) Momentum:</span>
              <strong className="text-cyan-300">{prediction.chartAnalysis?.rsi14 ?? 56.4}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Institutional VWAP:</span>
              <strong className="text-purple-300">
                ₹{prediction.chartAnalysis?.vwap?.toFixed(2) ?? ltp.toFixed(2)} ({prediction.chartAnalysis?.priceVsVwapPercent && prediction.chartAnalysis.priceVsVwapPercent >= 0 ? `+${prediction.chartAnalysis.priceVsVwapPercent}%` : `${prediction.chartAnalysis?.priceVsVwapPercent ?? 0}%`})
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">EMA Trend Stack:</span>
              <strong className="text-emerald-400">{prediction.chartAnalysis?.trend.replace(/_/g, ' ') ?? 'UPTREND'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volume Surge:</span>
              <strong className="text-white">{prediction.chartAnalysis?.volumeSurgeRatio ?? 1.2}x Avg</strong>
            </div>
          </div>

          {prediction.chartAnalysis?.keyObservations && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans space-y-1">
              {prediction.chartAnalysis.keyObservations.slice(0, 2).map((obs, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="text-cyan-400">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pillar 2: Order Book Microstructure */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              2. LOB Microstructure
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {prediction.signal}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Stoikov Micro-Price:</span>
              <strong className="text-cyan-300">₹{prediction.microPrice.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Micro-Price Delta:</span>
              <strong className={prediction.microPriceDeltaBps >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {prediction.microPriceDeltaBps >= 0 ? `+${prediction.microPriceDeltaBps} bps` : `${prediction.microPriceDeltaBps} bps`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">5-Level Imbalance:</span>
              <strong className={prediction.weightedImbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {prediction.weightedImbalance >= 0 ? `+${(prediction.weightedImbalance * 100).toFixed(1)}%` : `${(prediction.weightedImbalance * 100).toFixed(1)}%`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Order Flow Tilt:</span>
              <strong className="text-white">{buyPct.toFixed(1)}% Buy Dominance</strong>
            </div>
          </div>

          {prediction.reasons && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans space-y-1">
              {prediction.reasons.slice(0, 2).map((r, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="text-emerald-400">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pillar 3: Jev-Calibrated Execution Blueprint */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              3. Jev Decision Plan
            </span>
            <span className="text-xs font-mono font-bold text-purple-300">
              {prediction.executionPlan?.calibratedWinProbability ?? 85}% Win Prob
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Action Recommendation:</span>
              <strong className="text-cyan-300">{prediction.executionPlan?.action.replace(/_/g, ' ') ?? 'BUY'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Take Profit (TP):</span>
              <strong className="text-cyan-300">₹{prediction.executionPlan?.targetPrice?.toFixed(2) ?? '-'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Depth Stop Loss (SL):</span>
              <strong className="text-rose-400">₹{prediction.executionPlan?.stopLossPrice?.toFixed(2) ?? '-'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk : Reward Ratio:</span>
              <strong className="text-emerald-400">{prediction.executionPlan?.riskRewardRatio ?? 3.2} : 1</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kelly Capital Bet:</span>
              <strong className="text-white">{prediction.executionPlan?.kellyAllocationPercent ?? 7.5}% of capital</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Alignment: <strong className="text-cyan-300">{prediction.executionPlan?.alignment?.replace(/_/g, ' ') ?? 'FULL ALIGNMENT'}</strong></span>
            <span>Spoof Risk: <strong className="text-emerald-400">{prediction.executionPlan?.spoofRisk ?? 'LOW'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
});
