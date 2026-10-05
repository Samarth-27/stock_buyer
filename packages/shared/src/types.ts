export type Exchange = 'NSE';

export interface MarketDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderBook {
  symbol: string;
  exchange: Exchange;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  imbalanceRatio: number; // in range [-1.0, 1.0]
  bids: MarketDepthEntry[]; // Top 5 bids descending by price
  asks: MarketDepthEntry[]; // Top 5 asks ascending by price
  prediction?: AIPrediction;
  timestamp: string; // ISO 8601
  source: string; // e.g. 'MOCK_FEED' | 'KITE_CONNECT' | 'UPSTOX'
  isStale: boolean;
}

export type AIPredictionSignal = 'JUMP' | 'DROP' | 'NEUTRAL';
export type QuantAction = 'STRONG_BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG_SELL';

export interface ChartTechnicalAnalysis {
  rsi14: number; // 0 to 100
  rsiStatus: 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'OVERBOUGHT';
  ema9: number;
  ema21: number;
  trend: 'STRONG_UPTREND' | 'UPTREND' | 'SIDEWAYS' | 'DOWNTREND' | 'STRONG_DOWNTREND';
  vwap: number;
  priceVsVwapPercent: number; // e.g. +0.45%
  volumeSurgeRatio: number; // e.g. 1.8x average volume
  supportPrice: number;
  resistancePrice: number;
  candlestickPattern: string; // e.g. 'BULLISH_ENGULFING', 'HAMMER', 'MOMENTUM_EXPANSION', 'NONE'
  technicalScore: number; // 0 to 100
  keyObservations: string[];
}

export interface QuantExecutionPlan {
  action: QuantAction;
  entryPrice: number;
  targetPrice: number;
  expectedMovePercent: number; // e.g. +1.25%
  stopLossPrice: number;
  stopLossPercent: number; // e.g. -0.38%
  riskRewardRatio: number; // e.g. 3.3 (Risk:Reward)
  kellyAllocationPercent: number; // Optimal Kelly capital % (e.g. 7.5%)
  spoofRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  regime: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'CHOPPY_RANGE' | 'MOMENTUM_ACCELERATION';
  investorVerdict: 'PRIME_BREAKOUT_BUY' | 'ACCUMULATE' | 'NEUTRAL_WAIT' | 'DISTRIBUTION_SELL' | 'AVOID';
  alignment: 'FULL_ALIGNMENT' | 'PARTIAL_ALIGNMENT' | 'DIVERGENT';
  calibratedWinProbability: number; // 0 to 100 (%)
}

export interface AIPrediction {
  signal: AIPredictionSignal;
  direction: 1 | -1 | 0;
  confidence: number; // 0 to 100 (%)
  consensusScore: number; // 0 to 100 (%)
  expectedMovePercent: number; // e.g. +1.15% or -0.80%
  microPrice: number;
  microPriceDeltaBps: number; // Basis points difference from LTP
  weightedImbalance: number; // -1.0 to 1.0
  chartAnalysis?: ChartTechnicalAnalysis;
  executionPlan?: QuantExecutionPlan;
  reasons: string[];
  timestamp: string;
}

export type SwingTradeSetupType =
  | 'STAGE2_BREAKOUT'
  | 'EMA20_PULLBACK'
  | 'ACCUMULATION_SQUEEZE'
  | '52W_HIGH_MOMENTUM'
  | 'ORDER_BOOK_PRESSURE'
  | 'EPISODIC_PIVOT';

export interface MinerviniTemplateResult {
  passed: boolean;
  score: number; // 0 to 8
  maxScore: 8;
  criteria: {
    priceAbove150and200: boolean;
    sma150Above200: boolean;
    sma200TrendingUp: boolean;
    sma50Above150and200: boolean;
    priceAbove50: boolean;
    price30PctAbove52wLow: boolean;
    priceWithin25Pct52wHigh: boolean;
    relativeStrengthHigh: boolean;
  };
  passedRules: string[];
  failedRules: string[];
}

export interface VcpPatternResult {
  isVcpDetected: boolean;
  tightnessScore: number; // 0 to 100
  contractionCount: number;
  contractions: { depthPercent: number; bars: number }[];
  isVolumeDryingUp: boolean;
  pivotPrice: number;
}

export interface QullamaggieTrailingPlan {
  initialStopLoss: number;
  initialStopLossPercent: number;
  partialExitTarget: number; // Target 1 (1/3 to 1/2 size)
  partialExitPercent: number;
  breakevenPrice: number;
  trailing10Ema: number;
  trailing20Ema: number;
  exitRule: string;
}

