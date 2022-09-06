const IPool = require('../abis/pool.json');
const IERC20 = require('../abis/erc20.json');
const IERC721 = require('../abis/erc721.json');
const IERC1155 = require('../abis/erc1155.json');
const IUniswapV3Factory = require('../abis/uniswapv3factory.json');

const $ = i => p => ({ at: a => new p.Contract(i, a) });

module.exports = function (provider) {
  return {
    ERC20: $(IERC20)(provider),
    ERC721: $(IERC721)(provider),
    ERC1155: $(IERC1155)(provider),
    Pool: $(IPool)(provider),
    UniswapV3Factory: $(IUniswapV3Factory)(provider),
  };
};
