import * as Sentry from '@sentry/node';
import Web3 from 'web3';
import { backendConfig } from "../config";
import { logger, LoggerOptions, dbParamQuery } from '../utils';
import { Client } from 'pg';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const processTransaction = async (
  api: Web3,
  client: Client, 
  hash: string,
  amount: string,
  timestamp: any,
  loggerOptions: LoggerOptions,
) => {
  const receipt = await api.eth.getTransactionReceipt(hash, function (error, data) {
    if(error) {
     logger.info(`Could not find transaction ${error}`)
    }
    return data
  })

  let data = [
    receipt.transactionHash,
    receipt.transactionIndex,
    receipt.status,
    receipt.blockNumber,
    receipt.from,
    receipt.to,
    amount,
    timestamp,
  ];

  const sql = `INSERT INTO evm_transaction (
    transactio_hash,
    transactio_index,
    transactio_status,
    block_height,
    transaction_from,
    transaction_to,
    amount,
    timestamp
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
  )
    ON CONFLICT (transactio_hash)
    DO UPDATE SET
      transactio_index = EXCLUDED.transactio_index,
      transactio_status = EXCLUDED.transactio_status,
      block_height = EXCLUDED.block_height,
      transaction_from = EXCLUDED.transaction_from,
      transaction_to = EXCLUDED.transaction_to,
      amount = EXCLUDED.amount
    WHERE EXCLUDED.transactio_hash = evm_transaction.transactio_hash
  ;`;

  try {
    await dbParamQuery(client, sql, data, loggerOptions);
    logger.info(
      loggerOptions,
      `Add transaction info at block ${receipt.blockNumber}`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error adding transaction info at block ${receipt.blockNumber}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', receipt.blockNumber);
    Sentry.captureException(error, scope);
  }
}
