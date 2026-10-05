import { useEffect, useRef, useState, useCallback } from 'react';
import {
  WSServerMessage,
  WSClientMessage,
  StockQuote,
  OrderBook,
  ScannerResult,
  MarketAlert,
} from '@marketeye/shared';
import { soundManager } from '../services/audio.js';
import { getBackendBaseUrl } from '../services/api.js';

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  subscribeOrderBook: (symbol: string) => void;
  unsubscribeOrderBook: (symbol: string) => void;
  reconnect: () => void;
}

export interface WebSocketCallbacks {
  onTick?: (quote: StockQuote) => void;
  onOrderBook?: (orderBook: OrderBook) => void;
  onScannerSnapshot?: (results: ScannerResult[]) => void;
  onScannerTrigger?: (result: ScannerResult) => void;
  onScannerRemove?: (symbol: string, reason: string) => void;
  onAlert?: (alert: MarketAlert) => void;
}

export function useWebSocket(callbacks: WebSocketCallbacks): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const backendBase = getBackendBaseUrl();
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

    if (isGitHubPages && !backendBase && !import.meta.env.VITE_WS_URL) {
      // On static GitHub pages without a remote backend, gracefully run in offline simulation
      setIsConnecting(false);
      setIsConnected(false);
      return;
    }

    setIsConnecting(true);

    let wsUrl: string;
    if (backendBase) {
      try {
        const url = new URL(backendBase);
        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${url.host}/ws`;
      } catch {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${backendBase.replace(/^https?:\/\//, '')}/ws`;
      }
    } else if (import.meta.env.VITE_WS_URL) {
      wsUrl = import.meta.env.VITE_WS_URL as string;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // Vite proxies /ws to 3001
      wsUrl = `${protocol}//${host}/ws`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        // Subscribe to standard channels
        ['stocks', 'scanner', 'alerts'].forEach((channel) => {
          ws.send(JSON.stringify({ action: 'subscribe', channel }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const payload: WSServerMessage = JSON.parse(event.data);
          const cb = callbacksRef.current;

          switch (payload.type) {
            case 'TICK':
              cb.onTick?.(payload.data as StockQuote);
              break;
            case 'ORDER_BOOK':
              cb.onOrderBook?.(payload.data as OrderBook);
              break;
            case 'SCANNER_SNAPSHOT':
              cb.onScannerSnapshot?.(payload.data as ScannerResult[]);
              break;
            case 'SCANNER_TRIGGER':
              soundManager.playAlertChime();
              cb.onScannerTrigger?.(payload.data as ScannerResult);
              break;
            case 'SCANNER_REMOVE': {
              const data = payload.data as { symbol: string; reason: string };
              cb.onScannerRemove?.(data.symbol, data.reason);
              break;
            }
            case 'ALERT':
              cb.onAlert?.(payload.data as MarketAlert);
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        // Auto-reconnect after 3 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Connection error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WebSocket] Init failed:', err);
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const subscribeOrderBook = useCallback((symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: WSClientMessage = {
        action: 'subscribe',
        channel: 'orderbook',
        symbol,
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const unsubscribeOrderBook = useCallback((symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: WSClientMessage = {
        action: 'unsubscribe',
        channel: 'orderbook',
        symbol,
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    subscribeOrderBook,
    unsubscribeOrderBook,
    reconnect,
  };
}
