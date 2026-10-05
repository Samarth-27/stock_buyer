import React from 'react';
import {
  Eye,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Bookmark,
  ShieldCheck,
  Settings2,
  Briefcase,
  RadioTower,
  Palette,
} from 'lucide-react';
import { MarketStatusInfo } from '@marketeye/shared';
import { useTheme } from '../context/ThemeContext.js';

interface HeaderProps {
  marketStatus: MarketStatusInfo | null;
  isConnected: boolean;
  isConnecting: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenProviderSettings: () => void;
  activeTab: 'scanner' | 'all-stocks' | 'portfolio';
  onTabChange: (tab: 'scanner' | 'all-stocks' | 'portfolio') => void;
  portfolioCount?: number;
  portfolioPnL?: number;
  isMockProvider: boolean;
  providerName: string;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  isConnected,
  isConnecting,
  soundEnabled,
  onToggleSound,
  notificationsEnabled,
  onToggleNotifications,
  unreadAlertsCount,
  onOpenAlerts,
  watchlistCount,
  onOpenWatchlist,
  onOpenProviderSettings,
  activeTab,
  onTabChange,
  portfolioCount = 0,
  portfolioPnL = 0,
  isMockProvider,
  providerName,
}) => {
  const { theme, toggleTheme } = useTheme();

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

          {/* Navigation Tabs (Desktop) */}
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
            <button
              onClick={() => onTabChange('portfolio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>My Portfolio</span>
              {portfolioCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    portfolioPnL >= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {portfolioCount}
                </span>
              )}
            </button>
          </div>

          {/* Market Status, Feed Mode & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Feed Mode Badge & Switcher */}
            <button
              onClick={onOpenProviderSettings}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                isMockProvider
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title={`Active Provider: ${providerName}. Click to configure broker credentials or switch data feed.`}
            >
              {isMockProvider ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <RadioTower className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              )}
              <span className="font-bold">
                {isMockProvider ? 'DEMO / MOCK' : providerName.replace(' (Live Production Feed)', '')}
              </span>
              <Settings2 className="w-3 h-3 text-slate-400 ml-1" />
            </button>

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

            {/* Theme Selector Toggle */}
            <div className="relative group">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg border transition-all flex items-center space-x-1.5 ${
                  theme === 'terminal'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                    : theme === 'emerald'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : theme === 'light'
                    ? 'bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-900 border-slate-800 text-indigo-400'
                }`}
                title={`Current Theme: ${
                  theme === 'terminal'
                    ? 'Bloomberg Terminal (OLED Black & Amber)'
                    : theme === 'midnight'
                    ? 'Midnight Slate'
                    : theme === 'light'
                    ? 'Clean Light'
                    : 'Cyber Emerald'
                }. Click to switch theme.`}
              >
                <Palette className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden xl:inline">
                  {theme === 'terminal' ? 'Bloomberg' : theme}
                </span>
              </button>
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

            {/* Notification Popups Toggle */}
            <button
              onClick={onToggleNotifications}
              className={`p-2 rounded-lg border transition-all ${
                notificationsEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={notificationsEnabled ? 'Screen notification popups enabled (Click to silence)' : 'Screen notification popups disabled / muted'}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
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

            {/* Alerts Center Drawer Toggle */}
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              title="View Alerts History"
            >
              <span className="text-xs font-semibold px-1 text-slate-400 hover:text-white">Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80">
          <button
            onClick={() => onTabChange('scanner')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scanner'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400'
            }`}
          >
            Stocks Under Eyes
          </button>
          <button
            onClick={() => onTabChange('all-stocks')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all-stocks'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400'
            }`}
          >
            All Equities
          </button>
          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Portfolio</span>
            {portfolioCount > 0 && (
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded-full text-indigo-300 font-bold">
                {portfolioCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
