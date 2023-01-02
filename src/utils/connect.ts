const Web3 = require('web3');
import { backendConfig } from "../config";

export const provider = new Web3(backendConfig.providerRPC.indranet.rpc); 