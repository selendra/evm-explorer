import * as Sentry from '@sentry/node';
import Web3 from 'web3';
import { Client } from 'pg';
import { logger, LoggerOptions, dbParamQuery, is_account} from '../utils';
import { backendConfig } from '../config';
import { AbiItem } from 'web3-utils'
import { ethers } from 'ethers';
import SELECTORS from '../utils/abis/selectors.json';
import { isErc20, isErc721, } from "../utils";

import ERC20_ABI from '../utils/abis/erc20.json';

export const proccessContract = async (
  api: Web3 | undefined,
  address: string,
): Promise<void> =>  {
  const erc20 = isErc721(new api.eth.Contract(ERC20_ABI as AbiItem[], address));
  const erc721 = isErc721(new api.eth.Contract(ERC20_ABI as AbiItem[], address));
  
  let contractType = 'other';

  if(erc20) {
    contractType = 'ERC20';
  }else if(erc721) {
    contractType = 'ERC721';
  }
  const byte_code = await api.eth.getCode(address);
}