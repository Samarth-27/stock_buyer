import React from 'react';
import { X, Bell, Trash2, Zap, Clock } from 'lucide-react';
import { MarketAlert } from '@marketeye/shared';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: MarketAlert[];
  onClearAlerts: () => void;
  onSelectStock: (symbol: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAlerts,
  onSelectStock,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel-elevated bg-slate-950/95 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Scanner Alerts</h3>
                  <p className="text-xs text-slate-400">
                    Real-time notifications when securities breach thresholds
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

            {/* Alert List */}
            <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  No alerts recorded yet. When a stock qualifies under your configured rules, an alert will appear here.
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div
                    key={`${alert.id}-${idx}`}
                    onClick={() => {
                      onSelectStock(alert.symbol);
                      onClose();
                    }}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                          <Zap className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-sm text-white font-mono group-hover:text-emerald-400 transition-colors">
                          {alert.symbol}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(alert.timestamp).toLocaleTimeString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">{alerts.length} total alerts</span>
              <button
                onClick={onClearAlerts}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
