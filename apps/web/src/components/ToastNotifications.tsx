import React, { useEffect, useState } from 'react';
import { Zap, X, ArrowUpRight } from 'lucide-react';
import { ScannerResult } from '@marketeye/shared';

interface ToastItem {
  id: string;
  result: ScannerResult;
}

interface ToastNotificationsProps {
  latestTrigger: ScannerResult | null;
  onSelectStock: (symbol: string) => void;
}

export const ToastNotifications: React.FC<ToastNotificationsProps> = ({
  latestTrigger,
  onSelectStock,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!latestTrigger) return;

    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, result: latestTrigger };

    setToasts((prev) => [newToast, ...prev.slice(0, 2)]); // Keep max 3 toasts

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);

    return () => clearTimeout(timer);
  }, [latestTrigger]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map(({ id, result }) => (
        <div
          key={id}
          className="pointer-events-auto glass-panel-elevated bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl animate-slideUp flex flex-col space-y-2 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 animate-pulse">
                <Zap className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                New Stock Under Eyes
              </span>
            </div>
            <button
              onClick={() => removeToast(id)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-extrabold text-base text-white font-mono">{result.symbol}</span>
              <span className="text-xs font-mono font-bold text-market-buy">
                Buy: {result.buyPercentage.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-market-sell">
                Sell: {result.sellPercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">{result.reason}</p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => {
                onSelectStock(result.symbol);
                removeToast(id);
              }}
              className="flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Inspect Stock</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
