import fs from 'fs';
import Web3 from 'web3';
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as Sentry from '@sentry/node';
import { backendConfig } from "../config";
import { logger,LoggerOptions } from './index';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const evmProvider = (loggerOptions: LoggerOptions) => {
  try {
    logger.debug(loggerOptions, `Connecting to ${backendConfig.providerRPC.evm.rpc}`);
    return new Web3(backendConfig.providerRPC.evm.rpc);
  } catch (error) {
    logger.error(loggerOptions, `Got error from provider: ${error}`);
    Sentry.captureException(error);
  }
}

export const substrateProvider = async (
  loggerOptions: LoggerOptions,
  apiCustomTypes: string | undefined,
): Promise<ApiPromise> => {
  let api;

  logger.debug(loggerOptions, `Connecting to ${backendConfig.providerRPC.substrate.rpc}`);
  const provider = new WsProvider(backendConfig.providerRPC.substrate.rpc);

  provider.on('disconnected', () =>
    logger.error(
      loggerOptions,
      `Got disconnected from provider ${backendConfig.providerRPC.substrate.rpc}`,
    ),
  );

  provider.on('error', (error) =>
    logger.error(loggerOptions, `Got error from provider: ${error}!`),
  );

  if (apiCustomTypes && apiCustomTypes !== '') {
    const types = JSON.parse(
      fs.readFileSync(`./src/types/${apiCustomTypes}`, 'utf8'),
    );
    api = new ApiPromise({ provider, types });
  } else {
    api = new ApiPromise({ provider });
  }

  api.on('disconnected', () =>
    logger.error(loggerOptions, 'Got disconnected from API!'),
  );
  api.on('error', (error) =>
    logger.error(loggerOptions, `Got error from API: ${error}`),
  );

  await api.isReady;
  return api;
};

export const isNodeSynced = async (
  api: ApiPromise,
  loggerOptions: LoggerOptions,
): Promise<boolean> => {
  let node;
  try {
    node = await api.rpc.system.health();
  } catch (error) {
    logger.error(loggerOptions, "Can't query node status");
    Sentry.captureException(error);
  }
  if (node && node.isSyncing.eq(false)) {
    logger.debug(loggerOptions, 'Node is synced!');
    return true;
  }
  logger.debug(loggerOptions, 'Node is NOT synced!');
  return false;
};