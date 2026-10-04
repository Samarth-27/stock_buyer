import React, { useEffect, useState } from 'react';
import { StockNewsItem } from '@marketeye/shared';
import { fetchStockNews } from '../../services/api.js';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';

interface StockNewsCardProps {
  symbol: string;
}

export const StockNewsCard: React.FC<StockNewsCardProps> = ({ symbol }) => {
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStockNews(symbol);
      setNews(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [symbol]);

  // Aggregate sentiment stats
  const bullishCount = news.filter((n) => n.sentiment === 'BULLISH').length;
  const bearishCount = news.filter((n) => n.sentiment === 'BEARISH').length;
  const neutralCount = news.filter((n) => n.sentiment === 'NEUTRAL').length;

  const overallSentiment =
    bullishCount > bearishCount
      ? 'BULLISH'
      : bearishCount > bullishCount
      ? 'BEARISH'
      : 'NEUTRAL';

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Financial News & Sentiment
            </h4>
            <p className="text-[10px] text-slate-400">
              NLP-analyzed headlines and breaking catalysts for {symbol}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
              overallSentiment === 'BULLISH'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : overallSentiment === 'BEARISH'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-700/40 text-slate-400 border border-slate-700'
            }`}
          >
            {overallSentiment === 'BULLISH' && <TrendingUp className="w-3 h-3" />}
            {overallSentiment === 'BEARISH' && <TrendingDown className="w-3 h-3" />}
            {overallSentiment === 'NEUTRAL' && <Minus className="w-3 h-3" />}
            <span>Net: {overallSentiment}</span>
          </span>

          <button
            onClick={loadNews}
            disabled={loading}
            title="Refresh News"
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sentiment Summary Bar */}
      {news.length > 0 && (
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
            <div className="text-[10px] text-emerald-400 font-semibold uppercase">Bullish Headwinds</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">{bullishCount} Articles</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Neutral Flow</div>
            <div className="text-sm font-bold text-slate-300 mt-0.5">{neutralCount} Articles</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
            <div className="text-[10px] text-rose-400 font-semibold uppercase">Bearish Pressures</div>
            <div className="text-sm font-bold text-rose-300 mt-0.5">{bearishCount} Articles</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && news.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Ingesting live news feed from financial press...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* News list */}
      {!loading && news.length === 0 && !error && (
        <div className="py-6 text-center text-xs text-slate-500">
          No breaking news found for {symbol} in the last 48 hours.
        </div>
      )}

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {news.map((item) => {
          const isBull = item.sentiment === 'BULLISH';
          const isBear = item.sentiment === 'BEARISH';
          const pubTime = new Date(item.pubDate).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-2 leading-relaxed">
                    {item.title}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span>{pubTime}</span>

                    {item.keywords && item.keywords.length > 0 && (
                      <span className="text-slate-500 italic">
                        Signals: {item.keywords.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      isBull
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isBear
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.sentiment}
                  </span>

                  {item.impact === 'HIGH' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HIGH IMPACT
                    </span>
                  )}

                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 mt-1" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
