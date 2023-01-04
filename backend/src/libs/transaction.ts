import { evmProvider } from "../utils"

const scanTransaction = async (blocknumer: number) => {
  const block = await evmProvider.eth.getBlock(blocknumer);
  if (block.transactions) {
    for (let i = 0; i < block.transactions.length; i++) {
        let txn = block.transactions[i];
        let data = await evmProvider.eth.getTransaction(txn);
        console.log(data);
    }
  }
}

// scanAccount(225259);
// scanTransaction(225331);
// scanAccount(225337);