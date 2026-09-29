import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Check, Filter, Info } from 'lucide-react';
import { ScannerRuleConfig, DEFAULT_SCANNER_CONFIG } from '@marketeye/shared';

interface ScannerControlsProps {
  config: ScannerRuleConfig;
  onUpdateConfig: (newConfig: Partial<ScannerRuleConfig>) => Promise<void>;
  isUpdating: boolean;
}

export const ScannerControls: React.FC<ScannerControlsProps> = ({
  config,
  onUpdateConfig,
  isUpdating,
}) => {
  const [buyThreshold, setBuyThreshold] = useState<number>(config.buyThreshold);
  const [sellThreshold, setSellThreshold] = useState<number>(config.sellThreshold);
  const [minVolume, setMinVolume] = useState<number>(config.minVolume);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setBuyThreshold(config.buyThreshold);
    setSellThreshold(config.sellThreshold);
    setMinVolume(config.minVolume);
  }, [config]);

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

  const handleApply = async () => {
    await onUpdateConfig({
      buyThreshold,
      sellThreshold,
      minVolume,
    });
    setHasChanges(false);
  };

  const handleReset = async () => {
    setBuyThreshold(DEFAULT_SCANNER_CONFIG.buyThreshold);
    setSellThreshold(DEFAULT_SCANNER_CONFIG.sellThreshold);
    setMinVolume(DEFAULT_SCANNER_CONFIG.minVolume);
    await onUpdateConfig({
      buyThreshold: DEFAULT_SCANNER_CONFIG.buyThreshold,
      sellThreshold: DEFAULT_SCANNER_CONFIG.sellThreshold,
      minVolume: DEFAULT_SCANNER_CONFIG.minVolume,
    });
    setHasChanges(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 mb-6 transition-all shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Scanner Rule Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 normal-case">
                Order-Book Imbalance
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Surfaces securities when aggregate pending order quantities breach your thresholds.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={isUpdating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-50"
            title="Reset to 60/40 standard threshold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (60/40)</span>
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

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
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
          <div className="flex items-center space-x-2">
            {[10000, 50000, 100000, 250000].map((vol) => (
              <button
                key={vol}
                onClick={() => handleVolumeChange(vol)}
                className={`flex-1 py-1 rounded text-[11px] font-mono font-medium transition-all ${
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
      </div>

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
