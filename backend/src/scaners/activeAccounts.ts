// @ts-check
import * as Sentry from '@sentry/node';
import { logger, ScanerConfig, chunker, wait, getClient, substrateProvider, isNodeSynced } from '../utils';
import { fetchAccountIds, processAccountsChunk } from '../libs/account';
import { backendConfig } from '../config';

const scanerName = 'activeAccounts';

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

const { chunkSize } = config;

const scaner = async (delayedStart: boolean) => {
  if (delayedStart && config.startDelay) {
    logger.debug(
      loggerOptions,
      `Delaying active accounts scaner start for ${config.startDelay / 1000}s`,
    );
    await wait(config.startDelay);
  }

  logger.debug(loggerOptions, 'Running active accounts scaner...');

  const client = await getClient(loggerOptions);
  const api = await substrateProvider(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }

  const startTime = new Date().getTime();
  const accountIds = await fetchAccountIds(api);
  logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
  const chunks = chunker(accountIds, chunkSize);
  logger.info(loggerOptions, `Processing chunks of ${chunkSize} accounts`);

  for (const chunk of chunks) {
    const chunkStartTime = Date.now();
    await Promise.all(
      chunk.map((accountId: any) =>
        processAccountsChunk(api, client, accountId, loggerOptions),
      ),
    );
    const chunkEndTime = new Date().getTime();
    logger.info(
      loggerOptions,
      `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${(
        (chunkEndTime - chunkStartTime) /
        1000
      ).toFixed(config.statsPrecision)}s`,
    );
  }

  logger.debug(loggerOptions, 'Disconnecting from API');
  await api.disconnect().catch((error) => {
    logger.error(
      loggerOptions,
      `API disconnect error: ${JSON.stringify(error)}`,
    );
    Sentry.captureException(error);
  });

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => {
    logger.error(
      loggerOptions,
      `DB disconnect error: ${JSON.stringify(error)}`,
    );
    Sentry.captureException(error);
  });

  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Processed ${accountIds.length} active accounts in ${(
      (endTime - startTime) /
      1000
    ).toFixed(0)}s`,
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