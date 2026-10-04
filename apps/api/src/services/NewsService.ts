import {
  StockNewsItem,
  MarketAlert,
  MONITORED_NSE_STOCKS,
  analyzeNewsSentiment,
} from '@marketeye/shared';
import { IRepository } from '../storage/repository.js';
import { AppWebSocketServer } from '../websocket/wsServer.js';

export class NewsService {
  private repository: IRepository;
  private wsServerRef: { current: AppWebSocketServer | null };
  private newsCache: Map<string, StockNewsItem[]> = new Map();
  private processedNewsIds: Set<string> = new Set();
  private pollTimer: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;

  constructor(
    repository: IRepository,
    wsServerRef: { current: AppWebSocketServer | null }
  ) {
    this.repository = repository;
    this.wsServerRef = wsServerRef;
  }

  async init(): Promise<void> {
    console.log('[NewsService] Initializing Financial News & Sentiment Engine...');
    // Initial fetch for top priority stocks first to be fast
    await this.refreshNewsForSymbols(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK']);

    // Schedule background background scans every 4 minutes
    this.pollTimer = setInterval(() => {
      this.refreshAllNews().catch((err) => {
        console.error('[NewsService] Periodic news refresh failed:', err.message);
      });
    }, 4 * 60 * 1000);

    // Background scan for the rest of stocks shortly after startup
    setTimeout(() => {
      this.refreshAllNews().catch(() => {});
    }, 5000);
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async getNewsForStock(symbol: string): Promise<StockNewsItem[]> {
    const s = symbol.toUpperCase().trim();
    if (this.newsCache.has(s)) {
      return this.newsCache.get(s)!;
    }

    // On-demand fetch if not cached
    const items = await this.fetchLiveNewsForSymbol(s);
    this.newsCache.set(s, items);
    return items;
  }

  async getAllMarketNews(limit = 30): Promise<StockNewsItem[]> {
    const all: StockNewsItem[] = [];
    for (const items of this.newsCache.values()) {
      all.push(...items);
    }

    // Sort by publication date descending
    all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return all.slice(0, limit);
  }

  async refreshAllNews(): Promise<void> {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      console.log('[NewsService] Refreshing live financial news for monitored NSE equities...');
      const symbols = MONITORED_NSE_STOCKS.map((s) => s.symbol);
      await this.refreshNewsForSymbols(symbols);
    } finally {
      this.isScanning = false;
    }
  }

  private async refreshNewsForSymbols(symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      try {
        const items = await this.fetchLiveNewsForSymbol(symbol);
        this.newsCache.set(symbol, items);

        // Check for high-impact breaking news and fire alerts
        for (const item of items) {
          if (this.processedNewsIds.has(item.id)) continue;
          this.processedNewsIds.add(item.id);

          // If high impact or significant sentiment deviation, generate an alert
          if (item.impact === 'HIGH' || Math.abs(item.sentimentScore) >= 0.6) {
            await this.dispatchNewsAlert(item);
          }
        }
      } catch (err: any) {
        console.warn(`[NewsService] Failed to fetch news for ${symbol}:`, err.message);
      }
    }
  }

  private async fetchLiveNewsForSymbol(symbol: string): Promise<StockNewsItem[]> {
    const stock = MONITORED_NSE_STOCKS.find((s) => s.symbol === symbol);
    const query = stock
      ? `"${stock.companyName}" stock news OR share price`
      : `${symbol} NSE stock news`;

    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!res.ok) return [];

      const xml = await res.text();
      return this.parseRssXml(xml, symbol);
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseRssXml(xml: string, symbol: string): StockNewsItem[] {
    const items: StockNewsItem[] = [];
    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6);

    for (const match of itemMatches) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const rawTitle = titleMatch ? titleMatch[1] : '';
      const cleanTitle = this.decodeHtmlEntities(
        rawTitle.replace('<![CDATA[', '').replace(']]>', '').trim()
      );

      const link = linkMatch ? linkMatch[1].trim() : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      const source = sourceMatch ? this.decodeHtmlEntities(sourceMatch[1].trim()) : 'Financial News';

      if (!cleanTitle) continue;

      const sentimentAnalysis = analyzeNewsSentiment(cleanTitle);
      const id = `news-${symbol}-${Buffer.from(cleanTitle).toString('base64').substring(0, 16)}`;

      items.push({
        id,
        symbol,
        title: cleanTitle,
        link,
        source,
        pubDate: new Date(pubDate).toISOString(),
        sentiment: sentimentAnalysis.sentiment,
        sentimentScore: sentimentAnalysis.sentimentScore,
        impact: sentimentAnalysis.impact,
        keywords: sentimentAnalysis.matchedKeywords,
      });
    }

    return items;
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }

  private async dispatchNewsAlert(item: StockNewsItem): Promise<void> {
    try {
      const sentimentEmoji = item.sentiment === 'BULLISH' ? '🟢 Bullish' : item.sentiment === 'BEARISH' ? '🔴 Bearish' : '⚪ Neutral';
      const alert: MarketAlert = {
        id: `alert-news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: item.symbol,
        type: 'NEWS_ALERT',
        title: `News Alert: ${item.symbol} (${sentimentEmoji})`,
        message: item.title,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: {
          sentiment: item.sentiment,
          sentimentScore: item.sentimentScore,
          impact: item.impact,
          source: item.source,
          url: item.link,
          keywords: item.keywords,
        },
      };

      await this.repository.addAlert(alert);
      console.log(`[NewsService] 🚨 Dispatched News Alert for ${item.symbol}: ${item.title.substring(0, 60)}...`);

      // Broadcast alert over WebSocket
      if (this.wsServerRef.current) {
        this.wsServerRef.current.broadcastAlert(alert);
      }
    } catch (err: any) {
      console.error('[NewsService] Failed to dispatch news alert:', err.message);
    }
  }
}
