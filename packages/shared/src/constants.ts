import { ScannerRuleConfig } from './types.js';

export interface NSEInstrumentDefinition {
  symbol: string;
  companyName: string;
  basePrice: number;
  lotSize: number;
  sector: string;
  isin: string;
  kiteToken: number;
  upstoxKey: string;
  dhanSecurityId: string;
}

export const MONITORED_NSE_STOCKS: NSEInstrumentDefinition[] = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd.', basePrice: 2980.50, lotSize: 250, sector: 'Energy & Petrochemicals', isin: 'INE002A01018', kiteToken: 738561, upstoxKey: 'NSE_EQ|INE002A01018', dhanSecurityId: '1333' },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd.', basePrice: 4250.00, lotSize: 175, sector: 'Information Technology', isin: 'INE467B01029', kiteToken: 2953217, upstoxKey: 'NSE_EQ|INE467B01029', dhanSecurityId: '11536' },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd.', basePrice: 1650.25, lotSize: 550, sector: 'Financial Services', isin: 'INE040A01034', kiteToken: 341249, upstoxKey: 'NSE_EQ|INE040A01034', dhanSecurityId: '1330' },
  { symbol: 'INFY', companyName: 'Infosys Ltd.', basePrice: 1890.75, lotSize: 400, sector: 'Information Technology', isin: 'INE009A01021', kiteToken: 408065, upstoxKey: 'NSE_EQ|INE009A01021', dhanSecurityId: '1594' },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank Ltd.', basePrice: 1240.60, lotSize: 700, sector: 'Financial Services', isin: 'INE090A01021', kiteToken: 1270529, upstoxKey: 'NSE_EQ|INE090A01021', dhanSecurityId: '4963' },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Ltd.', basePrice: 975.30, lotSize: 1425, sector: 'Automobile', isin: 'INE155A01022', kiteToken: 884737, upstoxKey: 'NSE_EQ|INE155A01022', dhanSecurityId: '3456' },
  { symbol: 'SBIN', companyName: 'State Bank of India', basePrice: 790.45, lotSize: 750, sector: 'Financial Services', isin: 'INE062A01020', kiteToken: 779521, upstoxKey: 'NSE_EQ|INE062A01020', dhanSecurityId: '3045' },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd.', basePrice: 1540.00, lotSize: 475, sector: 'Telecommunication', isin: 'INE397D01024', kiteToken: 2714625, upstoxKey: 'NSE_EQ|INE397D01024', dhanSecurityId: '10604' },
  { symbol: 'ITC', companyName: 'ITC Ltd.', basePrice: 510.20, lotSize: 1600, sector: 'Consumer Goods', isin: 'INE154A01025', kiteToken: 424961, upstoxKey: 'NSE_EQ|INE154A01025', dhanSecurityId: '1660' },
  { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Ltd.', basePrice: 1810.00, lotSize: 400, sector: 'Financial Services', isin: 'INE237A01028', kiteToken: 492033, upstoxKey: 'NSE_EQ|INE237A01028', dhanSecurityId: '1922' },
  { symbol: 'LT', companyName: 'Larsen & Toubro Ltd.', basePrice: 3620.00, lotSize: 150, sector: 'Construction & Engineering', isin: 'INE018A01030', kiteToken: 2939649, upstoxKey: 'NSE_EQ|INE018A01030', dhanSecurityId: '11483' },
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd.', basePrice: 7420.00, lotSize: 125, sector: 'Financial Services', isin: 'INE296A01024', kiteToken: 81153, upstoxKey: 'NSE_EQ|INE296A01024', dhanSecurityId: '317' },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Ltd.', basePrice: 12450.00, lotSize: 50, sector: 'Automobile', isin: 'INE585B01010', kiteToken: 2815745, upstoxKey: 'NSE_EQ|INE585B01010', dhanSecurityId: '10999' },
  { symbol: 'TITAN', companyName: 'Titan Company Ltd.', basePrice: 3715.00, lotSize: 175, sector: 'Consumer Durables', isin: 'INE280A01028', kiteToken: 897537, upstoxKey: 'NSE_EQ|INE280A01028', dhanSecurityId: '3506' },
  { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Ltd.', basePrice: 1885.00, lotSize: 350, sector: 'Healthcare', isin: 'INE044A01036', kiteToken: 857857, upstoxKey: 'NSE_EQ|INE044A01036', dhanSecurityId: '3351' },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints Ltd.', basePrice: 3240.00, lotSize: 200, sector: 'Consumer Goods', isin: 'INE021A01026', kiteToken: 60417, upstoxKey: 'NSE_EQ|INE021A01026', dhanSecurityId: '236' },
  { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd.', basePrice: 2830.00, lotSize: 300, sector: 'Consumer Goods', isin: 'INE030A01027', kiteToken: 356865, upstoxKey: 'NSE_EQ|INE030A01027', dhanSecurityId: '1394' },
  { symbol: 'AXISBANK', companyName: 'Axis Bank Ltd.', basePrice: 1220.00, lotSize: 625, sector: 'Financial Services', isin: 'INE238A01034', kiteToken: 1510401, upstoxKey: 'NSE_EQ|INE238A01034', dhanSecurityId: '5900' },
  { symbol: 'WIPRO', companyName: 'Wipro Ltd.', basePrice: 540.00, lotSize: 1500, sector: 'Information Technology', isin: 'INE075A01022', kiteToken: 969473, upstoxKey: 'NSE_EQ|INE075A01022', dhanSecurityId: '3787' },
  { symbol: 'NTPC', companyName: 'NTPC Ltd.', basePrice: 415.00, lotSize: 1500, sector: 'Power', isin: 'INE733E01010', kiteToken: 2977281, upstoxKey: 'NSE_EQ|INE733E01010', dhanSecurityId: '11630' },
  { symbol: 'TATASTEEL', companyName: 'Tata Steel Ltd.', basePrice: 158.00, lotSize: 5500, sector: 'Metals', isin: 'INE081A01020', kiteToken: 895745, upstoxKey: 'NSE_EQ|INE081A01020', dhanSecurityId: '3499' },
  { symbol: 'POWERGRID', companyName: 'Power Grid Corporation of India Ltd.', basePrice: 335.00, lotSize: 1800, sector: 'Power', isin: 'INE752E01010', kiteToken: 3834113, upstoxKey: 'NSE_EQ|INE752E01010', dhanSecurityId: '14977' },
  { symbol: 'M&M', companyName: 'Mahindra & Mahindra Ltd.', basePrice: 3120.00, lotSize: 350, sector: 'Automobile', isin: 'INE101A01026', kiteToken: 519937, upstoxKey: 'NSE_EQ|INE101A01026', dhanSecurityId: '2031' },
  { symbol: 'COALINDIA', companyName: 'Coal India Ltd.', basePrice: 512.00, lotSize: 2100, sector: 'Oil & Gas', isin: 'INE522F01014', kiteToken: 5215745, upstoxKey: 'NSE_EQ|INE522F01014', dhanSecurityId: '20374' },
  { symbol: 'ADANIENT', companyName: 'Adani Enterprises Ltd.', basePrice: 3140.00, lotSize: 300, sector: 'Metals & Mining', isin: 'INE423A01024', kiteToken: 6401, upstoxKey: 'NSE_EQ|INE423A01024', dhanSecurityId: '25' }
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
