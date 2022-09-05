const { Contract } = require('ethers');
const erc721 = require('../abis/erc721.json');
const erc1155 = require('../abis/erc1155.json');
const erc20 = require('../abis/erc20.json');
const provider = require('./provider');

async function checkerc721compliance(address) {
  const contract = new Contract(address, erc721, provider);

  try {
    await contract.estimateGas.ownerOf(1);
    await contract.estimateGas.getApproved(1);
    //   await contract.estimateGas.isApprovedForAll();
    return true;
  } catch (err) {
    return false;
  }
}

async function checkerc1155compliance(address) {
  const contract = new Contract(address, erc1155, provider);

  try {
    await contract.estimateGas.balanceOf(1);
    await contract.estimateGas.balanceOfBatch(1);
    //   await contract.estimateGas.isApprovedForAll();
    return true;
  } catch (err) {
    return false;
  }
}

async function checkerc20compliance(address) {
  const contract = new Contract(address, erc20, provider);

  try {
    await contract.estimateGas.symbol();
    await contract.estimateGas.name();
    await contract.estimateGas.decimals();

    return true;
  } catch (err) {
    return false;
  }
}

// (async () => {
//   console.log(await checkerc721compliance('0x08BA8CBbefa64Aaf9DF25e57fE3f15eCC277Af74'))
//   console.log(await checkerc1155compliance('0x08BA8CBbefa64Aaf9DF25e57fE3f15eCC277Af74'))
// })()

module.exports = {
  checkerc721compliance,
  checkerc1155compliance,
  checkerc20compliance,
};
