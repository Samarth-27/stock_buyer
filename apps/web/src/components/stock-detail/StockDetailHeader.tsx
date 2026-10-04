import React from 'react';
import { X, Bookmark, BookmarkCheck, ShieldCheck } from 'lucide-react';

interface StockDetailHeaderProps {
  symbol: string;
  companyName?: string;
  isWatched: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onClose: () => void;
}

export const StockDetailHeader: React.FC<StockDetailHeaderProps> = React.memo(({
  symbol,
  companyName,
  isWatched,
  onToggleWatchlist,
  onClose,
}) => {
  return (
    <div className="flex items-start justify-between pb-6 border-b border-slate-800">
      <div>
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {symbol}
          </h2>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            NSE EQUITIES
          </span>
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>LIVE STREAM FEED</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-1">{companyName || symbol}</p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleWatchlist(symbol)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isWatched
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {isWatched ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          <span className="hidden sm:inline">{isWatched ? 'Watched' : 'Add to Watchlist'}</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});
