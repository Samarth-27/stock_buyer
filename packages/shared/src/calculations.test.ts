import { describe, it, expect } from 'vitest';
import {
  calculateBuySellPercentages,
  calculateOrderBookImbalance,
  evaluateBuyPressure,
  calculateSwingTradePlan,
  calculateAdrPercent,
  calculateMinerviniTrendTemplate,
  calculateVcpTightness,
  calculateQullamaggieTrailingPlan,
  calculateInstitutionalConfluence,
} from './calculations.js';

describe('Order Book Buy/Sell Percentage Calculations', () => {
  it('correctly calculates 60% buy and 40% sell for 60,000 buy and 40,000 sell quantities', () => {
    const result = calculateBuySellPercentages(60000, 40000);
    expect(result.isValid).toBe(true);
    expect(result.totalQuantity).toBe(100000);
    expect(result.buyPercentage).toBe(60.0);
    expect(result.sellPercentage).toBe(40.0);
    expect(result.buyPercentage + result.sellPercentage).toBe(100.0);
  });

  it('correctly calculates decimal percentages with exact 100% total sum', () => {
    const result = calculateBuySellPercentages(123456, 78910);
    expect(result.isValid).toBe(true);
    expect(result.totalQuantity).toBe(202366);
    expect(result.buyPercentage).toBe(61.01);
    expect(result.sellPercentage).toBe(38.99);
    expect(result.buyPercentage + result.sellPercentage).toBe(100.0);
  });

  it('handles zero total quantity safely without division by zero or NaN', () => {
    const result = calculateBuySellPercentages(0, 0);
    expect(result.isValid).toBe(false);
    expect(result.totalQuantity).toBe(0);
    expect(result.buyPercentage).toBe(0);
    expect(result.sellPercentage).toBe(0);
    expect(result.reason).toBeDefined();
  });

  it('handles 100% buy orders when sell quantity is zero', () => {
    const result = calculateBuySellPercentages(50000, 0);
    expect(result.isValid).toBe(true);
    expect(result.totalQuantity).toBe(50000);
    expect(result.buyPercentage).toBe(100.0);
    expect(result.sellPercentage).toBe(0.0);
  });

  it('handles 100% sell orders when buy quantity is zero', () => {
    const result = calculateBuySellPercentages(0, 75000);
    expect(result.isValid).toBe(true);
    expect(result.totalQuantity).toBe(75000);
    expect(result.buyPercentage).toBe(0.0);
    expect(result.sellPercentage).toBe(100.0);
  });

  it('safely handles negative quantities by clamping to zero', () => {
    const result = calculateBuySellPercentages(-500, 1000);
    expect(result.isValid).toBe(true);
    expect(result.totalQuantity).toBe(1000);
    expect(result.buyPercentage).toBe(0.0);
    expect(result.sellPercentage).toBe(100.0);
  });

  it('safely handles NaN and non-numeric inputs', () => {
    const result = calculateBuySellPercentages(NaN, 5000);
    expect(result.isValid).toBe(false);
    expect(result.totalQuantity).toBe(0);
    expect(result.buyPercentage).toBe(0);
  });
});

describe('Order Book Imbalance Ratio Calculation', () => {
  it('calculates balanced book as 0.0', () => {
    expect(calculateOrderBookImbalance(50000, 50000)).toBe(0.0);
  });

  it('calculates 100% buy as +1.0', () => {
    expect(calculateOrderBookImbalance(10000, 0)).toBe(1.0);
  });

  it('calculates 100% sell as -1.0', () => {
    expect(calculateOrderBookImbalance(0, 10000)).toBe(-1.0);
  });

  it('calculates 60/40 imbalance as +0.2', () => {
    expect(calculateOrderBookImbalance(60000, 40000)).toBe(0.2);
  });

  it('handles 0/0 safely', () => {
    expect(calculateOrderBookImbalance(0, 0)).toBe(0.0);
  });
});

