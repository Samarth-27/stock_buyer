import { MarketDataProvider } from './MarketDataProvider.js';
import { MockMarketDataProvider } from './MockMarketDataProvider.js';
import { KiteConnectProvider } from './KiteConnectProvider.js';
import { UpstoxDataProvider } from './UpstoxDataProvider.js';

export function createMarketDataProvider(): MarketDataProvider {
  const mode = (process.env.MARKET_DATA_MODE || 'mock').toLowerCase().trim();

  switch (mode) {
    case 'kite':
      console.log('[ProviderFactory] Initializing Zerodha Kite Connect provider');
      return new KiteConnectProvider();

    case 'upstox':
      console.log('[ProviderFactory] Initializing Upstox API provider');
      return new UpstoxDataProvider();

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
