export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MarketEye REST API',
    version: '1.0.0',
    description:
      'Autonomous Stock Market Scanner for Indian Equity Markets (NSE). Real-time scanning, order-book depth analysis, and threshold alerting.',
    contact: {
      name: 'MarketEye Engineering',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Local Development Server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health and status',
        responses: {
          '200': {
            description: 'Health status OK',
          },
        },
      },
    },
    '/market-status': {
      get: {
        summary: 'Get Indian stock market session and server time',
        responses: {
          '200': {
            description: 'Market session status',
          },
        },
      },
    },
    '/stocks': {
      get: {
        summary: 'List all monitored NSE stocks with latest quote and buy/sell metrics',
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by symbol or company name',
          },
        ],
        responses: {
          '200': {
            description: 'Array of stock quotes',
          },
        },
      },
    },
    '/stocks/{symbol}': {
      get: {
        summary: 'Get detailed quote and metrics for a single stock',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Stock details' },
          '404': { description: 'Stock not found' },
        },
      },
    },
    '/stocks/{symbol}/order-book': {
      get: {
        summary: 'Get 5-level market depth and buy/sell quantities',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Order book with top 5 bids/asks' },
          '404': { description: 'Stock not found' },
        },
      },
    },
    '/stocks/{symbol}/history': {
      get: {
        summary: 'Get historical OHLC candlestick series',
        parameters: [
          { name: 'symbol', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'interval', in: 'query', schema: { type: 'string', enum: ['1m', '5m', '15m', '1h', '1D'] } },
          { name: 'range', in: 'query', schema: { type: 'string', enum: ['1d', '5d', '1mo', '1y'] } },
        ],
        responses: {
          '200': { description: 'Historical candles array' },
        },
      },
    },
    '/scanner/results': {
      get: {
        summary: 'Get currently surfaced stocks meeting scanner threshold conditions',
        responses: {
          '200': { description: 'List of surfaced stocks with explanations' },
        },
      },
    },
    '/scanner/config': {
      get: {
        summary: 'Get active scanner rule configuration',
        responses: {
          '200': { description: 'Active scanner configuration' },
        },
      },
      put: {
        summary: 'Update scanner thresholds and filters',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  buyThreshold: { type: 'number', example: 62.5 },
                  sellThreshold: { type: 'number', example: 37.5 },
                  minVolume: { type: 'number', example: 10000 },
                  minPriceChange: { type: 'number', example: -2.0 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated scanner configuration' },
        },
      },
    },
    '/watchlist': {
      get: {
        summary: 'Get watchlist symbols and live quotes',
        responses: {
          '200': { description: 'Array of watched stocks' },
        },
      },
      post: {
        summary: 'Add a stock to watchlist',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbol'],
                properties: {
                  symbol: { type: 'string', example: 'RELIANCE' },
                  notes: { type: 'string', example: 'Core portfolio' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Added to watchlist' },
        },
      },
    },
    '/watchlist/{symbol}': {
      delete: {
        summary: 'Remove stock from watchlist',
        parameters: [
          { name: 'symbol', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Removed from watchlist' },
        },
      },
    },
    '/alerts': {
      get: {
        summary: 'Get recent scanner alerts',
        responses: {
          '200': { description: 'List of alerts' },
        },
      },
      delete: {
        summary: 'Clear alert history',
        responses: {
          '204': { description: 'Alerts cleared' },
        },
      },
    },
  },
};
