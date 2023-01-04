import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import { evmProvider, substrateProvider, isNodeSynced } from './connect';
import { logger } from './logger';
import { LoggerOptions, ScanerConfig } from './types'
import { getClient, dbQuery, dbParamQuery } from './db'

const shortHash = (hash: string): string =>
  `${hash.substring(0, 6)}…${hash.substring(hash.length - 4, hash.length)
}`;

const wait = async (ms: number) =>
  new Promise((resolve) => {
    return setTimeout(resolve, ms);
  }
);

const getDisplayName = (identity: DeriveAccountRegistration): string => {
  if (
    identity.displayParent &&
    identity.displayParent !== '' &&
    identity.display &&
    identity.display !== ''
  ) {
    return `${identity.displayParent} / ${identity.display}`;
  }
  return identity.display || '';
};

export { 
  evmProvider,
  logger,
  LoggerOptions,
  getClient,
  dbQuery,
  dbParamQuery,
  ScanerConfig,
  getDisplayName,
  substrateProvider,
  isNodeSynced,
  wait,
  shortHash
};
