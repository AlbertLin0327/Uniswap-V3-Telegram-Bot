import { ethers } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import * as poolData from "./pool.json";

const data = poolData as any;

const provider = new ethers.providers.JsonRpcProvider(
  "https://polygon-rpc.com/"
);

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

export async function query(pair: string) {
  // pool address on mainnet for fee tier 0.05%
  const poolAddress = data["pool"][pair];

  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );

  async function getPoolImmutables() {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
      await Promise.all([
        poolContract.factory(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.maxLiquidityPerTick(),
      ]);

    const immutables: Immutables = {
      factory,
      token0,
      token1,
      fee,
      tickSpacing,
      maxLiquidityPerTick,
    };
    return immutables;
  }

  async function getPoolState() {
    // note that data here can be desynced if the call executes over the span of two or more blocks.
    const [liquidity, slot] = await Promise.all([
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);

    const PoolState: State = {
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

  // query the state and immutable variables of the pool
  const [immutables, state] = await Promise.all([
    getPoolImmutables(),
    getPoolState(),
  ]);

  // create instances of the Token object to represent the two tokens in the given pool
  const params = pair.split("-");

  const TokenA = new Token(
    3,
    immutables.token0,
    data["token"][params[0]]["decimals"],
    params[0],
    data["token"][params[0]]["symbol"]
  );

  const TokenB = new Token(
    3,
    immutables.token1,
    data["token"][params[1]]["decimals"],
    params[1],
    data["token"][params[1]]["symbol"]
  );

  // create an instance of the pool object for the given pool
  const poolExample = new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(), //note the description discrepancy - sqrtPriceX96 and sqrtRatioX96 are interchangable values
    state.liquidity.toString(),
    state.tick
  );

  return poolExample;
}
