import { evmProvider } from "./src/utils"

const loggerOptions = {
    selendrascan: "block",
  };
  

const blockNumber = async (block_number: number) => {
    const api = evmProvider(loggerOptions);
    const block = await api?.eth.getBlock(block_number);
    console.log(block);
  };
    
blockNumber(230711);