import React from 'react';
import { Activity, Target, PieChart, ShieldAlert } from 'lucide-react';
import { StockQuote, ScannerResult } from '@marketeye/shared';

interface MarketBreadthProps {
  quotes: StockQuote[];
  surfacedCount: number;
  topStock?: ScannerResult;
}

export const MarketBreadth: React.FC<MarketBreadthProps> = ({
  quotes,
  surfacedCount,
  topStock,
}) => {
  const totalMonitored = quotes.length;

  const totalBuyQty = quotes.reduce((acc, q) => acc + q.totalBuyQuantity, 0);
  const totalSellQty = quotes.reduce((acc, q) => acc + q.totalSellQuantity, 0);
  const aggregateTotal = totalBuyQty + totalSellQty;
  const avgBuyPct = aggregateTotal > 0 ? (totalBuyQty / aggregateTotal) * 100 : 50;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Monitored Count */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Monitored Equities
          </div>
          <div className="text-xl font-black text-white font-mono">{totalMonitored} Stocks</div>
        </div>
      </div>

      {/* Surfaced Count */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Under Your Eyes
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {surfacedCount} Stocks
          </div>
        </div>
      </div>

      {/* Market Buy/Sell Imbalance */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <PieChart className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Market Aggregate Buy %
          </div>
          <div className="text-xl font-black text-cyan-300 font-mono">
            {avgBuyPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Top Buy Pressure */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Top Order Imbalance
          </div>
          <div className="text-xl font-black text-white font-mono truncate max-w-[120px]">
            {topStock ? `${topStock.symbol} (${topStock.buyPercentage}%)` : 'None'}
          </div>
        </div>
      </div>
    </div>
  );
};
