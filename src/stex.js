import axios from "axios";

function ticker(id) {
  return axios.get(`https://api3.stex.com/public/ticker/${id}`).then((r) => {
    return r.data.data;
  });
}
export default async function () {
  const ethusd = await ticker(407);
  const ethxrt = await ticker(1169);
  return {
    price: ethxrt.last,
    min: ethxrt.low,
    max: ethxrt.high,
    volume: (
      Math.round(ethxrt.volumeQuote) *
      ethxrt.last *
      ethusd.last
    ).toFixed(2),
  };
}
