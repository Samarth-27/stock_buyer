import { MarketStatusInfo, MarketSessionStatus } from '@marketeye/shared';

export function getMarketStatusInfo(
  providerName: string,
  mode: 'mock' | 'provider',
  monitoredStocksCount: number
): MarketStatusInfo {
  // Current time in IST (UTC + 5 hours 30 minutes)
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffsetMs = 5.5 * 3600000;
  const istDate = new Date(utcTime + istOffsetMs);

  const dayOfWeek = istDate.getDay(); // 0 is Sunday, 6 is Saturday
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let session: MarketSessionStatus = 'CLOSED';
  let statusLabel = 'Market Closed';
  let isLiveTradingHours = false;

  if (!isWeekend) {
    if (totalMinutes >= 540 && totalMinutes < 548) {
      // 09:00 to 09:08 IST
      session = 'PRE_OPEN';
      statusLabel = 'Pre-Open Session';
      isLiveTradingHours = true;
    } else if (totalMinutes >= 555 && totalMinutes < 930) {
      // 09:15 to 15:30 IST
      session = 'OPEN';
      statusLabel = 'Market Open';
      isLiveTradingHours = true;
    } else {
      session = 'CLOSED';
      statusLabel = 'Market Closed';
      isLiveTradingHours = false;
    }
  } else {
    statusLabel = 'Weekend Closed';
  }

  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const serverTimeIST = timeFormatter.format(now);

  return {
    status: session,
    statusLabel,
    isLiveTradingHours,
    serverTimeIST: `${serverTimeIST} IST`,
    tradingHours: '09:15 - 15:30 IST (Mon-Fri)',
    mode,
    providerName,
    monitoredStocksCount,
  };
}