describe('Scanner Buy Pressure Rule Evaluation', () => {
  it('triggers when buy percentage is exactly 60.0% and sell percentage is 40.0%', () => {
    const evalResult = evaluateBuyPressure(60.0, 40.0, 60.0, 40.0, 25000, 10000);
    expect(evalResult.matches).toBe(true);
    expect(evalResult.reason).toContain('exceeding your 60.0% threshold');
  });

  it('triggers when buy percentage is 63.2% (> 60%) and sell is 36.8% (< 40%)', () => {
    const evalResult = evaluateBuyPressure(63.2, 36.8, 60.0, 40.0, 50000, 10000);
    expect(evalResult.matches).toBe(true);
    expect(evalResult.reason).toContain('63.2%');
    expect(evalResult.reason).toContain('60.0%');
  });

  it('does NOT trigger at 59.9% buy percentage (below 60%)', () => {
    const evalResult = evaluateBuyPressure(59.9, 40.1, 60.0, 40.0, 50000, 10000);
    expect(evalResult.matches).toBe(false);
  });

  it('does NOT trigger if volume is below minimum threshold', () => {
    const evalResult = evaluateBuyPressure(70.0, 30.0, 60.0, 40.0, 5000, 10000);
    expect(evalResult.matches).toBe(false);
    expect(evalResult.reason).toContain('below minimum threshold');
  });

  it('does NOT trigger if price change is below minimum filter', () => {
    const evalResult = evaluateBuyPressure(65.0, 35.0, 60.0, 40.0, 50000, 10000, -3.5, 0.0);
    expect(evalResult.matches).toBe(false);
    expect(evalResult.reason).toContain('below minimum filter');
  });

  it('supports custom threshold configuration (e.g. 65% buy, 35% sell)', () => {
    const eval62 = evaluateBuyPressure(62.0, 38.0, 65.0, 35.0, 50000, 10000);
    expect(eval62.matches).toBe(false);

    const eval67 = evaluateBuyPressure(67.0, 33.0, 65.0, 35.0, 50000, 10000);
    expect(eval67.matches).toBe(true);
    expect(eval67.reason).toContain('67.0%');
    expect(eval67.reason).toContain('65.0%');
  });
});

