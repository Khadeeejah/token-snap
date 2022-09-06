const provider = require('./provider');
const { ERC721, ERC1155, ERC20 } = require('./interfaces')(provider);

async function checkerc721compliance(address) {
  const contract = ERC721.at(address);

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
  const contract = ERC1155.at(address);

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
  const contract = ERC20.at(address);

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
