import * as Sentry from '@sentry/node';
import Web3 from 'web3';
import { Client } from 'pg';
import { logger, LoggerOptions, dbParamQuery, is_account} from '../utils';
import { backendConfig } from '../config';
import { AbiItem } from 'web3-utils'
import { ethers } from 'ethers';
import SELECTORS from '../utils/abis/selectors.json';

import ERC20_ABI from '../utils/abis/erc20.json';

export const proccessContract = async (
  api: Web3 | undefined,
  address: string,
  client: Client,
  loggerOptions: LoggerOptions,
): Promise<void> =>  {
  const contract = new api.eth.Contract(ERC20_ABI as AbiItem[], address);
}