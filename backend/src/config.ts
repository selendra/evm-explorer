require('dotenv').config();

export const backendConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  sentryDSN: process.env.SENTRY_DSN || '',
  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'scaner',
    host: process.env.POSTGRES_HOST || '5432',
    database: process.env.POSTGRES_DATABASE || 'scaner',
    password: process.env.POSTGRES_PASSWORD || 'scaner',
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432
  },
  providerRPC: {
    evm: {
      name: process.env.EVM_NAME || 'indranet',
      rpc: process.env.EVM_PROVIDER || 'https://rpc1-indranet.selendra.org/evm',
      chainId: process.env.EVM_CHAINID || 256,
      symbol: process.env.EVM_SYMBOL || 'SEL' 
    },
    substrate: {
      name: process.env.SUBSTRATE_NAME || 'selendra',
      rpc: process.env.SUBSTRATE_PROVIDER || 'ws://localhost:9944',
      symbol: process.env.SUBSTRATE_SYMBOL || 'SEL'
    }
  },
  scaners: [
    {
      name: 'blockListener',
      enabled: process.env.BLOCK_LISTENER_ENABLE ? true : false,
      scaner: './build/scaners/blockListener.js',
      statsPrecision: parseInt(process.env.BACKEND_STATS_PRECISION, 10) || 2,
    },
    {
      name: 'blockHarvester',
      enabled: process.env.BLOCK_HARVESTER_ENABLE ? true : false,
      scaner: './build/scaners/blockHarvester.js',
      apiCustomTypes: process.env.API_CUSTOM_TYPES || '',
      startDelay:
        parseInt(process.env.BLOCK_HARVESTER_START_DELAY_MS, 10) || 10 * 1000,
      mode: process.env.BLOCK_HARVESTER_MODE || 'chunks',
      chunkSize: parseInt(process.env.BLOCK_HARVESTER_CHUNK_SIZE, 10) || 10,
      statsPrecision: parseInt(process.env.BACKEND_STATS_PRECISION, 10) || 2,
      pollingTime:
        parseInt(process.env.BLOCK_LISTENER_POLLING_TIME_MS, 10) ||
        60 * 60 * 1000,
    },
    {
      name: 'ranking',
      enabled: process.env.RANKING_ENABLE ? true : false,
      scaner: './build/scaners/ranking.js',
      startDelay:
        parseInt(process.env.RANKING_START_DELAY_MS, 10) || 15 * 60 * 1000,
      pollingTime:
        parseInt(process.env.RANKING_POLLING_TIME_MS, 10) || 5 * 60 * 1000,
      historySize: 84,
      erasPerDay: 4,
      tokenDecimals: 18,
      featuredTimespan: 60 * 60 * 24 * 7 * 2 * 1000, // 2 weeks
      statsPrecision: parseInt(process.env.BACKEND_STATS_PRECISION, 10) || 2,
    },
    {
      name: 'activeAccounts',
      enabled: process.env.ACTIVE_ACCOUNTS_ENABLE ? true : false,
      scaner: './build/scaners/activeAccounts.js',
      startDelay:
        parseInt(process.env.ACTIVE_ACCOUNTS_START_DELAY_MS, 10) || 60 * 1000,
      chunkSize: parseInt(process.env.ACTIVE_ACCOUNTS_CHUNK_SIZE, 10) || 100,
      pollingTime:
        parseInt(process.env.ACTIVE_ACCOUNTS_POLLING_TIME_MS, 10) ||
        6 * 60 * 60 * 1000, // 6 hours
      statsPrecision: parseInt(process.env.BACKEND_STATS_PRECISION, 10) || 2,
    },
  ],
};  