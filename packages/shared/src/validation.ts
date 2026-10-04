import { z } from 'zod';

export const ScannerConfigSchema = z.object({
  name: z.string().optional(),
  buyThreshold: z.number().min(50).max(95, { message: 'Buy threshold must be between 50% and 95%' }),
  sellThreshold: z.number().min(5).max(50, { message: 'Sell threshold must be between 5% and 50%' }),
  minVolume: z.number().min(0, { message: 'Minimum volume must be non-negative' }),
  strategyPreset: z.enum(['SWING_BREAKOUT', 'EMA20_PULLBACK', 'ACCUMULATION_SQUEEZE', 'ORDER_BOOK_PRESSURE', 'EPISODIC_PIVOT', 'INSTITUTIONAL_SNIPER']).optional(),
  swingMinTargetPercent: z.number().optional(),
  swingMinRiskReward: z.number().optional(),
  minPriceChange: z.number().optional(),
  maxPriceChange: z.number().optional(),
  requireAiJump: z.boolean().optional(),
  minAiConfidence: z.number().optional(),
  enabled: z.boolean().optional(),
});

export const WatchlistAddSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20).toUpperCase(),
  companyName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const ChartQuerySchema = z.object({
  interval: z.enum(['1m', '5m', '15m', '1h', '1D']).default('5m'),
  range: z.enum(['1d', '5d', '1mo', '1y']).default('1d'),
});
