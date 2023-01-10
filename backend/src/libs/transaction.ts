import * as Sentry from '@sentry/node';
import Web3 from 'web3';
import { backendConfig } from "../config";
import { logger, LoggerOptions } from '../utils';
import { Transaction } from 'web3-core';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const processTransaction = async (
  api: Web3,
  hash: string,
  loggerOptions: LoggerOptions,
) => {
  const receipt = await api.eth.getTransactionReceipt(hash, function (error, data) {
    if(error) {
     logger.info(`Could not find transaction ${error}`)
    }
    return data
  })

  console.log(receipt)
}

// scanAccount(225259);
// scanTransaction(225331);
// scanAccount(225337);