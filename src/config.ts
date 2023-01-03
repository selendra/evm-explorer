require('dotenv').config();

export const backendConfig = {
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
      rpc: 'wss://rpc1.selendra.org',
      symbol: 'SEL'
    }
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  sentryDSN: process.env.SENTRY_DSN || '',
};  