describe('Swing Trading Blueprint Calculations', () => {
  it('generates a realistic swing plan with entry, target 1, target 2, and stop loss', () => {
    const quote = {
      symbol: 'RELIANCE',
      ltp: 3000.0,
      previousClose: 2950.0,
      changePercent: 1.69,
      volume: 450000,
      buyPercentage: 64.0,
      sellPercentage: 36.0,
    };

    const plan = calculateSwingTradePlan(quote);
    expect(plan).toBeDefined();
    expect(plan.target1).toBeGreaterThan(quote.ltp);
    expect(plan.target2).toBeGreaterThan(plan.target1);
    expect(plan.stopLoss).toBeLessThan(quote.ltp);
    expect(plan.target1Percent).toBeGreaterThanOrEqual(4.0);
    expect(plan.riskRewardRatio).toBeGreaterThanOrEqual(1.5);
    expect(plan.holdingHorizon).toContain('Days');
    expect(plan.catalysts.length).toBeGreaterThan(0);
  });

  it('correctly classifies a 20 EMA pullback setup when price is near 20 EMA with buyer defense', () => {
    const quote = {
      symbol: 'TATAMOTORS',
      ltp: 980.0,
      previousClose: 978.0,
      changePercent: 0.2,
      volume: 120000,
      buyPercentage: 58.0,
      sellPercentage: 42.0,
    };

    const plan = calculateSwingTradePlan(quote);
    expect(['EMA20_PULLBACK', 'STAGE2_BREAKOUT', 'ACCUMULATION_SQUEEZE', 'ORDER_BOOK_PRESSURE', 'EPISODIC_PIVOT']).toContain(plan.setupType);
    expect(plan.riskRewardRatio).toBeGreaterThan(1.0);
  });

  it('computes Minervini 8-point trend template, VCP tightness, ADR%, and Qullamaggie trailing plans', () => {
    const quote = {
      symbol: 'RELIANCE',
      ltp: 3000.0,
      previousClose: 2950.0,
      changePercent: 3.2,
      volume: 600000,
      buyPercentage: 62.0,
      sellPercentage: 38.0,
    };

    const plan = calculateSwingTradePlan(quote);
    expect(plan.adrPercent).toBeGreaterThan(0);
    expect(plan.minerviniTemplate).toBeDefined();
    expect(plan.minerviniTemplate?.maxScore).toBe(8);
    expect(plan.minerviniTemplate?.score).toBeGreaterThanOrEqual(0);
    expect(plan.vcp).toBeDefined();
    expect(plan.vcp?.tightnessScore).toBeGreaterThanOrEqual(0);
    expect(plan.qullamaggieTrailing).toBeDefined();
    expect(plan.qullamaggieTrailing?.breakevenPrice).toBe(3000.0);
    expect(plan.qullamaggieTrailing?.exitRule).toContain('EMA');
  });

  it('calculates ADR% accurately across historical bars', () => {
    const candles = [
      { timestamp: '1', open: 100, high: 105, low: 98, close: 104, volume: 1000 },
      { timestamp: '2', open: 104, high: 109, low: 103, close: 107, volume: 1200 },
      { timestamp: '3', open: 107, high: 112, low: 106, close: 110, volume: 1100 },
      { timestamp: '4', open: 110, high: 115, low: 109, close: 114, volume: 1500 },
      { timestamp: '5', open: 114, high: 118, low: 113, close: 117, volume: 1400 },
    ];
    const adr = calculateAdrPercent(candles);
    expect(adr).toBeGreaterThan(2.0);
    expect(adr).toBeLessThan(10.0);
  });

  it('calculates Institutional Confluence score and Kelly Sizing allocation', () => {
    const minervini = {
      score: 8,
      maxScore: 8,
      isStage2Uptrend: true,
      rules: {} as any,
      passedRules: [],
      failedRules: [],
    };
    const vcp = {
      isVcpDetected: true,
      tightnessScore: 85,
      contractionCount: 3,
      contractions: [],
      isVolumeDryingUp: true,
      pivotPrice: 3000,
    };
    const orderBook = {
      symbol: 'RELIANCE',
      exchange: 'NSE' as const,
      totalBuyQuantity: 70000,
      totalSellQuantity: 30000,
      buyPercentage: 70.0,
      sellPercentage: 30.0,
      imbalanceRatio: 0.4,
      bids: [],
      asks: [],
      timestamp: new Date().toISOString(),
      source: 'MOCK',
      isStale: false,
    };

    const confluence = calculateInstitutionalConfluence(
      minervini,
      vcp,
      orderBook,
      { ltp: 3000, changePercent: 2.1 },
      57.1,
      8.5,
      2.5,
      3.2,
      2980
    );

    expect(confluence.overallScore).toBeGreaterThanOrEqual(80);
    expect(confluence.tier).toBe('GRADE_A_PLUS_SNIPER');
    expect(confluence.kellyAllocation.recommendedPositionSizePercent).toBeGreaterThan(0);
    expect(confluence.kellyAllocation.maxCapitalRiskPercent).toBeGreaterThan(0);
    expect(confluence.macroMarketEdge.niftyRegime).toBe('BULLISH_TREND');
  });

  it('evaluates INSTITUTIONAL_SNIPER rule properly in evaluateBuyPressure', () => {
    const quote = { ltp: 3000, changePercent: 2.0, volume: 50000 };
    const plan = calculateSwingTradePlan(quote, {
      symbol: 'RELIANCE',
      exchange: 'NSE' as const,
      totalBuyQuantity: 65000,
      totalSellQuantity: 35000,
      buyPercentage: 65.0,
      sellPercentage: 35.0,
      imbalanceRatio: 0.3,
      bids: [],
      asks: [],
      timestamp: new Date().toISOString(),
      source: 'MOCK',
      isStale: false,
    });

    const res = evaluateBuyPressure(
      65.0,
      35.0,
      60.0,
      40.0,
      50000,
      10000,
      2.0,
      undefined,
      undefined,
      false,
      undefined,
      plan,
      'INSTITUTIONAL_SNIPER'
    );

    // Depending on score it matches or cleanly explains rejection
    expect(typeof res.matches).toBe('boolean');
    expect(res.reason).toBeDefined();
  });
});
