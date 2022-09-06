const IERC721 = require('../abis/erc721.json');
const IERC1155 = require('../abis/erc1155.json');
const IERC20 = require('../abis/erc20.json');

const provider = require('./provider');

async function checkerc721compliance(address) {
  const contract = new provider.Contract(IERC721, address);

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
  const contract = new provider.Contract(IERC1155, address);

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
  const contract = new provider.Contract(IERC20, address);

  try {
    await contract.estimateGas.symbol();
    await contract.estimateGas.name();
    await contract.estimateGas.decimals();

    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  checkerc721compliance,
  checkerc1155compliance,
  checkerc20compliance,
};

async function main() {
  console.log(await checkerc721compliance('0x08BA8CBbefa64Aaf9DF25e57fE3f15eCC277Af74'));
  console.log(await checkerc1155compliance('0x08BA8CBbefa64Aaf9DF25e57fE3f15eCC277Af74'));
}

if (require.main === module) main();
