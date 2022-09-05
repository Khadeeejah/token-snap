const {
  providers: { Web3Provider, JsonRpcProvider },
} = require('ethers');

module.exports =
  typeof wallet !== 'undefined'
    ? new Web3Provider(wallet)
    : new JsonRpcProvider({
        url: 'https://mainnet.infura.io/v3/b23062782fe64f22ae0c50ceadfdf70d',
        timeout: 2000,
        skipFetchSetup: true,
        throttleLimit: 1,
      });
