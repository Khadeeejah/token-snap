/* eslint-disable consistent-return */
/* eslint-disable prettier/prettier */
const { ethers } = require('ethers');
const { Pool } = require('@uniswap/v3-sdk');
const { Token } = require('@uniswap/sdk-core');
// const { Address } = require( 'cluster')
const constValues = require("../constant");
const addressAbi = require("../abis/uniswapv3Factory.json");
const poolAbi = require("../abis/pool.json");
const erc20Abi = require("../abis/erc20.json");
const provider = require("../config");

// const poolAddress = '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'

// const poolImmutablesAbi = [
//     'function factory() external view returns (address)',
//     'function token0() external view returns (address)',
//     'function token1() external view returns (address)',
//     'function fee() external view returns (uint24)',
//     'function tickSpacing() external view returns (int24)',
//     'function maxLiquidityPerTick() external view returns (uint128)',
//   ]

// const poolContract = new ethers.Contract(poolAddress, poolImmutablesAbi, provider)

// interface Immutables {
//     factory: Address
//     token0: Address
//     token1: Address
//     fee: number
//     tickSpacing: number
//     maxLiquidityPerTick: number
//   }

//   async function getPoolImmutables() {
//     const PoolImmutables: Immutables = {
//       factory: await poolContract.factory(),
//       token0: await poolContract.token0(),
//       token1: await poolContract.token1(),
//       fee: await poolContract.fee(),
//       tickSpacing: await poolContract.tickSpacing(),
//       maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
//     }
//     return PoolImmutables
//   }

//   getPoolImmutables().then((result) => {
//     console.log(result)
//   })

async function returnPoolAddress({ token0, token1 }) {
  const contractInstance = new ethers.Contract(
    constValues.v3ContractAddress,
    addressAbi,
    provider,
  );

  const allEvents = await contractInstance.queryFilter('PoolCreated');

  const tokenPairEvent = allEvents.filter((record) => {
    return (
      (record.args.token0 === token0 && record.args.token1 === token1) ||
      (record.args.token0 === token1 && record.args.token1 === token0)
    );
  });

  if (tokenPairEvent.length > 0) {
    return tokenPairEvent[0].args.pool;
  }
}

async function getPoolImmutables(poolAddress) {
  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider);

  const [factory, token0, token1, fee] = await Promise.all([
    poolContract.factory(),
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  const immutables = {
    factory,
    token0,
    token1,
    fee,
  };
  return immutables;
}

async function getPoolState(poolAddress) {
  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider);

  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const PoolState = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

async function returnTokenPairSpotPrice({
  poolAddress = '0x6aD1A683E09843c32D0092400613d6a590F3A949',
  token0,
  token1,
}) {
  const [immutables, state] = await Promise.all([
    getPoolImmutables(poolAddress),
    getPoolState(poolAddress),
  ]);

  const token0ContractInstance = new ethers.Contract(
    token0,
    erc20Abi,
    provider,
  );
 
  const token1ContractInstance = new ethers.Contract(
    token1,
    erc20Abi,
    provider,
  );

  const token0Decimals = await token0ContractInstance.decimals();

  const token1Decimals = await token1ContractInstance.decimals();

  const TokenA = new Token(
    3,
    immutables.token0,
    Number(token0Decimals.toString()),
  );

  const TokenB = new Token(
    3,
    immutables.token1,
    Number(token1Decimals.toString()),
  );

  const poolInstance = new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick,
  );

  return {
    token0: poolInstance.token0Price.toSignificant(),
    token1: poolInstance.token1Price.toSignificant(),
  };
}



// (async () => {
//   const poolAddr = await returnPoolAddress({token0: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', token1: '0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6'})
//   console.log("I've found the poolAddr o ", poolAddr);
//   console.log(
//     await returnTokenPairSpotPrice({
//       token0: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//       token1: '0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6',
//       poolAddress: poolAddr
//     }),
//   );
// })();
module.exports = { returnPoolAddress, returnTokenPairSpotPrice };