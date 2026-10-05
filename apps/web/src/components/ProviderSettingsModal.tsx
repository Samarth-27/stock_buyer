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
  Cloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ProviderInfo,
  switchProviderMode,
  angelOneLogin,
  getBackendBaseUrl,
  setCustomBackendUrl,
  testBackendConnection,
} from '../services/api.js';

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
  const [selectedMode, setSelectedMode] = useState<string>('angel');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [angelClientCode, setAngelClientCode] = useState('');
  const [angelPin, setAngelPin] = useState('');
  const [angelTotp, setAngelTotp] = useState('');
  const [showUpstoxGuide, setShowUpstoxGuide] = useState(true);
  const [showAngelGuide, setShowAngelGuide] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Render.com / Remote Cloud Backend State
  const [customBackendUrl, setCustomBackendUrlState] = useState(() => getBackendBaseUrl());
  const [isBackendCardOpen, setIsBackendCardOpen] = useState(() => {
    return !getBackendBaseUrl() && typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
  });
  const [testingBackend, setTestingBackend] = useState(false);
  const [backendFeedback, setBackendFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (providerInfo) {
      if (providerInfo.id === 'angel-feed') setSelectedMode('angel');
      else if (providerInfo.id === 'kite-connect') setSelectedMode('kite');
      else if (providerInfo.id === 'upstox-feed') setSelectedMode('upstox');
      else if (providerInfo.id === 'dhan-feed') setSelectedMode('dhan');
      else setSelectedMode('mock');
    }
  }, [providerInfo]);

  const isStaticDeployment =
    typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
  const hasRemoteBackend = Boolean(getBackendBaseUrl().trim());

  if (!isOpen) return null;

  const handleSaveBackend = async () => {
    try {
      setTestingBackend(true);
      setBackendFeedback(null);
      const url = customBackendUrl.trim();
      if (!url) {
        setCustomBackendUrl(null);
        setBackendFeedback({ ok: true, msg: 'Reset to local / default endpoint.' });
        onProviderChanged();
        return;
      }

      const res = await testBackendConnection(url);
      if (res.ok) {
        setCustomBackendUrl(url);
        setBackendFeedback({ ok: true, msg: res.message || 'Connected to Render cloud backend!' });
        setErrorMsg(null);
        onProviderChanged();
      } else {
        setBackendFeedback({ ok: false, msg: `Could not reach backend: ${res.message}` });
      }
    } finally {
      setTestingBackend(false);
    }
  };

  const handleAngelLogin = async () => {
    if (isStaticDeployment && !hasRemoteBackend) {
      setErrorMsg(
        'Live Broker Feeds require the MarketEye backend API. Please configure your Render.com cloud backend URL above, or run MarketEye locally via "npm run dev" at http://localhost:5173.'
      );
      setIsBackendCardOpen(true);
      return;
    }

    if (!angelClientCode.trim() || !angelPin.trim() || !angelTotp.trim() || !apiKey.trim()) {
      setErrorMsg(
        'Please fill in all 4 Angel One fields: Client Code, MPIN, 6-digit TOTP, and SmartAPI API Key.'
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await angelOneLogin({
        clientCode: angelClientCode.trim(),
        pin: angelPin.trim(),
        totp: angelTotp.trim(),
        apiKey: apiKey.trim(),
      });

      if (res.jwtToken) {
        setAccessToken(res.jwtToken);
      }

      if (res.connected) {
        setSuccessMsg(`Successfully connected to ${res.name}!`);
        onProviderChanged();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.statusMessage || 'Connected. Awaiting live market quote stream.');
        onProviderChanged();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Angel One login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (isStaticDeployment && !hasRemoteBackend && selectedMode !== 'mock') {
      setErrorMsg(
        'Live Broker Feeds require the MarketEye backend API. Please configure your Render.com cloud backend URL above, or run MarketEye locally via "npm run dev" at http://localhost:5173.'
      );
      setIsBackendCardOpen(true);
      return;
    }

    // If already connected to Angel One and no new token provided, simply close modal
    if (
      selectedMode === 'angel' &&
      !accessToken &&
      providerInfo?.id === 'angel-feed' &&
      providerInfo?.connected
    ) {
      onClose();
      return;
    }

    // Seamless UX: If user filled in 1-Click login credentials, execute 1-Click Angel login automatically!
    if (
      selectedMode === 'angel' &&
      !accessToken.trim() &&
      (angelClientCode.trim() || angelPin.trim() || angelTotp.trim())
    ) {
      await handleAngelLogin();
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await switchProviderMode({
        mode: selectedMode,
        apiKey: apiKey.trim(),
        accessToken: accessToken.trim(),
        clientId: (selectedMode === 'angel' ? angelClientCode : clientId).trim(),
      });

      if (res.connected) {
        setSuccessMsg(`Successfully connected to ${res.name}!`);
        onProviderChanged();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.statusMessage || 'Provider initialized. Awaiting market data feed.');
        onProviderChanged();
      }
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

        {/* Backend Server & Cloud (Render.com) Connection Card */}
        <div className="my-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Backend Server API</span>
                  {hasRemoteBackend ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      RENDER CLOUD
                    </span>
                  ) : isStaticDeployment ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      OFFLINE DEMO
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      LOCAL DEV (PORT 3001)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {hasRemoteBackend
                    ? customBackendUrl
                    : isStaticDeployment
                    ? 'Connect Render.com cloud backend to stream live Angel One & NSE feeds.'
                    : 'Running locally on http://localhost:3001'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBackendCardOpen(!isBackendCardOpen)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 transition-all"
            >
              <span>{isBackendCardOpen ? 'Hide' : 'Configure'}</span>
              {isBackendCardOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isBackendCardOpen && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 space-y-3">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Render.com / Cloud Backend URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://marketeye-api.onrender.com"
                  value={customBackendUrl}
                  onChange={(e) => setCustomBackendUrlState(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSaveBackend}
                  disabled={testingBackend}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {testingBackend ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <span>Test & Save</span>
                  )}
                </button>
              </div>

              {backendFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
                    backendFeedback.ok
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  }`}
                >
                  {backendFeedback.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{backendFeedback.msg}</span>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Deploy the MarketEye backend free on{' '}
                <a
                  href="https://render.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  <span>Render.com</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                using the included <code className="text-cyan-300 font-mono">render.yaml</code> Blueprint to stream 2,692 NSE live stocks directly to this dashboard.
              </p>
            </div>
          )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'angel', name: 'Angel One', tag: 'SmartAPI (Free)' },
              { id: 'upstox', name: 'Upstox API', tag: 'Live TBQ/TSQ' },
              { id: 'kite', name: 'Zerodha Kite', tag: 'Live L2 Depth' },
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
        {selectedMode === 'angel' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Angel One SmartAPI Configuration (100% Free)
              </span>
              <a
                href="https://smartapi.angelbroking.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"
              >
                <span>SmartAPI Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Step-by-Step Helper Box */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-indigo-300 flex items-center gap-1">
                  <span>How to Connect Your Angel One Account:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAngelGuide(!showAngelGuide)}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  {showAngelGuide ? 'Hide Steps' : 'Show Steps'}
                </button>
              </div>

              {showAngelGuide && (
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300/90 pl-1 mt-2">
                  <li>
                    Log in to{' '}
                    <a
                      href="https://smartapi.angelbroking.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline font-semibold"
                    >
                      smartapi.angelbroking.com
                    </a>{' '}
                    using your Angel One Demat account (It's 100% Free).
                  </li>
                  <li>
                    Click <strong>"Create App"</strong> &rarr; Select <strong>"Trading API"</strong> &rarr; Name: <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">MarketEye</code>.
                  </li>
                  <li>
                    Copy your generated <strong>API Key</strong>.
                  </li>
                  <li>
                    Use the <strong>1-Click Login below</strong> with your Client Code, PIN, and TOTP, or paste your session JWT token directly!
                  </li>
                </ol>
              )}
            </div>

            {/* 1-Click TOTP Login Section */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  ⚡ 1-Click Angel One Login (Recommended)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Auto JWT Authentication</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Angel Client Code</label>
                  <input
                    type="text"
                    placeholder="e.g. A123456"
                    value={angelClientCode}
                    onChange={(e) => setAngelClientCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">MPIN / Password</label>
                  <input
                    type="password"
                    placeholder="4-digit MPIN"
                    value={angelPin}
                    onChange={(e) => setAngelPin(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] text-slate-400">TOTP or Secret Key</label>
                  </div>
                  <input
                    type="text"
                    maxLength={64}
                    placeholder="6-digit TOTP or Secret Key"
                    value={angelTotp}
                    onChange={(e) => setAngelTotp(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    Enter fresh 6-digit code or your base32 TOTP secret.
                  </span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">SmartAPI API Key</label>
                  <input
                    type="text"
                    placeholder="e.g. your_api_key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAngelLogin}
                disabled={loading || !angelClientCode || !angelPin || !angelTotp || !apiKey}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Log In & Connect Angel One Live Feed</span>
              </button>
            </div>

            {/* Direct JWT Token Input */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 block">
                Or Paste Existing Angel One JWT Session Token:
              </label>
              <input
                type="password"
                placeholder="Paste active Angel One JWT Token (ey...)"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        )}

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
          <div className="space-y-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Upstox API v2/v3 Configuration
              </span>
              <a
                href="https://upstox.com/developer/apps/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"
              >
                <span>Upstox Developer Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Step-by-Step Helper Box */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-indigo-300 flex items-center gap-1">
                  <span>How to Get & Redeem Your Upstox Token:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowUpstoxGuide(!showUpstoxGuide)}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  {showUpstoxGuide ? 'Hide Steps' : 'Show Steps'}
                </button>
              </div>

              {showUpstoxGuide && (
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300/90 pl-1 mt-2">
                  <li>
                    Log in to{' '}
                    <a
                      href="https://upstox.com/developer/apps/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline font-semibold"
                    >
                      upstox.com/developer/apps/
                    </a>{' '}
                    using your Upstox mobile number & PIN.
                  </li>
                  <li>
                    Click <strong>"New App"</strong> (or click your existing app).
                    <div className="text-[10px] text-slate-400 ml-4 mt-0.5">
                      Set Redirect URL to: <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">http://localhost:3001/api/auth/upstox/callback</code>
                    </div>
                  </li>
                  <li>
                    Inside your app card, click <strong>"Generate Access Token"</strong> and verify with your mobile OTP.
                  </li>
                  <li>
                    Copy the generated <strong>Access Token</strong> (starts with <code className="text-amber-300 font-mono">eyJhbGciOi...</code>) and paste it below.
                  </li>
                </ol>
              )}
            </div>

            {/* Access Token Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Upstox Access Token (Bearer Token) <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono">Starts with &quot;eyJ...&quot;</span>
              </div>
              <textarea
                rows={3}
                placeholder="Paste the generated Upstox access token (eyJhbGciOi...)"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                ⚠️ <strong className="text-slate-300">Important:</strong> Do not paste your API Key or Secret here. The Access Token is a 300+ character JWT generated after 2FA login.
              </p>
            </div>

            {/* Optional API Key & Secret for 1-Click Login */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-400">
                Optional: 1-Click Browser Login (Automatic OAuth)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">API Key (Client ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 52c938b8..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">API Secret</label>
                  <input
                    type="password"
                    placeholder="e.g. ab38e..."
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {apiKey && apiSecret && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">Generate token automatically via browser:</span>
                  <a
                    href={`/api/auth/upstox/login?apiKey=${encodeURIComponent(apiKey)}&apiSecret=${encodeURIComponent(apiSecret)}`}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <span>1-Click Upstox Login</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
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
