import React from 'react';
import {
  Eye,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  Bookmark,
  ShieldCheck,
} from 'lucide-react';
import { MarketStatusInfo } from '@marketeye/shared';

interface HeaderProps {
  marketStatus: MarketStatusInfo | null;
  isConnected: boolean;
  isConnecting: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  activeTab: 'scanner' | 'all-stocks';
  onTabChange: (tab: 'scanner' | 'all-stocks') => void;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  isConnected,
  isConnecting,
  soundEnabled,
  onToggleSound,
  unreadAlertsCount,
  onOpenAlerts,
  watchlistCount,
  onOpenWatchlist,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-market-buy to-emerald-700 shadow-lg shadow-emerald-950/50">
              <Eye className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MarketEye
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  NSE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                See the stocks that deserve your attention.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => onTabChange('scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Stocks Under Your Eyes
            </button>
            <button
              onClick={() => onTabChange('all-stocks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all-stocks'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Monitored Equities
            </button>
          </div>

          {/* Market Status, Feed Mode & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Feed Mode Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold">DEMO / MOCK DATA</span>
            </div>

            {/* Market Session & Time */}
            {marketStatus && (
              <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    marketStatus.status === 'OPEN'
                      ? 'bg-emerald-400 animate-pulse'
                      : marketStatus.status === 'PRE_OPEN'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-slate-200 font-medium">{marketStatus.statusLabel}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 flex items-center space-x-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400 mr-1" />
                  {marketStatus.serverTimeIST}
                </span>
              </div>
            )}

            {/* WebSocket Status Indicator */}
            <div
              className="flex items-center space-x-1.5 text-xs px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
              title={
                isConnected
                  ? 'Real-time WebSocket Live'
                  : isConnecting
                  ? 'Reconnecting WebSocket...'
                  : 'WebSocket Disconnected'
              }
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isConnected
                    ? 'text-emerald-400 animate-pulse'
                    : isConnecting
                    ? 'text-amber-400 animate-spin'
                    : 'text-rose-500'
                }`}
              />
              <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
                {isConnected ? 'LIVE' : isConnecting ? 'SYNC' : 'OFFLINE'}
              </span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Alert chime enabled' : 'Alert chime muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={onOpenWatchlist}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              title="Open Watchlist"
            >
              <Bookmark className="w-4 h-4" />
              {watchlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* Alerts Center Toggle */}
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              title="Scanner Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white animate-bounce">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
