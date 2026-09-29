import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  WSClientMessage,
  WSServerMessage,
  StockQuote,
  OrderBook,
  ScannerResult,
  MarketAlert,
} from '@marketeye/shared';
import { ScannerEngine } from '../scanner/ScannerEngine.js';
import { MarketDataProvider } from '../providers/MarketDataProvider.js';

interface ClientContext {
  ws: WebSocket;
  isAlive: boolean;
  subscriptions: Set<string>; // e.g. 'stocks', 'scanner', 'alerts', 'orderbook:RELIANCE'
}

export class AppWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<ClientContext> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private scannerEngine: ScannerEngine;
  private provider: MarketDataProvider;
  private unsubTick: (() => void) | null = null;
  private unsubOrderBook: (() => void) | null = null;

  constructor(server: HttpServer, scannerEngine: ScannerEngine, provider: MarketDataProvider) {
    this.scannerEngine = scannerEngine;
    this.provider = provider;
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupServer();
    this.setupListeners();
  }

  setProvider(newProvider: MarketDataProvider): void {
    if (this.unsubTick) this.unsubTick();
    if (this.unsubOrderBook) this.unsubOrderBook();

    this.provider = newProvider;
    this.bindProviderListeners();

    // Broadcast provider change to all connected clients
    this.clients.forEach((client) => {
      this.sendToClient(client.ws, {
        type: 'CONNECTED',
        data: {
          message: 'Connected to MarketEye Real-time Feed',
          isMock: this.provider.isMock,
          provider: this.provider.name,
          status: this.provider.isConnected() ? 'Connected' : 'Unavailable',
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientCtx: ClientContext = {
        ws,
        isAlive: true,
        subscriptions: new Set(['stocks', 'scanner', 'alerts']), // Auto-subscribe to standard feeds
      };
      this.clients.add(clientCtx);

      // Send initial welcome & snapshot
      this.sendToClient(ws, {
        type: 'CONNECTED',
        data: {
          message: 'Connected to MarketEye Real-time Feed',
          isMock: this.provider.isMock,
          provider: this.provider.name,
          status: this.provider.isConnected() ? 'Connected' : 'Unavailable',
        },
        timestamp: new Date().toISOString(),
      });

      // Send active scanner results snapshot
      const activeScannerResults = this.scannerEngine.getActiveResults();
      this.sendToClient(ws, {
        type: 'SCANNER_SNAPSHOT',
        data: activeScannerResults,
        timestamp: new Date().toISOString(),
      });

      ws.on('pong', () => {
        clientCtx.isAlive = true;
      });

      ws.on('message', (data: Buffer | string) => {
        try {
          const message: WSClientMessage = JSON.parse(data.toString());
          this.handleClientMessage(clientCtx, message);
        } catch (err) {
          this.sendToClient(ws, {
            type: 'ERROR',
            data: { message: 'Invalid WebSocket JSON payload' },
            timestamp: new Date().toISOString(),
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientCtx);
      });

      ws.on('error', (err) => {
        console.warn('[WebSocket] Client socket error:', err.message);
        this.clients.delete(clientCtx);
      });
    });

    // Heartbeat every 25 seconds
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 25000);
  }

  private handleClientMessage(client: ClientContext, msg: WSClientMessage): void {
    if (msg.action === 'ping') {
      this.sendToClient(client.ws, {
        type: 'PONG',
        data: { serverTime: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (msg.action === 'subscribe') {
      if (msg.channel === 'orderbook' && msg.symbol) {
        const key = `orderbook:${msg.symbol.toUpperCase()}`;
        client.subscriptions.add(key);
        // Immediately reply with current order book
        this.provider.getOrderBook(msg.symbol).then((ob) => {
          if (ob) {
            this.sendToClient(client.ws, {
              type: 'ORDER_BOOK',
              data: ob,
              timestamp: new Date().toISOString(),
            });
          }
        });
      } else if (msg.channel) {
        client.subscriptions.add(msg.channel);
      }
    } else if (msg.action === 'unsubscribe') {
      if (msg.channel === 'orderbook' && msg.symbol) {
        client.subscriptions.delete(`orderbook:${msg.symbol.toUpperCase()}`);
      } else if (msg.channel) {
        client.subscriptions.delete(msg.channel);
      }
    }
  }

  private bindProviderListeners(): void {
    this.unsubTick = this.provider.onTick((quote: StockQuote) => {
      this.broadcastChannel('stocks', {
        type: 'TICK',
        data: quote,
        timestamp: new Date().toISOString(),
      });
    });

    this.unsubOrderBook = this.provider.onOrderBookUpdate((ob: OrderBook) => {
      const channel = `orderbook:${ob.symbol.toUpperCase()}`;
      this.broadcastChannel(channel, {
        type: 'ORDER_BOOK',
        data: ob,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupListeners(): void {
    this.bindProviderListeners();

    // Listen to scanner engine events
    this.scannerEngine.addListener({
      onTrigger: (result: ScannerResult, alert: MarketAlert) => {
        this.broadcastChannel('scanner', {
          type: 'SCANNER_TRIGGER',
          data: result,
          timestamp: new Date().toISOString(),
        });
        this.broadcastChannel('alerts', {
          type: 'ALERT',
          data: alert,
          timestamp: new Date().toISOString(),
        });
      },
      onRemove: (symbol: string, reason: string) => {
        this.broadcastChannel('scanner', {
          type: 'SCANNER_REMOVE',
          data: { symbol, reason },
          timestamp: new Date().toISOString(),
        });
      },
      onUpdate: (results: ScannerResult[]) => {
        this.broadcastChannel('scanner', {
          type: 'SCANNER_SNAPSHOT',
          data: results,
          timestamp: new Date().toISOString(),
        });
      },
    });
  }

  private sendToClient(ws: WebSocket, payload: WSServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  private broadcastChannel(channel: string, payload: WSServerMessage): void {
    const raw = JSON.stringify(payload);
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(raw);
      }
    });
  }

  close(): void {
    if (this.unsubTick) this.unsubTick();
    if (this.unsubOrderBook) this.unsubOrderBook();
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.wss.close();
  }
}
