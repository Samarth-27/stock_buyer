import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { HistoricalCandle, ChartInterval, AIPrediction } from '@marketeye/shared';

interface PriceActionChartProps {
  history: HistoricalCandle[];
  loading: boolean;
  interval: ChartInterval;
  onIntervalChange: (interval: ChartInterval) => void;
  prediction?: AIPrediction;
}

export const PriceActionChart: React.FC<PriceActionChartProps> = React.memo(({
  history,
  loading,
  interval,
  onIntervalChange,
  prediction,
}) => {
  const [chartType, setChartType] = useState<'area' | 'candle'>('candle');
  const [hoveredCandle, setHoveredCandle] = useState<HistoricalCandle | null>(null);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Price Action Chart
            </h3>
          </div>

          {/* Interval Selectors */}
          <div className="flex items-center space-x-1">
            {(['1m', '5m', '15m', '1h', '1D'] as ChartInterval[]).map((int) => (
              <button
                key={int}
                onClick={() => onIntervalChange(int)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  interval === int
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-950'
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas Rendering */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
            Loading candlestick data...
          </div>
        ) : history.length > 0 ? (
          <div className="relative h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Compute bounds */}
              {(() => {
                const prices = history.flatMap((c) => [c.high, c.low]);
                const minPrice = Math.min(...prices) * 0.998;
                const maxPrice = Math.max(...prices) * 1.002;
                const priceRange = maxPrice - minPrice || 1;
                const candleWidth = 600 / history.length;

                // Area path points
                const areaPoints = history.map((c, i) => {
                  const x = i * candleWidth + candleWidth / 2;
                  const y = 220 - ((c.close - minPrice) / priceRange) * 200;
                  return `${x},${y}`;
                });
                const areaPath = `M 0,220 L ${areaPoints.join(' L ')} L 600,220 Z`;

                return (
                  <>
                    {/* Grid Lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeDasharray="4" />
                    <line x1="0" y1="110" x2="600" y2="110" stroke="#1e293b" strokeDasharray="4" />
                    <line x1="0" y1="170" x2="600" y2="170" stroke="#1e293b" strokeDasharray="4" />

                    {chartType === 'area' ? (
                      <>
                        <path d={areaPath} fill="url(#areaGradient)" />
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          points={areaPoints.join(' ')}
                        />
                      </>
                    ) : (
                      /* Candlesticks */
                      history.map((c, i) => {
                        const x = i * candleWidth + candleWidth / 2;
                        const highY = 220 - ((c.high - minPrice) / priceRange) * 200;
                        const lowY = 220 - ((c.low - minPrice) / priceRange) * 200;
                        const openY = 220 - ((c.open - minPrice) / priceRange) * 200;
                        const closeY = 220 - ((c.close - minPrice) / priceRange) * 200;
                        const isGreen = c.close >= c.open;
                        const candleBodyTop = Math.min(openY, closeY);
                        const candleBodyHeight = Math.max(2, Math.abs(closeY - openY));
                        const color = isGreen ? '#10b981' : '#f43f5e';

                        return (
                          <g
                            key={i}
                            onMouseEnter={() => setHoveredCandle(c)}
                            onMouseLeave={() => setHoveredCandle(null)}
                            className="cursor-crosshair"
                          >
                            {/* Wick */}
                            <line
                              x1={x}
                              y1={highY}
                              x2={x}
                              y2={lowY}
                              stroke={color}
                              strokeWidth="1.2"
                            />
                            {/* Body */}
                            <rect
                              x={x - candleWidth * 0.35}
                              y={candleBodyTop}
                              width={candleWidth * 0.7}
                              height={candleBodyHeight}
                              fill={color}
                              rx="1"
                            />
                          </g>
                        );
                      })
                    )}

                    {/* Indicator Overlay: VWAP Line */}
                    {prediction?.chartAnalysis?.vwap && (() => {
                      const vwap = prediction.chartAnalysis.vwap;
                      if (vwap >= minPrice && vwap <= maxPrice) {
                        const vwapY = 220 - ((vwap - minPrice) / priceRange) * 200;
                        return (
                          <g>
                            <line
                              x1="0"
                              y1={vwapY}
                              x2="600"
                              y2={vwapY}
                              stroke="#c084fc"
                              strokeWidth="1.2"
                              strokeDasharray="4 3"
                            />
                            <text
                              x="8"
                              y={Math.max(12, vwapY - 4)}
                              fill="#c084fc"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              VWAP ₹{vwap.toFixed(1)}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Target Price Overlay Line */}
                    {prediction?.executionPlan?.targetPrice && (() => {
                      const tp = prediction.executionPlan.targetPrice;
                      if (tp >= minPrice && tp <= maxPrice) {
                        const tpY = 220 - ((tp - minPrice) / priceRange) * 200;
                        return (
                          <g>
                            <line
                              x1="0"
                              y1={tpY}
                              x2="600"
                              y2={tpY}
                              stroke="#06b6d4"
                              strokeWidth="1.2"
                              strokeDasharray="5 2"
                            />
                            <text
                              x="480"
                              y={Math.max(12, tpY - 4)}
                              fill="#06b6d4"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              TARGET ₹{tp.toFixed(1)}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Stop Loss Overlay Line */}
                    {prediction?.executionPlan?.stopLossPrice && (() => {
                      const sl = prediction.executionPlan.stopLossPrice;
                      if (sl >= minPrice && sl <= maxPrice) {
                        const slY = 220 - ((sl - minPrice) / priceRange) * 200;
                        return (
                          <g>
                            <line
                              x1="0"
                              y1={slY}
                              x2="600"
                              y2={slY}
                              stroke="#f43f5e"
                              strokeWidth="1.2"
                              strokeDasharray="5 2"
                            />
                            <text
                              x="480"
                              y={Math.min(235, slY + 11)}
                              fill="#f43f5e"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              STOP LOSS ₹{sl.toFixed(1)}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
            No historical data available
          </div>
        )}

        {/* Hover / Candle Stats Bar */}
        <div className="mt-2 h-6 flex items-center justify-between text-[11px] font-mono text-slate-400">
          {hoveredCandle ? (
            <>
              <span>O: ₹{hoveredCandle.open.toFixed(2)}</span>
              <span>H: ₹{hoveredCandle.high.toFixed(2)}</span>
              <span>L: ₹{hoveredCandle.low.toFixed(2)}</span>
              <span>C: ₹{hoveredCandle.close.toFixed(2)}</span>
              <span>Vol: {hoveredCandle.volume.toLocaleString('en-IN')}</span>
            </>
          ) : (
            <span className="text-slate-500">Hover over any candle to inspect OHLC metrics</span>
          )}
        </div>
      </div>

      {/* Chart Footer Controls */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType('candle')}
            className={`px-2 py-1 rounded text-xs font-medium ${
              chartType === 'candle'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Candlestick
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-2 py-1 rounded text-xs font-medium ${
              chartType === 'area'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Area
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          DATA SOURCE: LIVE TICK FEED
        </div>
      </div>

      {/* Live Chart Technical Indicators Strip */}
      {prediction?.chartAnalysis && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">RSI (14):</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  prediction.chartAnalysis.rsiStatus === 'BULLISH_MOMENTUM'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : prediction.chartAnalysis.rsiStatus === 'OVERSOLD'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : prediction.chartAnalysis.rsiStatus === 'OVERBOUGHT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {prediction.chartAnalysis.rsi14} ({prediction.chartAnalysis.rsiStatus.replace(/_/g, ' ')})
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Trend:</span>
              <span
                className={`font-bold ${
                  prediction.chartAnalysis.trend.includes('UPTREND')
                    ? 'text-emerald-400'
                    : prediction.chartAnalysis.trend.includes('DOWNTREND')
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {prediction.chartAnalysis.trend.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">VWAP:</span>
              <span
                className={`font-bold ${
                  prediction.chartAnalysis.priceVsVwapPercent >= 0 ? 'text-purple-400' : 'text-slate-400'
                }`}
              >
                ₹{prediction.chartAnalysis.vwap.toFixed(1)} ({prediction.chartAnalysis.priceVsVwapPercent >= 0 ? `+${prediction.chartAnalysis.priceVsVwapPercent}%` : `${prediction.chartAnalysis.priceVsVwapPercent}%`})
              </span>
            </div>

            {prediction.chartAnalysis.candlestickPattern !== 'NONE' && (
              <div className="hidden sm:flex items-center space-x-1.5">
                <span className="text-slate-400">Pattern:</span>
                <span className="text-amber-300 font-bold">
                  {prediction.chartAnalysis.candlestickPattern.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Tech Score:</span>
              <span className="text-emerald-400 font-black">{prediction.chartAnalysis.technicalScore}/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
