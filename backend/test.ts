// import { evmProvider } from "./src/utils"

// const loggerOptions = {
//     selendrascan: "block",
//   };
  

// const blockNumber = async (block_number: number) => {
//     const api = evmProvider(loggerOptions);
//     const block = await api?.eth.getBlock(block_number);
//     console.log(block);
//   };
    
// blockNumber(230711);

import { harvestBlock, harvestEvmBlock } from "./src/libs/block";

import * as Sentry from '@sentry/node';
import { getClient,  ScanerConfig, substrateProvider, isNodeSynced, wait, logger, evmProvider } from '../backend/src/utils';
import { backendConfig } from './src/config'

const selendraScan = 'blockHarvester';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const loggerOptions = {
  selendrascan: selendraScan,
};

const config: any = backendConfig.scans.find(
  ({ name }) => name === selendraScan,
);

const testScan = async () => {
  const client = await getClient(loggerOptions);
  // const api = await substrateProvider(loggerOptions, config.apiCustomTypes);
  const api = evmProvider(loggerOptions)

  // let synced = await isNodeSynced(api, loggerOptions);
  // while (!synced) {
  //   await wait(10000);
  //   synced = await isNodeSynced(api, loggerOptions);
  // }

  // await harvestBlock(config, api, client, 0, false, loggerOptions)
  await harvestEvmBlock(config, api, client, 5, loggerOptions);

}

testScan().catch((error) => {
  logger.error(loggerOptions, `Scan error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});