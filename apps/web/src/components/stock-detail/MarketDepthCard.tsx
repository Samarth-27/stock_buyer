import React from 'react';
import { Layers } from 'lucide-react';
import { OrderBook } from '@marketeye/shared';

interface MarketDepthCardProps {
  orderBook: OrderBook | null;
  maxDepthQty: number;
  totalBuyQty: number;
  totalSellQty: number;
  buyPct: number;
  sellPct: number;
  imbalance: number;
}

export const MarketDepthCard: React.FC<MarketDepthCardProps> = React.memo(({
  orderBook,
  maxDepthQty,
  totalBuyQty,
  totalSellQty,
  buyPct,
  sellPct,
  imbalance,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            5-Level Market Depth
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          L2 Aggregate Orders
        </span>
      </div>

      {/* Depth Columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bid Side (Buyers) */}
        <div>
          <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase font-bold pb-2 border-b border-slate-800/80 font-mono">
            <span>Orders</span>
            <span className="text-right">Qty</span>
            <span className="text-right text-emerald-400">Bid (₹)</span>
          </div>
          <div className="space-y-1.5 mt-2">
            {orderBook?.bids.map((b, idx) => (
              <div
                key={`bid-${idx}`}
                className="relative grid grid-cols-3 text-xs font-mono py-1 px-1.5 rounded overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-emerald-500/10 -z-10 rounded transition-all"
                  style={{ width: `${(b.quantity / maxDepthQty) * 100}%` }}
                />
                <span className="text-slate-400">{b.orders}</span>
                <span className="text-right font-medium text-slate-200">
                  {b.quantity.toLocaleString('en-IN')}
                </span>
                <span className="text-right font-bold text-emerald-400">
                  {b.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ask Side (Sellers) */}
        <div>
          <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase font-bold pb-2 border-b border-slate-800/80 font-mono">
            <span className="text-rose-400">Ask (₹)</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Orders</span>
          </div>
          <div className="space-y-1.5 mt-2">
            {orderBook?.asks.map((a, idx) => (
              <div
                key={`ask-${idx}`}
                className="relative grid grid-cols-3 text-xs font-mono py-1 px-1.5 rounded overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-rose-500/10 -z-10 rounded transition-all right-0 left-auto"
                  style={{ width: `${(a.quantity / maxDepthQty) * 100}%` }}
                />
                <span className="font-bold text-rose-400">{a.price.toFixed(2)}</span>
                <span className="text-right font-medium text-slate-200">
                  {a.quantity.toLocaleString('en-IN')}
                </span>
                <span className="text-right text-slate-400">{a.orders}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Depth Totals & Ratio */}
      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <div>
            <span className="text-slate-500">Total Buy Qty:</span>{' '}
            <strong className="text-market-buy">{totalBuyQty.toLocaleString('en-IN')}</strong>{' '}
            <span className="text-emerald-400">({buyPct.toFixed(1)}%)</span>
          </div>
          <div>
            <span className="text-slate-500">Total Sell Qty:</span>{' '}
            <strong className="text-market-sell">{totalSellQty.toLocaleString('en-IN')}</strong>{' '}
            <span className="text-rose-400">({sellPct.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-market-buy transition-all duration-300"
            style={{ width: `${buyPct}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-market-sell to-rose-600 transition-all duration-300"
            style={{ width: `${sellPct}%` }}
          />
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
          <span>
            Order Book Imbalance:{' '}
            <strong
              className={
                imbalance > 0 ? 'text-emerald-400' : imbalance < 0 ? 'text-rose-400' : 'text-slate-400'
              }
            >
              {imbalance > 0 ? `+${(imbalance * 100).toFixed(1)}%` : `${(imbalance * 100).toFixed(1)}%`}
            </strong>
          </span>
          <span className="text-slate-500 font-mono">
            Feed Freshness: Live (0ms)
          </span>
        </div>
      </div>
    </div>
  );
});
