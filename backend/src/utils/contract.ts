import { ethers } from 'ethers';
import SELECTORS from './abis/selectors.json';
// import { ABI, dropKey } from './index';
// import Erc20Abi from './abis/Erc20Abi';
// import Erc721Abi from './abis/Erc721Abi';
// import Erc1155Abi from './abis/Erc1155Abi';

// const contractChecked = (abi: ABI, format: string[]): boolean => {
//   const fragments = abi
//     .map((fragment) => ({
//       ...fragment,
//       inputs: fragment.inputs?.map((i) => dropKey(i, 'name')),
//     }))
//     .map((fragment) => JSON.stringify(fragment));
  
//   return format
//     .reduce(
//       (prev, currentFragment) => prev && fragments.includes(currentFragment),
//       true,
//     );
// };

// export const checkIfContractIsERC20 = (abi: ABI): boolean => contractChecked(abi, Erc20Abi);
// export const checkIfContractIsERC721 = (abi: ABI): boolean => contractChecked(abi, Erc721Abi);
// export const checkIfContractIsERC1155 = (abi: ABI): boolean => contractChecked(abi, Erc1155Abi);

const findSelectors = (abi: any, pattern: any) => {
    try {
        const iface = new ethers.utils.Interface(abi);

        for (let i = 0; i < pattern.functions.length; i++) {
            try {
                iface.getFunction(pattern.functions[i]);
            } catch (_) {
                return false;
            }
        }

        for (let i = 0; i < pattern.events.length; i++) {
            try {
                iface.getEvent(pattern.events[i]);
            } catch (_) {
                return false;
            }
        }

        for (let i = 0; i < pattern.errors.length; i++) {
            try {
                iface.getError(pattern.errors[i]);
            } catch (_) {
                return false;
            }
        }

        return true;
    } catch(error) {
        return false;
    }
};

export const isErc20 = (abi: any) => {
    return findSelectors(abi, SELECTORS.erc20);
};

export const isErc721 = (abi: any) => {
    return findSelectors(abi, SELECTORS.erc721);
};

