
// @ts-check
import * as Sentry from '@sentry/node';
import { logger, ScanerConfig, wait, evmProvider, getClient, dbQuery } from '../utils';
import { harvestEvmBlocks } from '../libs/block';
import { backendConfig } from '../config';

const scanerName = 'evmBlockHarvester';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const loggerOptions = {
  scaner: scanerName,
};
const config: ScanerConfig = backendConfig.scaners.find(
  ({ name }) => name === scanerName,
);

const scaner = async (delayedStart: boolean) => {
  if (delayedStart) {
    logger.info(
      loggerOptions,
      `Delaying evm block harvester scaner start for ${config.startDelay / 1000}s`,
    );
    await wait(config.startDelay);
  }

  logger.info(loggerOptions, 'Starting block harvester...');
  const startTime = new Date().getTime();
  const client = await getClient(loggerOptions);

  const api = evmProvider(loggerOptions);

  // Get gaps from block table
  // Thanks to @miguelmota: https://gist.github.com/miguelmota/6d40be2ecb083507de1d073443154610
  const sqlSelect = `
  SELECT
    gap_start, gap_end FROM (
      SELECT
        block_number + 1 AS gap_start,
        next_nr - 1 AS gap_end
      FROM (
        SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
        FROM evm_block
      ) nr
      WHERE nr.block_number + 1 <> nr.next_nr
  ) AS g UNION ALL (
    SELECT
      0 AS gap_start,
      block_number AS gap_end
    FROM
      evm_block
    ORDER BY
      block_number ASC
    LIMIT 1
  )
  ORDER BY gap_start DESC
  `;
  const res = await dbQuery(client, sqlSelect, loggerOptions);
  for (const row of res.rows) {
    if (!(row.gap_start === 0 && row.gap_end === 0)) {
      logger.info(
        loggerOptions,
        `Detected gap! Harvesting evm blocks from #${row.gap_end} to #${row.gap_start}`,
      );
      await harvestEvmBlocks(
        config,
        api,
        client,
        parseInt(row.gap_start, 10),
        parseInt(row.gap_end, 10),
        loggerOptions,
      );
    }
  }

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => {
    logger.error(
      loggerOptions,
      `DB disconnect error: ${JSON.stringify(error)}`,
    );
    Sentry.captureException(error);
  });

  // Log execution time
  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`,
  );
  logger.info(
    loggerOptions,
    `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`,
  );
  setTimeout(() => scaner(false), config.pollingTime);
};

scaner(true).catch((error) => {
  logger.error(loggerOptions, `Scaner error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});
