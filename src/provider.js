const Eth = require('web3-eth');

module.exports =
  typeof wallet !== 'undefined'
    ? new Eth(wallet)
    : new Eth('https://mainnet.infura.io/v3/b23062782fe64f22ae0c50ceadfdf70d');
