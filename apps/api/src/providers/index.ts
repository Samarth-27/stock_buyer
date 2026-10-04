import { MarketDataProvider } from './MarketDataProvider.js';
import { MockMarketDataProvider } from './MockMarketDataProvider.js';
import { KiteConnectProvider } from './KiteConnectProvider.js';
import { UpstoxDataProvider } from './UpstoxDataProvider.js';
import { DhanDataProvider } from './DhanDataProvider.js';
import { AngelOneDataProvider } from './AngelOneDataProvider.js';

export function createMarketDataProvider(
  overrideMode?: string,
  credentials?: Record<string, string>
): MarketDataProvider {
  const mode = (overrideMode || process.env.MARKET_DATA_MODE || 'mock').toLowerCase().trim();

  switch (mode) {
    case 'kite':
      console.log('[ProviderFactory] Initializing Zerodha Kite Connect live provider');
      return new KiteConnectProvider(credentials?.apiKey, credentials?.accessToken);

    case 'upstox':
      console.log('[ProviderFactory] Initializing Upstox API live provider');
      return new UpstoxDataProvider(credentials?.apiKey, credentials?.accessToken);

    case 'dhan':
      console.log('[ProviderFactory] Initializing Dhan HQ API live provider');
      return new DhanDataProvider(credentials?.clientId, credentials?.accessToken);

    case 'angel':
    case 'angelone':
      console.log('[ProviderFactory] Initializing Angel One SmartAPI live provider');
      return new AngelOneDataProvider(
        credentials?.apiKey,
        credentials?.jwtToken || credentials?.accessToken,
        credentials?.clientCode
      );

    case 'mock':
    default:
      console.log('[ProviderFactory] Initializing Mock Market Data Provider (Demo Mode)');
      return new MockMarketDataProvider();
  }
}

export * from './MarketDataProvider.js';
export * from './MockMarketDataProvider.js';
export * from './KiteConnectProvider.js';
export * from './UpstoxDataProvider.js';
export * from './DhanDataProvider.js';
export * from './AngelOneDataProvider.js';

