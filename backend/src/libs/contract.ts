import * as Sentry from '@sentry/node';
import Web3 from 'web3';
import { Client } from 'pg';
import { logger, LoggerOptions, dbParamQuery, is_account} from '../utils';
import { backendConfig } from '../config';
import { AbiItem } from 'web3-utils'
import { isErc20, isErc721, } from "../utils";

import ERC20_ABI from '../utils/abis/erc20.json';

export const proccessContract = async (
  api: Web3 | undefined,
  client: Client,
  address: string,
  timestamp: any,
  loggerOptions: LoggerOptions,
): Promise<void> =>  {
  const erc20 = isErc721(new api.eth.Contract(ERC20_ABI as AbiItem[], address));
  const erc721 = isErc20(new api.eth.Contract(ERC20_ABI as AbiItem[], address));
  
  let contractType = 'other';

  if(erc20) {
    contractType = 'ERC20';
  }else if(erc721) {
    contractType = 'ERC721';
  }
  const byteCode = await api.eth.getCode(address);

  let data = [
    address,
    "byteCode",
    contractType,
    timestamp,
  ];

  const sql = `INSERT INTO smart_contract (
    account_id,
    bytecode,
    contract_type,
    timestamp
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  )
    ON CONFLICT (account_id)
    DO UPDATE SET
      bytecode = EXCLUDED.bytecode,
      contract_type = EXCLUDED.contract_type
    WHERE EXCLUDED.account_id = smart_contract.account_id
  ;`;

  try {
    await dbParamQuery(client, sql, data, loggerOptions);
    logger.info(
      loggerOptions,
      `Add contract info of address ${address}`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error adding contract info of address ${address}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('contract address', address);
    Sentry.captureException(error, scope);
  }
}