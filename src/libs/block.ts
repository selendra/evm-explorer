import { provider } from "../utils"

const blockNumber = async (block_number: number) => {
    const block = await provider.eth.getBlock(block_number);

    const data = [
        block.number,
        false,
        block.timestamp,
        block.transactions.length,
        block.transactions,
        block.receiptsRoot,
        block.size,
        block.gasUsed,
        block.gasLimit,
        block.baseFeePerGas,
        block.hash,
        block.parentHash,
        block.receiptsRoot,
        block.Nonce,
    ];

    console.log(data);
  };
    
blockNumber(1);