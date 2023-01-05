import * as Sentry from '@sentry/node';
import { ApiPromise } from '@polkadot/api';
import { Client } from 'pg';
import Web3 from 'web3';
import { BlockNumber} from "web3-core";
import { processEvmAccountInfo } from './account';
import { backendConfig } from "../config";
import { logger,LoggerOptions, dbParamQuery, ScanerConfig, dbQuery, getDisplayName, shortHash } from '../utils';

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

// harvest block from blocknumber - Substrate
export const harvestBlock = async (
  config: ScanerConfig,
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  doUpdateAccountsInfo: boolean,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const apiAt = await api.at(blockHash);
    const [
      derivedBlock,
      totalIssuance,
      runtimeVersion,
      activeEra,
      currentIndex,
    ] = await Promise.all([
      api.derive.chain.getBlock(blockHash),
      apiAt.query.balances.totalIssuance(),
      api.rpc.state.getRuntimeVersion(blockHash),
      apiAt.query?.staking.activeEra
        ? apiAt.query.staking.activeEra().then((res) => res.unwrap().index)
        : 0,
      apiAt.query.session.currentIndex(),
    ]);
    const { block, author, events: blockEvents } = derivedBlock;
    // genesis block doesn't have author
    const blockAuthor = author ? author.toString() : '';
    const { parentHash, extrinsicsRoot, stateRoot } = block.header;
    const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
    const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

    // genesis block doesn't expose timestamp or any other extrinsic
    const timestamp =
      blockNumber !== 0
        ? parseInt(
          block.extrinsics
            .find(
              ({ method: { section, method } }) =>
                section === 'timestamp' && method === 'set',
            )
            .args[0].toString(),
          10,
        )
        : 0;

    // Totals
    const totalEvents = blockEvents.length;
    const totalExtrinsics = block.extrinsics.length;

    const data = [
      blockNumber,
      false,
      blockAuthor.toString() ? blockAuthor.toString() : '',
      blockAuthorName,
      blockHash.toString(),
      parentHash.toString(),
      extrinsicsRoot.toString(),
      stateRoot.toString(),
      activeEra,
      currentIndex,
      runtimeVersion.specVersion,
      totalEvents,
      totalExtrinsics,
      totalIssuance.toString(),
      timestamp,
    ];
    const sql = `INSERT INTO substrate_block (
        block_number,
        finalized,
        block_author,
        block_author_name,
        block_hash,
        parent_hash,
        extrinsics_root,
        state_root,
        active_era,
        current_index,
        spec_version,
        total_events,
        total_extrinsics,
        total_issuance,
        timestamp
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
      )
      ON CONFLICT (block_number)
      DO UPDATE SET
        block_author = EXCLUDED.block_author,
        block_author_name = EXCLUDED.block_author_name,
        block_hash = EXCLUDED.block_hash,
        parent_hash = EXCLUDED.parent_hash,
        extrinsics_root = EXCLUDED.extrinsics_root,
        state_root = EXCLUDED.state_root
      WHERE EXCLUDED.block_number = substrate_block.block_number
      ;`;

    try {
      await dbParamQuery(client, sql, data, loggerOptions);
      const endTime = new Date().getTime();
      logger.info(
        loggerOptions,
        `Added block #${blockNumber} (${shortHash(blockHash.toString())}) in ${(
          (endTime - startTime) /
          1000
        ).toFixed(config.statsPrecision)}s`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding block #${blockNumber}: ${error}`,
      );
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }

    // Runtime upgrade
    const runtimeUpgrade = blockEvents.find(
      ({ event: { section, method } }) =>
        section === 'system' && method === 'CodeUpdated',
    );

    if (runtimeUpgrade || blockNumber === 0) {
      const specName = runtimeVersion.toJSON().specName;
      const specVersion = runtimeVersion.specVersion;

      await storeMetadata(
        api,
        client,
        blockNumber,
        blockHash.toString(),
        specName.toString(),
        specVersion.toNumber(),
        timestamp,
        loggerOptions,
      );
    }

    // await Promise.all([])

  } catch (error) {
    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
    // await logHarvestError(client, blockNumber, error, loggerOptions);
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
};

// harvest block from blocknumber - EVM
export const harvestEvmBlock = async (
  config: ScanerConfig,
  api: Web3 | undefined,
  client: Client,
  blockNumber: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  try {
    const block = await getEvmBlock(api, blockNumber, loggerOptions);
    const data = [
      block.number,
      block.miner,
      block.hash,
      block.parentHash,
      block.size,
      block.transactions.length,
      block.gasUsed,
      block.gasLimit,
      block.stateRoot,
      block.transactionsRoot,
      block.receiptsRoot,
      block.extraData,
      block.timestamp,
    ];

    const sql = `INSERT INTO evm_block (
      block_number,
      block_author,
      block_hash,
      parent_hash,
      size,
      total_transactions,
      gas_used,
      gas_limit,
      state_root,
      transactionsRoot,
      fee_recipient,
      extra_data,
      timestamp
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13
    )
      ON CONFLICT (block_number)
      DO UPDATE SET
        block_author = EXCLUDED.block_author,
        block_hash = EXCLUDED.block_hash,
        parent_hash = EXCLUDED.parent_hash,
        state_root = EXCLUDED.state_root
      WHERE EXCLUDED.block_number = evm_block.block_number
    ;`;

    try {
      // await dbParamQuery(client, sql, data, loggerOptions);
      const endTime = new Date().getTime();
      logger.info(
        loggerOptions,
        `Added block #${blockNumber} (${shortHash(block.hash.toString())}) in ${(
          (endTime - startTime) /
          1000
        ).toFixed(config.statsPrecision)}s`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding block #${blockNumber}: ${error}`,
      );
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }
    
    if (block.transactions) {
      for (let i = 0; i < block.transactions.length; i++) {
          let txn = await api.eth.getTransaction(block.transactions[i]);

          if(txn.from) {
            processEvmAccountInfo(
              api,
              client,
              txn.from,
              block.timestamp,
              block.number,
              loggerOptions
            )
          };
         
          if(txn.to) {
            processEvmAccountInfo(
              api,
              client,
              txn.to,
              block.timestamp,
              block.number,
              loggerOptions
            )
          }
      }
    }

  } catch (error) {
    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
    // await logHarvestError(client, blockNumber, error, loggerOptions);
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
}