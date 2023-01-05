import * as Sentry from '@sentry/node';
import Web3 from 'web3';
import { backendConfig } from "../config";
import { logger, LoggerOptions } from '../utils';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const getTransaction = async (
  api: Web3,
  transactionHash: string,
  loggerOptions: LoggerOptions,
) => {
  let txn = await api.eth.getTransaction(transactionHash);
}

// scanAccount(225259);
// scanTransaction(225331);
// scanAccount(225337);