export interface ConfluenceEngineResult {
  overallScore: number; // 0 to 100
  tier: 'GRADE_A_PLUS_SNIPER' | 'GRADE_A_HIGH_CONFLUENCE' | 'GRADE_B_MODERATE' | 'GRADE_C_AVOID';
  tierLabel: string;
  breakdown: {
    minerviniScore: number; // 0-100 (weight 25%)
    vcpTightnessScore: number; // 0-100 (weight 20%)
    orderBookDepthScore: number; // 0-100 (weight 20%)
    mlStatisticalScore: number; // 0-100 (weight 20%)
    qullamaggieEmaScore: number; // 0-100 (weight 15%)
  };
  kellyAllocation: {
    recommendedPositionSizePercent: number; // e.g. 12.5%
    halfKellyPercent: number;
    maxCapitalRiskPercent: number; // e.g. 0.75%
    rationale: string;
  };
  macroMarketEdge: {
    niftyRegime: 'BULLISH_TREND' | 'NEUTRAL_CHOP' | 'BEARISH_CORRECTION';
    breadthAdvancers: number;
    breadthDecliners: number;
    regimeMultiplier: number;
  };
}

export type TwoDaySwingVerdict = 'CONVINCING_BUY' | 'PASS_DO_NOT_BUY' | 'WATCHLIST_PULLBACK';

export interface JevDecisionBreakdown {
  expectedValuePercent: number; // EV % = (Pwin * T1%) - (Ploss * SL%)
  winProbability: number; // 0 to 100 (%)
  lossProbability: number; // 0 to 100 (%)
  targetGainPercent: number; // e.g. +7.5%
  stopLossRiskPercent: number; // e.g. 2.5%
  riskRewardRatio: number; // e.g. 3.0
  mathematicalEdge: 'STRONG_POSITIVE_EDGE' | 'MODERATE_EDGE' | 'NEGATIVE_EDGE';
  halfKellyCapitalPercent: number; // recommended % of trading capital
  maxCapitalRiskPercent: number; // % of total account at risk
}

export interface MultiModelConfluenceSynthesis {
  jevEdgeScore: number; // 0-100 (Joint Expected Value)
  minerviniScore: number; // 0-100 (Stage 2 Uptrend 8-points)
  vcpScore: number; // 0-100 (Volatility Contraction & Dry-Up)
  mlStatisticalScore: number; // 0-100 (29,520 NSE Historical Model)
  orderBookScore: number; // 0-100 (Smart Money Depth & Microprice)
  qullamaggieEmaScore: number; // 0-100 (10/20 EMA Support & Trail)
  compositeScore: number; // 0-100
}

export interface TwoDaySwingDecision {
  verdict: TwoDaySwingVerdict;
  verdictLabel: string;
  holdingHorizonDays: string; // e.g. "2 to 5 Trading Days (Min 2 Days)"
  sustainabilityReason: string; // Explains why this decision sustains for 2+ days without noise stop-outs
  entryZone: { min: number; max: number };
  invalidationStopPrice: number;
  invalidationStopPercent: number;
  target1Price: number;
  target1Percent: number;
  target2Price: number;
  target2Percent: number;
  jev: JevDecisionBreakdown;
  confluence: MultiModelConfluenceSynthesis;
  convictionTier: 'ELITE_5_STAR' | 'HIGH_4_STAR' | 'MODERATE_3_STAR' | 'AVOID_1_STAR';
  primaryCatalysts: string[];
  riskWarnings: string[];
  invalidationRule: string;
  generatedAt: string;
}

