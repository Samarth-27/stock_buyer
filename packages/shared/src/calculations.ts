export interface BuySellPercentages {
  totalQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  isValid: boolean;
  reason?: string;
}

/**
 * Calculates buy and sell percentages based on aggregate order book quantities.
 *
 * Formula:
 *   totalQuantity = totalBuyQuantity + totalSellQuantity
 *   buyPercentage = (totalBuyQuantity / totalQuantity) * 100
 *   sellPercentage = (totalSellQuantity / totalQuantity) * 100
 *
 * Edge cases handled:
 * - Negative inputs -> sanitized to 0
 * - Zero total quantity -> 0% buy, 0% sell, flagged as invalid
 * - Floating point rounding precision capped at 2 decimal places
 */
export function calculateBuySellPercentages(
  totalBuyQuantity: number,
  totalSellQuantity: number
): BuySellPercentages {
  // Guard against non-numeric or NaN values
  if (
    typeof totalBuyQuantity !== 'number' ||
    typeof totalSellQuantity !== 'number' ||
    isNaN(totalBuyQuantity) ||
    isNaN(totalSellQuantity)
  ) {
    return {
      totalQuantity: 0,
      buyPercentage: 0,
      sellPercentage: 0,
      isValid: false,
      reason: 'Invalid or non-numeric order quantities provided',
    };
  }

  // Sanitize negative quantities
  const safeBuy = Math.max(0, totalBuyQuantity);
  const safeSell = Math.max(0, totalSellQuantity);
  const totalQuantity = safeBuy + safeSell;

  if (totalQuantity === 0) {
    return {
      totalQuantity: 0,
      buyPercentage: 0,
      sellPercentage: 0,
      isValid: false,
      reason: 'No open buy or sell orders in order book',
    };
  }

  const rawBuyPct = (safeBuy / totalQuantity) * 100;

  // Round to 2 decimal places with mathematical precision
  const buyPercentage = Number(rawBuyPct.toFixed(2));
  // Guarantee buyPercentage + sellPercentage sum to exactly 100.00%
  const sellPercentage = Number((100 - buyPercentage).toFixed(2));

  return {
    totalQuantity,
    buyPercentage,
    sellPercentage,
    isValid: true,
  };
}

/**
 * Calculates the order book imbalance ratio.
 * Range: [-1.0, 1.0]
 * +1.0 indicates 100% buy orders, -1.0 indicates 100% sell orders, 0.0 is perfectly balanced.
 */
export function calculateOrderBookImbalance(
  totalBuyQuantity: number,
  totalSellQuantity: number
): number {
  const safeBuy = Math.max(0, totalBuyQuantity || 0);
  const safeSell = Math.max(0, totalSellQuantity || 0);
  const total = safeBuy + safeSell;

  if (total === 0) return 0;
  return Number(((safeBuy - safeSell) / total).toFixed(4));
}

export interface RuleEvaluationResult {
  matches: boolean;
  buyPercentage: number;
  sellPercentage: number;
  reason: string;
}

/**
 * Evaluates whether a stock meets the Buy Pressure scanner rule:
 * Buy % >= buyThreshold AND Sell % <= sellThreshold AND Volume >= minVolume
 */
export function evaluateBuyPressure(
  buyPercentage: number,
  sellPercentage: number,
  buyThreshold: number = 60.0,
  sellThreshold: number = 40.0,
  volume: number = 0,
  minVolume: number = 0,
  changePercent?: number,
  minPriceChange?: number
): RuleEvaluationResult {
  if (volume < minVolume) {
    return {
      matches: false,
      buyPercentage,
      sellPercentage,
      reason: `Volume (${volume.toLocaleString('en-IN')}) below minimum threshold of ${minVolume.toLocaleString('en-IN')}`,
    };
  }

  if (minPriceChange !== undefined && changePercent !== undefined && changePercent < minPriceChange) {
    return {
      matches: false,
      buyPercentage,
      sellPercentage,
      reason: `Price change (${changePercent.toFixed(2)}%) below minimum filter of ${minPriceChange}%`,
    };
  }

  const buyMatches = buyPercentage >= buyThreshold;
  const sellMatches = sellPercentage <= sellThreshold;

  if (buyMatches && sellMatches) {
    const reason = `Buy quantity reached ${buyPercentage.toFixed(1)}%, exceeding your ${buyThreshold.toFixed(1)}% threshold (Sell quantity is ${sellPercentage.toFixed(1)}%).`;
    return {
      matches: true,
      buyPercentage,
      sellPercentage,
      reason,
    };
  }

  return {
    matches: false,
    buyPercentage,
    sellPercentage,
    reason: `Buy quantity (${buyPercentage.toFixed(1)}%) does not satisfy ${buyThreshold.toFixed(1)}% threshold.`,
  };
}
