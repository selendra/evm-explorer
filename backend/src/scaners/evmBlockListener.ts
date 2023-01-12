// @ts-check
import * as Sentry from '@sentry/node';
import { logger, ScanerConfig, wait, substrateProvider, evmProvider, isNodeSynced, getClient } from '../utils';
import { harvestEvmBlock } from '../libs/block';
import { backendConfig } from '../config';

const scanerName = 'blockListener';

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

const scaner = async () => {
  logger.info(loggerOptions, 'Starting evm block listener...');

  const client = await getClient(loggerOptions);
  const api = await substrateProvider(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }

  let trackedFinalizedBlock = 0;
  let initTracking = true;
  await api.rpc.chain.subscribeNewHeads(async (blockHeader) => {
    const blockNumber = blockHeader.number.toNumber();
    const evmApi = evmProvider(loggerOptions);

    try {
      await harvestEvmBlock(
        config,
        evmApi,
        client,
        blockNumber,
        loggerOptions,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding block #${blockNumber}: ${error}`,
      );
      Sentry.captureException(error);
    }
  });
};

scaner().catch((error) => {
  logger.error(loggerOptions, `Scaner error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});