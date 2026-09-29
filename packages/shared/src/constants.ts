import { ScannerRuleConfig } from './types.js';

export interface NSEInstrumentDefinition {
  symbol: string;
  companyName: string;
  basePrice: number;
  lotSize: number;
  sector: string;
}

export const MONITORED_NSE_STOCKS: NSEInstrumentDefinition[] = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd.', basePrice: 2980.50, lotSize: 250, sector: 'Energy & Petrochemicals' },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd.', basePrice: 4250.00, lotSize: 175, sector: 'Information Technology' },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd.', basePrice: 1650.25, lotSize: 550, sector: 'Financial Services' },
  { symbol: 'INFY', companyName: 'Infosys Ltd.', basePrice: 1890.75, lotSize: 400, sector: 'Information Technology' },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank Ltd.', basePrice: 1240.60, lotSize: 700, sector: 'Financial Services' },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Ltd.', basePrice: 975.30, lotSize: 1425, sector: 'Automobile' },
  { symbol: 'SBIN', companyName: 'State Bank of India', basePrice: 790.45, lotSize: 750, sector: 'Financial Services' },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd.', basePrice: 1540.00, lotSize: 475, sector: 'Telecommunication' },
  { symbol: 'ITC', companyName: 'ITC Ltd.', basePrice: 510.20, lotSize: 1600, sector: 'Consumer Goods' },
  { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Ltd.', basePrice: 1810.00, lotSize: 400, sector: 'Financial Services' },
  { symbol: 'LT', companyName: 'Larsen & Toubro Ltd.', basePrice: 3620.00, lotSize: 150, sector: 'Construction & Engineering' },
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd.', basePrice: 7420.00, lotSize: 125, sector: 'Financial Services' },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Ltd.', basePrice: 12450.00, lotSize: 50, sector: 'Automobile' },
  { symbol: 'TITAN', companyName: 'Titan Company Ltd.', basePrice: 3715.00, lotSize: 175, sector: 'Consumer Durables' },
  { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Ltd.', basePrice: 1885.00, lotSize: 350, sector: 'Healthcare' },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints Ltd.', basePrice: 3240.00, lotSize: 200, sector: 'Consumer Goods' },
  { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd.', basePrice: 2830.00, lotSize: 300, sector: 'Consumer Goods' },
  { symbol: 'AXISBANK', companyName: 'Axis Bank Ltd.', basePrice: 1220.00, lotSize: 625, sector: 'Financial Services' },
  { symbol: 'WIPRO', companyName: 'Wipro Ltd.', basePrice: 540.00, lotSize: 1500, sector: 'Information Technology' },
  { symbol: 'NTPC', companyName: 'NTPC Ltd.', basePrice: 415.00, lotSize: 1500, sector: 'Power' },
  { symbol: 'TATASTEEL', companyName: 'Tata Steel Ltd.', basePrice: 158.00, lotSize: 5500, sector: 'Metals' },
  { symbol: 'POWERGRID', companyName: 'Power Grid Corporation of India Ltd.', basePrice: 335.00, lotSize: 1800, sector: 'Power' },
  { symbol: 'M&M', companyName: 'Mahindra & Mahindra Ltd.', basePrice: 3120.00, lotSize: 350, sector: 'Automobile' },
  { symbol: 'COALINDIA', companyName: 'Coal India Ltd.', basePrice: 512.00, lotSize: 2100, sector: 'Oil & Gas' },
  { symbol: 'ADANIENT', companyName: 'Adani Enterprises Ltd.', basePrice: 3140.00, lotSize: 300, sector: 'Metals & Mining' }
];

export const DEFAULT_SCANNER_CONFIG: ScannerRuleConfig = {
  id: 'rule-buy-pressure-default',
  name: 'Buy Pressure (60/40 Rule)',
  enabled: true,
  buyThreshold: 60.0,
  sellThreshold: 40.0,
  minVolume: 10000,
  minPriceChange: undefined,
  maxPriceChange: undefined,
  updatedAt: new Date().toISOString(),
};

// Indian Stock Market (NSE) Hours in IST (UTC+5:30)
export const MARKET_HOURS = {
  PRE_OPEN_START: { hour: 9, minute: 0 },
  PRE_OPEN_END: { hour: 9, minute: 8 },
  NORMAL_START: { hour: 9, minute: 15 },
  NORMAL_END: { hour: 15, minute: 30 },
  TIMEZONE: 'Asia/Kolkata',
};
