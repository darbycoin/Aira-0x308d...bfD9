import axios from "axios";

function ticker(id) {
  return axios
    .get(`https://api.huobi.pro/market/detail/merged?symbol=${id}`)
    .then((r) => {
      return r.data.tick;
    });
}
export default async function () {
  const xrtusdt = await ticker("xrtusdt");
  const xrteth = await ticker("xrteth");
  return {
    price: xrteth.close,
    priceUsd: xrtusdt.close,
    min: xrteth.low,
    max: xrteth.high,
    volume:
      (Math.round(xrtusdt.amount) + Math.round(xrteth.amount)) *
      Number(xrtusdt.close).toFixed(2),
  };
}
