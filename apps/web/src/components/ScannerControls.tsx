import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Filter, Info, Sparkles, TrendingUp, Compass, Target, SlidersHorizontal, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { ScannerRuleConfig, DEFAULT_SCANNER_CONFIG, SWING_STRATEGY_PRESETS, SwingStrategyPreset } from '@marketeye/shared';

interface ScannerControlsProps {
  config: ScannerRuleConfig;
  onUpdateConfig: (newConfig: Partial<ScannerRuleConfig>) => Promise<void>;
  isUpdating: boolean;
  onTurboRescan?: () => Promise<void>;
  isTurboScanning?: boolean;
  lastScanLatencyMs?: number | null;
}

export const ScannerControls: React.FC<ScannerControlsProps> = ({
  config,
  onUpdateConfig,
  isUpdating,
  onTurboRescan,
  isTurboScanning = false,
  lastScanLatencyMs = null,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(config.strategyPreset || 'SWING_BREAKOUT');
  const [buyThreshold, setBuyThreshold] = useState<number>(config.buyThreshold);
  const [sellThreshold, setSellThreshold] = useState<number>(config.sellThreshold);
  const [minVolume, setMinVolume] = useState<number>(config.minVolume);
  const [requireAiJump, setRequireAiJump] = useState<boolean>(config.requireAiJump ?? false);
  const [minAiConfidence, setMinAiConfidence] = useState<number>(config.minAiConfidence ?? 60);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setSelectedPreset(config.strategyPreset || 'SWING_BREAKOUT');
    setBuyThreshold(config.buyThreshold);
    setSellThreshold(config.sellThreshold);
    setMinVolume(config.minVolume);
    setRequireAiJump(config.requireAiJump ?? false);
    setMinAiConfidence(config.minAiConfidence ?? 60);
  }, [config]);

  const handleSelectPreset = async (preset: SwingStrategyPreset) => {
    setSelectedPreset(preset.strategyPreset);
    setBuyThreshold(preset.buyThreshold);
    setSellThreshold(preset.sellThreshold);
    setMinVolume(preset.minVolume);
    setHasChanges(false);
    await onUpdateConfig({
      name: preset.name,
      strategyPreset: preset.strategyPreset,
      buyThreshold: preset.buyThreshold,
      sellThreshold: preset.sellThreshold,
      minVolume: preset.minVolume,
    });
  };

  const handleBuyChange = (val: number) => {
    setBuyThreshold(val);
    setHasChanges(true);
  };

  const handleSellChange = (val: number) => {
    setSellThreshold(val);
    setHasChanges(true);
  };

  const handleVolumeChange = (val: number) => {
    setMinVolume(val);
    setHasChanges(true);
  };

  const handleAiJumpToggle = (val: boolean) => {
    setRequireAiJump(val);
    setHasChanges(true);
  };

  const handleAiConfChange = (val: number) => {
    setMinAiConfidence(val);
    setHasChanges(true);
  };

  const handleApply = async () => {
    await onUpdateConfig({
      strategyPreset: selectedPreset as any,
      buyThreshold,
      sellThreshold,
      minVolume,
      requireAiJump,
      minAiConfidence,
    });
    setHasChanges(false);
  };

  const handleReset = async () => {
    setBuyThreshold(DEFAULT_SCANNER_CONFIG.buyThreshold);
    setSellThreshold(DEFAULT_SCANNER_CONFIG.sellThreshold);
    setMinVolume(DEFAULT_SCANNER_CONFIG.minVolume);
    setRequireAiJump(DEFAULT_SCANNER_CONFIG.requireAiJump ?? false);
    setMinAiConfidence(DEFAULT_SCANNER_CONFIG.minAiConfidence ?? 60);
    setSelectedPreset(DEFAULT_SCANNER_CONFIG.strategyPreset || 'SWING_BREAKOUT');
    await onUpdateConfig({
      name: DEFAULT_SCANNER_CONFIG.name,
      strategyPreset: DEFAULT_SCANNER_CONFIG.strategyPreset,
      buyThreshold: DEFAULT_SCANNER_CONFIG.buyThreshold,
      sellThreshold: DEFAULT_SCANNER_CONFIG.sellThreshold,
      minVolume: DEFAULT_SCANNER_CONFIG.minVolume,
      requireAiJump: DEFAULT_SCANNER_CONFIG.requireAiJump ?? false,
      minAiConfidence: DEFAULT_SCANNER_CONFIG.minAiConfidence ?? 60,
    });
    setHasChanges(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 mb-6 transition-all shadow-xl space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Swing Trading Scanner Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 normal-case flex items-center gap-1 font-bold">
                <Target className="w-3 h-3" />
                Multi-Day Holding (3–15 Days)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Scans 25 high-volume NSE equities for multi-day breakout structures, 20 EMA trend support, and institutional volume accumulation.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {onTurboRescan && (
            <button
              onClick={onTurboRescan}
              disabled={isTurboScanning}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 hover:from-amber-300 hover:to-emerald-300 text-slate-950 shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
              title="Instantly re-evaluate all stocks across Minervini, VCP, and Order Book models in under 20ms"
            >
              <Zap className={`w-3.5 h-3.5 ${isTurboScanning ? 'animate-bounce' : 'fill-slate-950'}`} />
              <span>{isTurboScanning ? 'Scanning...' : 'Turbo Rescan'}</span>
              {lastScanLatencyMs !== null && !isTurboScanning && (
                <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-950/20 text-slate-950 font-black">
                  {lastScanLatencyMs}ms
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={isUpdating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-50"
            title="Reset to default swing settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleApply}
            disabled={!hasChanges || isUpdating}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              hasChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isUpdating ? 'Applying...' : 'Apply Filters'}</span>
          </button>
        </div>
      </div>

      {/* Swing Strategy Preset Tabs */}
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          Select Swing Trading Strategy Preset:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {SWING_STRATEGY_PRESETS.map((p) => {
            const isSelected = selectedPreset === p.strategyPreset;
            const isSniper = p.strategyPreset === 'INSTITUTIONAL_SNIPER';
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                  isSelected
                    ? isSniper
                      ? 'bg-gradient-to-br from-amber-500/25 via-purple-500/20 to-slate-900 border-amber-400 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : isSniper
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 text-amber-200'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {isSelected && (
                  <div className={`absolute top-0 right-0 w-2 h-2 rounded-bl ${isSniper ? 'bg-amber-400' : 'bg-indigo-500'}`} />
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-xs font-mono transition-colors flex items-center gap-1 ${
                    isSniper ? 'text-amber-300 group-hover:text-amber-200' : 'text-white group-hover:text-indigo-400'
                  }`}>
                    {isSniper && <span>⭐</span>}
                    {p.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                    isSniper
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}>
                    {p.targetExpectation}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {p.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/80 font-mono">
                  <span>⏱️ {p.holdingHorizon}</span>
                  <span>Buy ≥ {p.buyThreshold}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Customization Accordion Toggle */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-indigo-300 transition-colors py-1 group"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-90 transition-transform" />
          <span>{showAdvanced ? 'Hide Custom Thresholds & AI Sliders' : 'Customize Thresholds & AI Filters'}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Buy ≥ {buyThreshold.toFixed(0)}% | Sell ≤ {sellThreshold.toFixed(0)}% | Vol ≥ {minVolume.toLocaleString('en-IN')}
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-500" />}
        </button>

        <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
          💡 Clicking any preset automatically optimizes these parameters
        </span>
      </div>

      {/* Interactive Controls Grid (Collapsible) */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-3 border-t border-slate-800/50 animate-fadeIn">
        {/* Buy Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-market-buy" />
              Min. Buy Quantity %
            </span>
            <span className="font-mono font-bold text-market-buy text-sm px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              ≥ {buyThreshold.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="90"
            step="1"
            value={buyThreshold}
            onChange={(e) => handleBuyChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-market-buy"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>50% (Neutral)</span>
            <span>60% (Default)</span>
            <span>75% (Extreme)</span>
            <span>90%</span>
          </div>
        </div>

        {/* Sell Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-market-sell" />
              Max. Sell Quantity %
            </span>
            <span className="font-mono font-bold text-market-sell text-sm px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              ≤ {sellThreshold.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="1"
            value={sellThreshold}
            onChange={(e) => handleSellChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-market-sell"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>10% (Ultra low)</span>
            <span>25%</span>
            <span>40% (Default)</span>
            <span>50%</span>
          </div>
        </div>

        {/* Minimum Volume Filter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              Minimum Volume (Shares)
            </span>
            <span className="font-mono font-bold text-indigo-300 text-sm px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {minVolume.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            {[10000, 50000, 100000, 250000].map((vol) => (
              <button
                key={vol}
                onClick={() => handleVolumeChange(vol)}
                className={`flex-1 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                  minVolume === vol
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {vol >= 100000 ? `${vol / 100000}L` : `${vol / 1000}k`}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            Filters out low-liquidity securities with erratic order books.
          </p>
        </div>

        {/* AI Prediction Filter Card */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Require AI 'JUMP'
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireAiJump}
                onChange={(e) => handleAiJumpToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          <div className="pt-0.5">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Min. Confidence</span>
              <span className={`font-mono font-bold text-xs ${requireAiJump ? 'text-cyan-300' : 'text-slate-500'}`}>
                ≥ {minAiConfidence}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              disabled={!requireAiJump}
              value={minAiConfidence}
              onChange={(e) => handleAiConfChange(parseInt(e.target.value, 10))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                requireAiJump
                  ? 'bg-slate-800 accent-cyan-400'
                  : 'bg-slate-900 accent-slate-700 opacity-40 cursor-not-allowed'
              }`}
            />
          </div>

          <p className="text-[10px] text-slate-500 leading-tight">
            {requireAiJump
              ? 'Only alerts when Micro-Price & 5-level depth model confirm a breakout.'
              : 'Off: Surfaces all stocks meeting order quantity thresholds.'}
          </p>
        </div>
      </div>
      )}

      {/* Active Rule Formulation Banner */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-slate-400">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Active Rule Logic:</strong> Stock qualifies when{' '}
            <span className="text-market-buy font-mono font-semibold">
              Buy Quantity % ≥ {config.buyThreshold.toFixed(1)}%
            </span>{' '}
            and{' '}
            <span className="text-market-sell font-mono font-semibold">
              Sell Quantity % ≤ {config.sellThreshold.toFixed(1)}%
            </span>
            {config.requireAiJump && (
              <>
                {' '}and{' '}
                <span className="text-cyan-400 font-mono font-semibold">
                  AI Confirms JUMP (≥ {config.minAiConfidence ?? 60}%)
                </span>
              </>
            )}
            .
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Last updated: {new Date(config.updatedAt).toLocaleTimeString('en-IN')}
        </div>
      </div>
    </div>
  );
};
