require('dotenv').config();

export const backendConfig = {
    postgresConnParams: {
      user: process.env.POSTGRES_USER || 'selendra',
      host: process.env.POSTGRES_HOST || '5432',
      database: process.env.POSTGRES_DATABASE || 'indranet',
      password: process.env.POSTGRES_PASSWORD || 'indranet',
      port: process.env.POSTGRES_PORT || 5432,
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    sentryDSN: process.env.SENTRY_DSN || '',
    providerRPC: {
      indranet: {
        name: 'indranet',
        rpc: 'https://rpc1-indranet.selendra.org/evm',
        chainId: 256,
        symbol: 'SEL' 
      },
    },
  };  