import axios from "axios";
import moment from "moment";

const apiUrl = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
const pairAddress = "0x3185626c14acb9531d19560decb9d3e5e80681b1";

function getBlock(time) {
  return axios
    .post(
      "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks",
      {
        query: `{
  blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: { timestamp_gt: ${time} }) {
    id
    number
    timestamp
  }
}`,
      }
    )
    .then((r) => r.data.data.blocks[0].number);
}

function getDataDay(block) {
  return axios
    .post(apiUrl, {
      query: `{
  pairs(block: {number: ${block}} where:{id:"${pairAddress}"}) {
    id
    volumeUSD
    reserveUSD
    trackedReserveETH
    token0 {
      id
      derivedETH
    }
  }
}`,
    })
    .then((r) => r.data.data.pairs[0]);
}

function getData() {
  return axios
    .post(apiUrl, {
      query: `{
  pairs(where:{id:"${pairAddress}"}) {
    id
    volumeUSD
    reserveUSD
    trackedReserveETH
    token0 {
      id
      derivedETH
    }
  }
}`,
    })
    .then((r) => r.data.data.pairs[0]);
}

function getEthPrice() {
  return axios
    .post(apiUrl, {
      query: `{
  bundles(where: { id: 1 }) {
    id
    ethPrice
  }
}`,
    })
    .then((r) => r.data.data.bundles[0].ethPrice);
}

const getPercentChange = (valueNow, value24HoursAgo) => {
  const adjustedPercentChange =
    ((valueNow - value24HoursAgo) / value24HoursAgo) * 100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

const get2DayPercentChange = (valueNow, value24HoursAgo, value48HoursAgo) => {
  let currentChange = valueNow - value24HoursAgo;
  let previousChange = value24HoursAgo - value48HoursAgo;

  const adjustedPercentChange =
    (parseFloat(currentChange - previousChange) / parseFloat(previousChange)) *
    100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

export default async function () {
  const oneDayBlock = await getBlock(
    moment.utc().subtract(1, "days").format("X")
  );
  const oneDay = await getDataDay(oneDayBlock);
  const twoDayBlock = await getBlock(
    moment.utc().subtract(2, "days").format("X")
  );
  const twoDay = await getDataDay(twoDayBlock);
  const current = await getData();
  const ethPrice = await getEthPrice();

  const liquidityChange = getPercentChange(
    current.reserveUSD,
    oneDay.reserveUSD
  );

  const volumeChange = get2DayPercentChange(
    current.volumeUSD,
    oneDay.volumeUSD,
    twoDay.volumeUSD
  );

  return {
    priceETH: Number(current.token0.derivedETH).toFixed(8),
    priceUSD: (current.token0.derivedETH * ethPrice).toFixed(2),
    liquidity: Math.round(current.trackedReserveETH * ethPrice),
    volume: Math.round(current.volumeUSD - oneDay.volumeUSD),
    liquidityChange: liquidityChange.toFixed(2),
    volumeChange: volumeChange[1].toFixed(2),
  };
}
