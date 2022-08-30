const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(
  'https://mainnet.infura.io/v3/b23062782fe64f22ae0c50ceadfdf70d',
);

module.exports = provider;
