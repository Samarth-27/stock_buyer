import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import { ProviderInfo, switchProviderMode } from '../services/api.js';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerInfo: ProviderInfo | null;
  onProviderChanged: () => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  providerInfo,
  onProviderChanged,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('kite');
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (providerInfo) {
      if (providerInfo.id === 'kite-connect') setSelectedMode('kite');
      else if (providerInfo.id === 'upstox-feed') setSelectedMode('upstox');
      else if (providerInfo.id === 'dhan-feed') setSelectedMode('dhan');
      else setSelectedMode('mock');
    }
  }, [providerInfo]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await switchProviderMode({
        mode: selectedMode,
        apiKey: apiKey.trim(),
        accessToken: accessToken.trim(),
        clientId: clientId.trim(),
      });

      if (res.connected) {
        setSuccessMsg(`Successfully connected to ${res.name}!`);
      } else {
        setErrorMsg(res.statusMessage || 'Provider initialized. Awaiting market data feed.');
      }

      onProviderChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl glass-panel-elevated rounded-3xl border border-slate-700/80 bg-slate-950/95 shadow-2xl p-6 sm:p-8 z-10"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Market Data Provider Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Switch between live licensed Indian broker feeds and 24/7 demo simulation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Feed Status Badge */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Active Provider
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{providerInfo?.name || 'Loading...'}</span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  providerInfo?.connected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {providerInfo?.connected ? 'CONNECTED (LIVE)' : 'AWAITING CREDENTIALS'}
              </span>
            </div>
            {providerInfo?.statusMessage && (
              <p className="text-[11px] text-slate-400 mt-1">{providerInfo.statusMessage}</p>
            )}
          </div>
        </div>

        {/* Provider Selector Options */}
        <div className="space-y-3 my-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Select Live Feed Source
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'kite', name: 'Zerodha Kite', tag: 'Live L2 Depth' },
              { id: 'upstox', name: 'Upstox API', tag: 'Live TBQ/TSQ' },
              { id: 'dhan', name: 'Dhan HQ', tag: 'Free Token' },
              { id: 'mock', name: 'Mock Feed', tag: '24/7 Simulator' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedMode(p.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedMode === p.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs font-mono">{p.name}</div>
                <div className="text-[10px] text-slate-500">{p.tag}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Credential Inputs for Selected Real Provider */}
        {selectedMode === 'kite' && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Zerodha Kite Connect Credentials
              </span>
              <a
                href="https://kite.trade/docs/connect/v3/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">API Key</label>
              <input
                type="text"
                placeholder="e.g. your_kite_api_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Access Token (Generated daily via Kite login)
              </label>
              <input
                type="password"
                placeholder="e.g. 32-character session access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {selectedMode === 'upstox' && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Upstox API Credentials
              </span>
              <a
                href="https://upstox.com/developer/api-documentation"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Upstox Access Token (Bearer Token)
              </label>
              <input
                type="password"
                placeholder="Paste your Upstox OAuth access token..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {selectedMode === 'dhan' && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Dhan HQ API Credentials
              </span>
              <a
                href="https://dhanhq.co/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Client ID</label>
              <input
                type="text"
                placeholder="e.g. 1000000001"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Personal Access Token</label>
              <input
                type="password"
                placeholder="Paste token from Dhan Web Settings -> Access Tokens..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

        {selectedMode === 'mock' && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Mock Simulation Mode (Offline Demo)
            </div>
            <p className="text-[11px] text-amber-400/90 leading-relaxed">
              No API keys required. Simulates 25 high-volume NSE equities with realistic 5-level order book
              fluctuations 24/7.
            </p>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{loading ? 'Connecting...' : 'Apply & Connect Feed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
