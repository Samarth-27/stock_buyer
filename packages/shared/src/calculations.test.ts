import { describe, it, expect } from 'vitest';
import {
  calculateBuySellPercentages,
  calculateOrderBookImbalance,
  evaluateBuyPressure,
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
