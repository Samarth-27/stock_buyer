import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockQuote } from '@marketeye/shared';

interface OhlcMetricsBarProps {
  ltp: number;
  change: number;
  changePercent: number;
  quote?: StockQuote;
}

export const OhlcMetricsBar: React.FC<OhlcMetricsBarProps> = React.memo(({
  ltp,
  change,
  changePercent,
  quote,
}) => {
  const isPositive = changePercent >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
      {/* LTP & Price Move */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 md:col-span-1">
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Last Traded Price
        </div>
        <div className="text-3xl font-black text-white font-mono mt-1">
          ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div
          className={`flex items-center space-x-1 text-xs font-mono font-bold mt-2 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>
            {change >= 0 ? `+₹${change.toFixed(2)}` : `-₹${Math.abs(change).toFixed(2)}`} (
            {changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`})
          </span>
        </div>
      </div>

      {/* OHLC Cards */}
      <div className="grid grid-cols-4 gap-2 md:col-span-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="text-center border-r border-slate-800/80 pr-2">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Open</span>
          <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
            ₹{quote?.open?.toFixed(2) ?? '-'}
          </div>
        </div>
        <div className="text-center border-r border-slate-800/80 pr-2">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">High</span>
          <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-1">
            ₹{quote?.high?.toFixed(2) ?? '-'}
          </div>
        </div>
        <div className="text-center border-r border-slate-800/80 pr-2">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Low</span>
          <div className="text-sm sm:text-base font-bold text-rose-400 font-mono mt-1">
            ₹{quote?.low?.toFixed(2) ?? '-'}
          </div>
        </div>
        <div className="text-center">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Prev. Close</span>
          <div className="text-sm sm:text-base font-bold text-slate-300 font-mono mt-1">
            ₹{quote?.previousClose?.toFixed(2) ?? '-'}
          </div>
        </div>
      </div>
    </div>
  );
});
