require('dotenv').config();

export const backendConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  sentryDSN: process.env.SENTRY_DSN || '',
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'selendrascan',
    host: process.env.POSTGRES_HOST || '5432',
    database: process.env.POSTGRES_DATABASE || 'selendrascan',
    password: process.env.POSTGRES_PASSWORD || 'selendrascan',
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432
  },
  providerRPC: {
    evm: {
      name: 'indranet',
      rpc: 'https://rpc1-indranet.selendra.org/evm',
      chainId: 256,
      symbol: 'SEL' 
    },
    substrate: {
      name: 'selendra',
      rpc: 'ws://localhost:9944',
      symbol: 'SEL'
    }
  },
  scans: [
    {
      name: 'blockHarvester',
      enabled: !process.env.BLOCK_HARVESTER_DISABLE,
      crawler: './built/crawlers/blockHarvester.js',
      apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
      startDelay:
        parseInt(process.env.BLOCK_HARVESTER_START_DELAY_MS, 10) || 10 * 1000,
      mode: process.env.BLOCK_HARVESTER_MODE || 'chunks',
      chunkSize: parseInt(process.env.BLOCK_HARVESTER_CHUNK_SIZE, 10) || 10,
      statsPrecision: parseInt(process.env.BACKEND_STATS_PRECISION, 10) || 2,
      pollingTime:
        parseInt(process.env.BLOCK_LISTENER_POLLING_TIME_MS, 10) ||
        60 * 60 * 1000,
    }
  ],
};  