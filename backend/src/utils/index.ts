import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import Web3 from 'web3';
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

const is_account = async (api: Web3, address: string) => {
  let account_code = await api.eth.getCode(address);
  if(account_code === '0x') {
    return true
  } else {
    return false
  }
};

const sanitize = function(obj: any) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v != null)
      .map(([_, v]) => {
        if (typeof v == 'string' && v.length == 42 && v.startsWith('0x'))
          return [_, v.toLowerCase()];
        else
            return [_, v];
      }
    )
  );
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
  shortHash,
  is_account,
  sanitize
};
