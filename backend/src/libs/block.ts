import * as Sentry from '@sentry/node';
import { ApiPromise } from '@polkadot/api';
import { Client } from 'pg';
import Web3 from 'web3';
import { BlockNumber} from "web3-core";
import { backendConfig } from "../config";
import { logger,LoggerOptions, dbParamQuery, ScanerConfig, dbQuery } from '../utils';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

// get block detail - EVM
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

// update finalized block status - Substrate
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

// add error block to database as logs - both
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

// check block healthy delete if failed - Substrate
export const healthCheck = async (
  config: ScanerConfig,
  client: Client,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  logger.info(loggerOptions, 'Starting health check');
  const query = `
    SELECT
      b.block_number,
      b.total_events,
      (SELECT COUNT(*) FROM event AS ev WHERE ev.block_number = b.block_number) AS table_total_events,
      b.total_extrinsics,
      (SELECT COUNT(*) FROM extrinsic AS ex WHERE ex.block_number = b.block_number) table_total_extrinsics
    FROM
      block AS b
    WHERE
      b.total_events > (SELECT COUNT(*) FROM event AS ev WHERE ev.block_number = b.block_number)
    OR
      b.total_extrinsics > (SELECT COUNT(*) FROM extrinsic AS ex WHERE ex.block_number = b.block_number) 
    ;`;
  const res = await dbQuery(client, query, loggerOptions);
  for (const row of res.rows) {
    logger.info(
      loggerOptions,
      `Health check failed for block #${row.block_number}, deleting block from block table!`,
    );
    await dbQuery(
      client,
      `DELETE FROM block WHERE block_number = '${row.block_number}';`,
      loggerOptions,
    );
  }
  const endTime = new Date().getTime();
  logger.debug(
    loggerOptions,
    `Health check finished in ${((endTime - startTime) / 1000).toFixed(
      config.statsPrecision,
    )}s`,
  );
};

// store chain metadata - Substrate
export const storeMetadata = async (
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  blockHash: string,
  specName: string,
  specVersion: number,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  let metadata;
  try {
    const response = await api.rpc.state.getMetadata(blockHash);
    metadata = response;
    logger.debug(loggerOptions, `Got runtime metadata at ${blockHash}!`);
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error fetching runtime metadata at ${blockHash}: ${JSON.stringify(
        error,
      )}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
  const data = [
    blockNumber,
    specName,
    specVersion,
    Object.keys(metadata)[0],
    metadata.magicNumber,
    metadata,
    timestamp,
  ];
  const query = `
    INSERT INTO runtime (
      block_number,
      spec_name,
      spec_version,
      metadata_version,
      metadata_magic_number,
      metadata,
      timestamp
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    ON CONFLICT (spec_version)
    DO UPDATE SET
      block_number = EXCLUDED.block_number
    WHERE EXCLUDED.block_number < runtime.block_number;`;
  await dbParamQuery(client, query, data, loggerOptions);
};

