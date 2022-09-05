const Eth = require('web3-eth');
const any = require('promise.any');
const JSBI = require('jsbi');
// const { Contract, Wallet } = require('ethers');
const { Token, Price } = require('@uniswap/sdk-core');

const IPool = require('../abis/pool.json');
const IERC20 = require('../abis/erc20.json');
const IUniswapFactory = require('../abis/uniswapv3Factory.json');

// const provider = require('./provider');
const { getSqrtRatioAtTick, Q192 } = require('./sdk-slim');

const pp = new Eth(wallet);

// https://docs.uniswap.org/protocol/concepts/V3-overview/fees#pool-fees-tiers
const UNISWAP_FEE_TIERS = [0.05, 0.3, 1];

// https://docs.uniswap.org/protocol/reference/deployments
const UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

async function getPoolDetails(tokenPair) {
  tokenPair = tokenPair
    .sort((a, b) => -1 * (a.toLowerCase() < b.toLowerCase()))
    .map(a => new pp.Contract(IERC20, a));

  const factoryContract = new pp.Contract(IUniswapFactory, UNISWAP_V3_FACTORY_ADDRESS);
  const decimals = [tokenPair[0].methods.decimals().call(), tokenPair[1].methods.decimals().call()];
  try {
    return await any(
      UNISWAP_FEE_TIERS.map(feeTier =>
        (async () => {
          const fee = feeTier * 10000;
          const poolAddress = await factoryContract.methods
            .getPool(tokenPair[0]._address, tokenPair[1]._address, fee)
            .call();
          try {
            const poolContract = new pp.Contract(IPool, poolAddress);
            const [decimals0, decimals1, { sqrtPriceX96, tick }] = await Promise.all([
              ...decimals,
              poolContract.methods.slot0().call(),
            ]);
            return {
              tokens: [
                new Token(1, tokenPair[0]._address, Number(decimals0.toString())),
                new Token(1, tokenPair[1]._address, Number(decimals1.toString())),
              ],
              sqrtRatioX96: JSBI.BigInt(sqrtPriceX96),
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

async function returnTokenPairSpotPrice(tokenPair) {
  // const chainId = await wallet.request({ method: 'eth_chainId' });

  const { tokens, sqrtRatioX96, tick } = await getPoolDetails(tokenPair);

  const tickCurrentSqrtRatioX96 = getSqrtRatioAtTick(tick);
  const nextTickSqrtRatioX96 = getSqrtRatioAtTick(tick + 1);
  if (
    !(
      JSBI.greaterThanOrEqual(JSBI.BigInt(sqrtRatioX96), tickCurrentSqrtRatioX96) &&
      JSBI.lessThanOrEqual(JSBI.BigInt(sqrtRatioX96), nextTickSqrtRatioX96)
    )
  )
    throw new Error('Assertion failed: PRICE_BOUNDS');

  tokens[0].price = new Price(
    tokens[0],
    tokens[1],
    Q192,
    JSBI.multiply(sqrtRatioX96, sqrtRatioX96),
  ).toSignificant();

  tokens[1].price = new Price(
    tokens[1],
    tokens[0],
    JSBI.multiply(sqrtRatioX96, sqrtRatioX96),
    Q192,
  ).toSignificant();

  return tokens;
}

module.exports = { returnTokenPairSpotPrice };

async function main() {
  const tokenPair = [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6',
  ];
  console.log('Querying Token Price For', tokenPair);
  console.log(await returnTokenPairSpotPrice(tokenPair));
}

if (require.main === module) main();
