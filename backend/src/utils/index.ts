import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import Web3 from 'web3';
import { evmProvider, substrateProvider, isNodeSynced } from './connect';
import { logger } from './logger';
import { 
  LoggerOptions, ScanerConfig, IndexedBlockEvent, 
  IndexedBlockExtrinsic, IdentityInfo, CommisionHistoryItem,
  ClusterInfo, 
} from './types'
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

// Return array chunks of n size
const chunker = (a: any[], n: number): any[] =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) =>
    a.slice(i * n, i * n + n),
  );

// Return a reverse ordered array filled from range
const reverseRange = (
  start: number,
  stop: number,
  step: number,
): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => stop - i * step);

// Return filled array from range
const range = (start: number, stop: number, step: number): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

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
  sanitize,
  chunker,
  IndexedBlockEvent,
  IndexedBlockExtrinsic,
  IdentityInfo,
  CommisionHistoryItem,
  ClusterInfo,
  reverseRange,
  range
};