export interface SwingTradePlan {
  setupType: SwingTradeSetupType;
  setupName: string;
  stage: 'Stage 2 Markup' | 'Pullback Test' | 'Volatility Contraction' | 'Breakout Confirmation' | 'Accumulation Base' | 'Episodic Pivot Gap';
  entryRange: { min: number; max: number };
  target1: number;
  target1Percent: number; // e.g. +6.5%
  target2: number;
  target2Percent: number; // e.g. +14.0%
  stopLoss: number;
  stopLossPercent: number; // e.g. -2.8%
  riskRewardRatio: number; // e.g. 3.2 (1:3.2)
  holdingHorizon: string; // e.g. "5 – 12 Trading Days"
  dailyRsi: number;
  trendAlignment: 'BULLISH_STACK' | 'PULLBACK_TEST' | 'NEUTRAL';
  catalysts: string[];
  summary: string;
  mlEngine?: {
    modelType: string;
    trainingSamples: number;
    winProbability: number;
    confidenceTier: 'ELITE' | 'HIGH' | 'MODERATE';
    topFeatureDrivers: string[];
    backtestedRocAuc: number;
  };
  // Proven GitHub Benchmarked Strategies
  adrPercent?: number; // Average Daily Range % (20D)
  minerviniTemplate?: MinerviniTemplateResult;
  vcp?: VcpPatternResult;
  qullamaggieTrailing?: QullamaggieTrailingPlan;
  confluence?: ConfluenceEngineResult;
  twoDayDecision?: TwoDaySwingDecision;
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  ltp: number; // Last Traded Price
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number; // ltp - previousClose
  changePercent: number; // ((ltp - previousClose) / previousClose) * 100
  volume: number; // Cumulative daily volume
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  prediction?: AIPrediction;
  swingPlan?: SwingTradePlan;
  swingSetup?: SwingTradeSetupType;
  twoDayDecision?: TwoDaySwingDecision;
  timestamp: string;
  source: string;
  isStale: boolean;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '1D';
export type ChartRange = '1d' | '5d' | '1mo' | '1y';

export interface ScannerRuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  buyThreshold: number; // Default 60.0%
  sellThreshold: number; // Default 40.0%
  minVolume: number; // Default 10000
  strategyPreset?: 'SWING_BREAKOUT' | 'EMA20_PULLBACK' | 'ACCUMULATION_SQUEEZE' | 'ORDER_BOOK_PRESSURE' | 'EPISODIC_PIVOT' | 'INSTITUTIONAL_SNIPER';
  swingMinTargetPercent?: number; // e.g. 5.0%
  swingMinRiskReward?: number; // e.g. 2.5
  minPriceChange?: number; // Optional filter
  maxPriceChange?: number; // Optional filter
  requireAiJump?: boolean; // When true, only surface stocks with AI 'JUMP' prediction
  minAiConfidence?: number; // e.g. 60 or 70 (%)
  updatedAt: string;
}

export interface ScannerResult {
  symbol: string;
  companyName: string;
  ltp: number;
  changePercent: number;
  volume: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  prediction?: AIPrediction;
  swingPlan?: SwingTradePlan;
  swingSetup?: SwingTradeSetupType;
  twoDayDecision?: TwoDaySwingDecision;
  ruleId: string;
  ruleName: string;
  reason: string;
  surfacedAt: string;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  addedAt: string;
  notes?: string;
  quote?: StockQuote;
}

export interface StockNewsItem {
  id: string;
  symbol: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number; // range -1.0 to 1.0
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  keywords: string[];
}

export interface MarketAlert {
  id: string;
  symbol: string;
  type: 'SCANNER_TRIGGER' | 'SCANNER_DROP' | 'FEED_STATUS' | 'SYSTEM' | 'NEWS_ALERT' | 'SWING_SETUP';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export type MarketSessionStatus = 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'HOLIDAY';

export interface MarketStatusInfo {
  status: MarketSessionStatus;
  statusLabel: string;
  isLiveTradingHours: boolean;
  serverTimeIST: string;
  tradingHours: string;
  mode: 'mock' | 'provider';
  providerName: string;
  monitoredStocksCount: number;
}

// WebSocket Protocol Definitions
export type WSActionType = 'subscribe' | 'unsubscribe' | 'ping';
export type WSChannel = 'stocks' | 'orderbook' | 'scanner' | 'alerts';

export interface WSClientMessage {
  action: WSActionType;
  channel?: WSChannel;
  symbol?: string;
}

export type WSEventType =
  | 'CONNECTED'
  | 'TICK'
  | 'ORDER_BOOK'
  | 'SCANNER_SNAPSHOT'
  | 'SCANNER_TRIGGER'
  | 'SCANNER_REMOVE'
  | 'ALERT'
  | 'PONG'
  | 'ERROR';

export interface WSServerMessage<T = unknown> {
  type: WSEventType;
  data: T;
  timestamp: string;
}

// Portfolio & Holding Management Types
export type PortfolioHoldingVerdict =
  | 'HOLD_TRAIL'
  | 'TAKE_PROFIT_T1'
  | 'EXIT_STOP_LOSS'
  | 'ADD_PYRAMID';

export interface PortfolioHolding {
  id: string; // unique ID
  symbol: string;
  companyName: string;
  buyPrice: number; // Purchase price in INR
  quantity: number; // Number of shares held
  buyDate: string; // ISO date or YYYY-MM-DD
  notes?: string;
  currentLtp?: number;
  currentValue?: number; // quantity * ltp
  investedValue?: number; // quantity * buyPrice
  unrealizedPnL?: number; // currentValue - investedValue
  unrealizedPnLPercent?: number; // % gain or loss
  holdingVerdict?: PortfolioHoldingVerdict;
  holdingVerdictLabel?: string;
  holdingReason?: string;
  trailingStopPrice?: number;
  target1Price?: number;
  daysHeld?: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrent: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdingsCount: number;
  holdCount: number;
  takeProfitCount: number;
  exitCount: number;
  addCount: number;
}
