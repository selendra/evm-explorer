import { provider } from "../utils"


const balances = async (addressFrom: string) => {
  const balanceFrom = provider.utils.fromWei(await provider.eth.getBalance(addressFrom));
  
  console.log(`The balance of ${addressFrom} is: ${balanceFrom} SEL`);
};
  
balances("0x4537fDB83f86b75a808E42bb34309852e53354A9");