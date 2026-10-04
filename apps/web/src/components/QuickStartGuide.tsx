import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Target, Scale, ShieldCheck } from 'lucide-react';

export const QuickStartGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem('marketeye_show_guide') !== 'false';
  });

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem('marketeye_show_guide', String(next));
  };

  return (
    <div className="mb-6 rounded-2xl glass-panel border border-indigo-500/30 overflow-hidden transition-all duration-300 shadow-lg">
      {/* Banner Header */}
      <div
        onClick={toggleOpen}
        className="px-5 py-3.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900/90 flex items-center justify-between cursor-pointer hover:bg-indigo-950/90 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                How to Swing Trade with MarketEye (3-Step Routine)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Beginner Friendly Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Follow this systematic institutional routine to maximize win rates and protect capital.
            </p>
          </div>
        </div>

        <button
          className="flex items-center space-x-1 text-xs text-indigo-300 hover:text-white px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition-all"
          title={isOpen ? 'Collapse guide' : 'Expand guide'}
        >
          <span>{isOpen ? 'Hide Guide' : 'Show Guide'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-5 bg-slate-950/60 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-indigo-400 font-mono font-bold mb-1">
                <span className="flex items-center gap-1.5 text-xs text-white">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-[11px]">1</span>
                  Select a Confluence Setup
                </span>
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click <strong>⭐ Institutional Sniper</strong> or <strong>Stage 2 Breakout</strong> in the presets below. Focus on setups tagged with <span className="text-amber-300 font-bold">Grade A+ (80%+)</span> where Minervini Trend, VCP, Order Book, and ML all agree.
              </p>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/60 font-mono">
              💡 <em>Eliminates 80% of losing trades by never trading in chop or downtrends.</em>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-emerald-400 font-mono font-bold mb-1">
                <span className="flex items-center gap-1.5 text-xs text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[11px]">2</span>
                  Check Entry & Size Position
                </span>
                <Scale className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Only buy when the stock trades within its designated <strong>Entry Price Range</strong>. Check the <strong>Kelly Position Sizing</strong> (e.g. 15% of your portfolio) to ensure your max risk is strictly capped at under 0.5% of capital.
              </p>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/60 font-mono">
              💼 <em>Quant position sizing eliminates drawdown risk and maximizes compound growth.</em>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-cyan-400 font-mono font-bold mb-1">
                <span className="flex items-center gap-1.5 text-xs text-white">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[11px]">3</span>
                  Execute Systematic Exits
                </span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sell <strong>33%–50%</strong> of shares at <strong>Target 1 (+8.5%)</strong> to lock in profit. Immediately move your stop loss to <strong>breakeven</strong>. Trail remaining shares on daily closes below the <strong>10 or 20 EMA</strong>!
              </p>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/60 font-mono">
              🏆 <em>The proven Kristjan Qullamaggie method for catching 50%+ multi-week runners.</em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
