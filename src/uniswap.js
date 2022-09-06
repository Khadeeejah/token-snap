const any = require('promise.any');
const JSBI = require('jsbi');

const IPool = require('../abis/pool.json');
const IERC20 = require('../abis/erc20.json');
const IUniswapFactory = require('../abis/uniswapv3Factory.json');

const SDK = require('./v3-sdk-slim');
const provider = require('./provider');

async function getPoolDetails(tokenPair) {
  tokenPair = tokenPair.sort((a, b) => -1 * (a.toLowerCase() < b.toLowerCase()));
  const factoryContract = new provider.Contract(IUniswapFactory, SDK.V3_FACTORY_ADDRESS);
  const decimals = tokenPair.map(addr => new provider.Contract(IERC20, addr).methods.decimals().call());
  try {
    return await any(
      SDK.FEE_TIERS.map(feeTier =>
        (async () => {
          const poolAddress = await factoryContract.methods
            .getPool(tokenPair[0], tokenPair[1], feeTier * 10000)
            .call();
          try {
            const poolContract = new provider.Contract(IPool, poolAddress);
            const { sqrtPriceX96, tick } = await poolContract.methods.slot0().call();
            return {
              tokens: [
                { address: tokenPair[0], decimals: JSBI.BigInt(await decimals[0]) },
                { address: tokenPair[1], decimals: JSBI.BigInt(await decimals[1]) },
              ],
              sqrtPriceX96: JSBI.BigInt(sqrtPriceX96),
              tick,
            };
          } catch (err) {
            err.poolAddress = poolAddress;
            throw err;
          }
        })(),
      ),
    );
  } catch (err) {
    err.tokenPair = tokenPair;
    throw err;
  }
}

async function getTokenPairSpotPrice(tokenPair) {
  const { tokens, sqrtPriceX96, tick } = await getPoolDetails(tokenPair);

  return {
    tokens: [tokens[0].address, tokens[1].address],
    price: SDK.computePoolPrice(tokens[0].decimals, tokens[1].decimals, sqrtPriceX96, tick),
  };
}

module.exports = { getTokenPairSpotPrice };

async function main() {
  const tokenPair = [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6',
  ];
  console.log('Querying Token Price For', tokenPair);
  console.log(await getTokenPairSpotPrice(tokenPair));
}

if (require.main === module) main();
