import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Briefcase,
  Search,
  TrendingUp,
  TrendingDown,
  PlusCircle,
} from 'lucide-react';
import {
  PortfolioHolding,
  StockQuote,
  MONITORED_NSE_STOCKS,
  ALL_NSE_STOCKS,
  calculateSwingTradePlan,
} from '@marketeye/shared';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holding: Omit<PortfolioHolding, 'id'> & { id?: string }) => void;
  quotesMap: Map<string, StockQuote>;
  initialSymbol?: string;
  initialPrice?: number;
  initialQuantity?: number;
  editingHolding?: PortfolioHolding | null;
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quotesMap,
  initialSymbol = '',
  initialPrice,
  initialQuantity,
  editingHolding,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol || 'RELIANCE');
  const [searchFilter, setSearchFilter] = useState('');
  const [buyPrice, setBuyPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [buyDate, setBuyDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);

  // Sync ONLY when modal opens or when editingHolding / initialSymbol changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingHolding) {
      setSymbol(editingHolding.symbol);
      setBuyPrice(editingHolding.buyPrice);
      setQuantity(editingHolding.quantity);
      setBuyDate(editingHolding.buyDate || new Date().toISOString().split('T')[0]);
      setNotes(editingHolding.notes || '');
    } else if (initialSymbol) {
      setSymbol(initialSymbol);
      const q = quotesMap.get(initialSymbol.toUpperCase());
      const p = initialPrice !== undefined ? initialPrice : (q?.ltp || 100);
      setBuyPrice(p);
      setQuantity(initialQuantity || 10);
      setBuyDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    } else {
      const defaultSym = 'RELIANCE';
      setSymbol(defaultSym);
      const q = quotesMap.get(defaultSym);
      setBuyPrice(q?.ltp || 3000);
      setQuantity(10);
      setBuyDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen, editingHolding, initialSymbol, initialPrice, initialQuantity]);

  // Selected Stock Details
  const selectedQuote = useMemo(() => {
    return quotesMap.get(symbol.toUpperCase());
  }, [symbol, quotesMap]);

  // Lookup official company name across master universe
  const resolvedCompanyName = useMemo(() => {
    if (selectedQuote?.companyName) return selectedQuote.companyName;
    const match = ALL_NSE_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
    if (match?.companyName) return match.companyName;
    const mon = MONITORED_NSE_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
    if (mon?.companyName) return mon.companyName;
    return symbol.toUpperCase();
  }, [selectedQuote, symbol]);

  // Model swing plan for the selected stock
  const swingPlan = useMemo(() => {
    if (!selectedQuote) return undefined;
    return selectedQuote.swingPlan || calculateSwingTradePlan(selectedQuote);
  }, [selectedQuote]);

  const twoDayDecision = swingPlan?.twoDayDecision;

  // Filtered stocks for autocomplete across all 2,692 NSE stocks
  const filteredStocks = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) {
      // Default to the top benchmark monitored stocks first, then other NSE stocks
      return MONITORED_NSE_STOCKS.slice(0, 15).map((s) => ({
        symbol: s.symbol,
        companyName: s.companyName,
      }));
    }
    // Search across ALL_NSE_STOCKS (all ~2,692 listed NSE equities)
    const matches: { symbol: string; companyName: string }[] = [];
    for (const s of ALL_NSE_STOCKS) {
      if (
        s.symbol.toLowerCase().includes(q) ||
        (s.companyName && s.companyName.toLowerCase().includes(q))
      ) {
        matches.push(s);
        if (matches.length >= 30) break;
      }
    }
    return matches;
  }, [searchFilter]);

  const handleSelectSymbol = (newSymbol: string) => {
    const cleanSym = newSymbol.trim().toUpperCase();
    setSymbol(cleanSym);
    setShowSymbolDropdown(false);
    setSearchFilter('');
    const q = quotesMap.get(cleanSym);
    if (q) {
      setBuyPrice(q.ltp);
    } else {
      const mon = MONITORED_NSE_STOCKS.find((s) => s.symbol === cleanSym);
      if (mon?.basePrice) {
        setBuyPrice(mon.basePrice);
      }
    }
  };

  const handleQuickTag = (tag: string) => {
    setNotes((prev) => (prev ? `${prev} | ${tag}` : tag));
  };

  // Calculations
  const numPrice = typeof buyPrice === 'number' ? buyPrice : 0;
  const numQty = typeof quantity === 'number' ? quantity : 0;
  const investedAmount = Number((numPrice * numQty).toFixed(2));
  const currentLtp = selectedQuote?.ltp || numPrice;
  const currentValue = Number((currentLtp * numQty).toFixed(2));
  const diff = Number((currentValue - investedAmount).toFixed(2));
  const diffPercent =
    investedAmount > 0 ? Number(((diff / investedAmount) * 100).toFixed(2)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || numPrice <= 0 || numQty <= 0) return;

    onSave({
      id: editingHolding ? editingHolding.id : undefined,
      symbol: symbol.toUpperCase(),
      companyName: resolvedCompanyName,
      buyPrice: numPrice,
      quantity: numQty,
      buyDate: buyDate || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/40 p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingHolding ? 'Edit Holding' : 'Add Share to Portfolio'}
              </h2>
              <p className="text-xs text-slate-400">
                Track real holdings & let our quantitative model guide your multi-day exits & pyramiding.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Symbol Selector */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Stock / Equity (NSE)
            </label>
            <div className="relative">
              <div
                onClick={() => !editingHolding && setShowSymbolDropdown(!showSymbolDropdown)}
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer ${
                  editingHolding ? 'opacity-80 cursor-not-allowed' : 'hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-emerald-400 text-sm">{symbol}</span>
                  <span className="text-xs text-slate-400 truncate max-w-[240px]">
                    {resolvedCompanyName}
                  </span>
                </div>
                {!editingHolding && (
                  <span className="text-xs text-slate-400 font-mono">
                    LTP: ₹{currentLtp.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ▼
                  </span>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showSymbolDropdown && !editingHolding && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl p-2 max-h-72 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search across all 2,692 NSE stocks (e.g. TATA, ZOMATO, SBIN)..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 px-2 py-0.5 mb-1 font-mono flex justify-between">
                    <span>MATCHING NSE EQUITIES</span>
                    <span>{filteredStocks.length} shown of 2,692</span>
                  </div>
                  <div className="space-y-1">
                    {filteredStocks.map((s) => {
                      const q = quotesMap.get(s.symbol);
                      return (
                        <div
                          key={s.symbol}
                          onClick={() => handleSelectSymbol(s.symbol)}
                          className="px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono font-bold text-white mr-2">{s.symbol}</span>
                            <span className="text-slate-400 text-[11px] truncate">{s.companyName}</span>
                          </div>
                          {q && (
                            <span className="font-mono text-emerald-400 font-bold shrink-0">
                              ₹{q.ltp.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {filteredStocks.length === 0 && searchFilter.trim() && (
                      <div
                        onClick={() => handleSelectSymbol(searchFilter.trim().toUpperCase())}
                        className="px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/50 cursor-pointer text-xs text-indigo-300 flex items-center justify-between"
                      >
                        <span>Use custom ticker <strong>{searchFilter.trim().toUpperCase()}</strong></span>
                        <span className="text-[10px] uppercase font-bold text-indigo-400">Select</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buy Price & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Buy / Entry Price (₹)
                </label>
                {selectedQuote && (
                  <button
                    type="button"
                    onClick={() => setBuyPrice(selectedQuote.ltp)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline"
                  >
                    Use LTP (₹{selectedQuote.ltp.toFixed(2)})
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.05"
                min="0.05"
                required
                placeholder="e.g. 2950.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Quantity (Shares)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 25"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Buy Date & Quick Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase / Buy Date
              </label>
              <input
                type="date"
                required
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes / Trading Thesis
              </label>
              <input
                type="text"
                placeholder="e.g. 2-Day VCP Breakout, 20 EMA bounce"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Strategy Tag Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Quick Tags:</span>
            {['2-Day JEV Buy', '20 EMA Pullback', 'VCP Breakout', 'Minervini Stage 2'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTag(tag)}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 font-mono transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>

          {/* Dynamic Live Preview & Quantitative Model Insights */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Total Capital Invested:</span>
              <span className="text-white font-bold">
                ₹{investedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Current Market Value:</span>
              <span className="text-white font-bold">
                ₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Live P&L:</span>
              <span
                className={`font-black flex items-center gap-1 ${
                  diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {diff >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {diff >= 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`} (
                  {diff >= 0 ? `+${diffPercent}%` : `${diffPercent}%`})
                </span>
              </span>
            </div>

            {/* Model Setup Guide */}
            {twoDayDecision && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Model 2D Verdict:</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      twoDayDecision.verdict === 'CONVINCING_BUY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : twoDayDecision.verdict === 'WATCHLIST_PULLBACK'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {twoDayDecision.verdictLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recommended Target 1:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{twoDayDecision.target1Price.toFixed(2)} (+{twoDayDecision.target1Percent}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Invalidation Stop Loss:</span>
                  <span className="text-rose-400 font-bold">
                    ₹{twoDayDecision.invalidationStopPrice.toFixed(2)} (-{twoDayDecision.invalidationStopPercent}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numPrice <= 0 || numQty <= 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{editingHolding ? 'Update Holding' : 'Save to Portfolio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
