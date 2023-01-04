import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import { evmProvider } from './connect';
import { logger } from './logger';
import { LoggerOptions, ScanerConfig } from './types'
import { getClient, dbQuery, dbParamQuery } from './db'

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
  getDisplayName
};
