import { Telegraf } from "telegraf";
import uniswap from "./uniswap";
import stex from "./stex";
import { numberFormat } from "./tools";
import config from "../config.json";

const bot = new Telegraf(config.TOKEN);

const data = {
  uniswap: {
    priceETH: 0,
    priceUSD: 0,
    liquidity: 0,
    volume: 0,
    liquidityChange: 0,
    volumeChange: 0,
  },
  stex: {
    price: 0,
    min: 0,
    max: 0,
    volume: 0,
  },
};

async function main() {
  data.uniswap = await uniswap();
  data.stex = await stex();

  const template = `<b>Good day everyone! The regular daily state below:</b>

[<a href="https://uniswap.info/pair/0x3185626c14acb9531d19560decb9d3e5e80681b1">Uniswap</a>]
1 XRT = ${data.uniswap.priceETH} ETH ($${data.uniswap.priceUSD});
Total Liquidity $${numberFormat(data.uniswap.liquidity)} (${
    data.uniswap.liquidityChange > 0 ? "+" : ""
  }${data.uniswap.liquidityChange}%);
Volume (24hrs): $${numberFormat(data.uniswap.volume)} (${
    data.uniswap.volumeChange > 0 ? "+" : ""
  }${data.uniswap.volumeChange}%);

[<a href="https://app.stex.com/en/trade/pair/ETH/XRT/5">STEX</a>]
1 XRT = ${data.stex.price} ETH;
24h max price ${data.stex.max} ETH;
24h min price ${data.stex.min} ETH;
Volume (24hrs): $${numberFormat(data.stex.volume)};

p.s.: participate in the development of Robonomics project! Check events in the main chat of the community: t.me/robonomics
`;
  return bot.telegram.sendMessage(config.TRADE_GROUP, template, {
    parse_mode: "HTML",
  });
}
main();
