import * as Sentry from '@sentry/node';
import { Client } from 'pg';
import Web3 from 'web3';
import { BlockNumber} from "web3-core";
import { backendConfig } from "../config";
import { logger,LoggerOptions, dbParamQuery } from '../utils/index';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

// get evm block detail
const getEvmBlock = async (
  api: Web3,
  blockNumber: BlockNumber,
  loggerOptions: LoggerOptions,
) => {
  try {
    return api.eth.getBlock(blockNumber);
  } catch (error) {
    logger.error(loggerOptions, `Get Evm Block Error: ${error}`);
    Sentry.captureException(error);
  }
}

export const updateFinalized = async (
  client: Client,
  finalizedBlock: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= $1;
  `;
  try {
    await client.query(sql, [finalizedBlock]);
  } catch (error) {
    logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
    Sentry.captureException(error);
  }
};

export const logHarvestError = async (
  client: Client,
  blockNumber: number,
  error: any,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const timestamp = new Date().getTime();
  const errorString = error.toString().replace(/'/g, "''");
  const data = [blockNumber, errorString, timestamp];
  const query = `
    INSERT INTO
      harvest_error (block_number, error, timestamp)
    VALUES
      ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT
      harvest_error_pkey 
      DO NOTHING
    ;`;
  await dbParamQuery(client, query, data, loggerOptions);
};
