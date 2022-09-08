const provider = require('./provider');
const { ERC721, ERC1155, ERC20 } = require('./interfaces')(provider);

// ERC165: https://github.com/ethereum/EIPs/blob/e82a4aaf8e12fb68b7cdf3f8e56fb4434f327cba/EIPS/eip-165.md
function computeInterfaceId(contract, methods) {
  const interfaces = contract.options.jsonInterface.filter(
    entry => entry.type === 'function' && methods.includes(entry.name),
  );
  const unmatched = methods.filter(method => !interfaces.find(entry => entry.name === method));
  if (unmatched.length > 0) throw new Error(`Missing methods: ${unmatched.join(', ')}`);
  return `0x${interfaces
    .map(entry => BigInt(entry.signature))
    // eslint-disable-next-line no-bitwise
    .reduce((a, v) => a ^ v)
    .toString(16)}`;
}

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/956d6632d9538f63c22d1eb71cda15f9848b56b7/contracts/token/ERC721/ERC721.sol#L54-L68
const ERC721Methods = [
  'balanceOf',
  'ownerOf',
  'safeTransferFrom',
  'transferFrom',
  'approve',
  'setApprovalForAll',
  'getApproved',
  'isApprovedForAll',
];

async function isERC721(address) {
  const contract = ERC721.at(address);
  return await contract.methods
    .supportsInterface(computeInterfaceId(contract, ERC721Methods))
    .call()
    .catch(() => false);
}

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/956d6632d9538f63c22d1eb71cda15f9848b56b7/contracts/token/ERC1155/ERC1155.sol#L27-L38
const ERC1155Methods = [
  'balanceOf',
  'balanceOfBatch',
  'setApprovalForAll',
  'isApprovedForAll',
  'safeTransferFrom',
  'safeBatchTransferFrom',
];

async function isERC1155(address) {
  const contract = ERC1155.at(address);
  return await contract.methods
    .supportsInterface(computeInterfaceId(contract, ERC1155Methods))
    .call()
    .catch(() => false);
}

async function isERC20(address) {
  const contract = ERC20.at(address);
  const NO_ONE = '0x0000000000000000000000000000000000000000';
  try {
    await Promise.all([
      contract.methods.symbol().estimateGas(),
      contract.methods.decimals().estimateGas(),
      contract.methods.totalSupply().estimateGas(),
      contract.methods.balanceOf(NO_ONE).estimateGas(),
      contract.methods.allowance(NO_ONE, NO_ONE).estimateGas(),
      contract.methods.approve(NO_ONE, 0).estimateGas(),
      // contract.methods.transfer(NO_ONE, 0).estimateGas(),
      // contract.methods.transferFrom(NO_ONE, NO_ONE, 0).estimateGas(),
    ]);
  } catch (e) {
    return false;
  }
  return true;
}

async function identify(address) {
  return (
    await Promise.all([
      isERC20(address).then(result => ({ isERC20: result })),
      isERC721(address).then(result => ({ isERC721: result })),
      isERC1155(address).then(result => ({ isERC1155: result })),
    ])
  ).reduce((a, v) => Object.assign(a, v));
}

module.exports = { identify, is: { ERC20: isERC20, ERC721: isERC721, ERC1155: isERC1155 } };

async function main() {
  for (const addr of [
    // USDT (ERC20) - https://etherscan.io/address/0xdAC17F958D2ee523a2206206994597C13D831ec7
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    // ENS (ERC721) - https://etherscan.io/address/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85
    '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    // OPENSEA (ERC1155) - https://etherscan.io/token/0x495f947276749ce646f68ac8c248420045cb7b5e
    '0x495f947276749Ce646f68AC8c248420045cb7b5e',
  ]) {
    console.log(`[${addr}]`);
    console.log('  isERC20:', await isERC20(addr));
    console.log('  isERC721:', await isERC721(addr));
    console.log('  isERC1155:', await isERC1155(addr));
    console.log(' ', await identify(addr));
  }
}

if (require.main === module) main();
