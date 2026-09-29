import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Trash2,
  ArrowUpRight,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { WatchlistItem, StockQuote } from '@marketeye/shared';

interface WatchlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  quotes: Map<string, StockQuote>;
  allStocks: StockQuote[];
  onSelectStock: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onAdd: (symbol: string) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  isOpen,
  onClose,
  watchlist,
  quotes,
  allStocks,
  onSelectStock,
  onRemove,
  onAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredAvailable = searchQuery
    ? allStocks.filter(
        (s) =>
          (s.symbol.includes(searchQuery.toUpperCase()) ||
            s.companyName.toUpperCase().includes(searchQuery.toUpperCase())) &&
          !watchlist.some((w) => w.symbol === s.symbol)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel-elevated bg-slate-950/95 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Your Watchlist</h3>
                  <p className="text-xs text-slate-400">
                    {watchlist.length} securities tracked
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Search Bar */}
            <div className="mt-4 relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search NSE stock to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Autocomplete Results */}
              {filteredAvailable.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-xl z-20">
                  {filteredAvailable.slice(0, 5).map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        onAdd(s.symbol);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/60 last:border-none transition-colors"
                    >
                      <div>
                        <span className="font-bold text-xs text-white font-mono">{s.symbol}</span>
                        <span className="text-[11px] text-slate-400 ml-2 line-clamp-1">
                          {s.companyName}
                        </span>
                      </div>
                      <Plus className="w-4 h-4 text-indigo-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Watchlist Items List */}
            <div className="mt-5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {watchlist.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Your watchlist is empty. Search above or click the bookmark icon on any surfaced stock.
                </div>
              ) : (
                watchlist.map((item) => {
                  const liveQuote = quotes.get(item.symbol) || item.quote;
                  const ltp = liveQuote?.ltp ?? 0;
                  const changePercent = liveQuote?.changePercent ?? 0;
                  const isPositive = changePercent >= 0;
                  const buyPct = liveQuote?.buyPercentage ?? 50;

                  return (
                    <div
                      key={item.symbol}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                    >
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => {
                          onSelectStock(item.symbol);
                          onClose();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Buy: {buyPct.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.companyName}</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-mono font-bold text-xs text-white">
                            ₹{ltp.toFixed(2)}
                          </div>
                          <div
                            className={`flex items-center justify-end text-[10px] font-mono font-bold ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            <span>{changePercent >= 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              onSelectStock(item.symbol);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Inspect details"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemove(item.symbol)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Watchlist changes are automatically persisted to the local store.
          </div>
        </div>
      </div>
    </div>
  );
};
