import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Search,
  CheckCircle,
} from 'lucide-react';
import { StockQuote } from '@marketeye/shared';

interface AllStocksTableProps {
  stocks: StockQuote[];
  watchlistSymbols: Set<string>;
  surfacedSymbols: Set<string>;
  onSelectStock: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  buyThreshold: number;
}

export const AllStocksTable: React.FC<AllStocksTableProps> = ({
  stocks,
  watchlistSymbols,
  surfacedSymbols,
  onSelectStock,
  onToggleWatchlist,
  buyThreshold,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'buyPct' | 'change' | 'volume'>('buyPct');

  const filtered = stocks
    .filter(
      (s) =>
        s.symbol.includes(searchTerm.toUpperCase()) ||
        s.companyName.toUpperCase().includes(searchTerm.toUpperCase())
    )
    .sort((a, b) => {
      if (sortBy === 'buyPct') return b.buyPercentage - a.buyPercentage;
      if (sortBy === 'change') return b.changePercent - a.changePercent;
      return b.volume - a.volume;
    });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white">All Monitored Equities</h2>
          <p className="text-xs text-slate-400">
            Real-time quotes, order book balance, and liquidity for 25 high-volume NSE securities.
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
              <th className="py-3 px-3 text-right">Volume</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.map((stock) => {
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
    </div>
  );
};
