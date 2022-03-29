import TelegramBot = require("node-telegram-bot-api");
import { query } from "./query";
import * as poolData from "./pool.json";

const data = poolData as any;

require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
const bot = new TelegramBot(token, { polling: true });

const welcomeMSG = `*Uniswap V3 Polygon Pool Tracker*

Welcome to Uniswap V3 Polygon Pool Tracker. The bot is aiming to track the information of Uniswap V3 Pool. However, the current model only support part of the pool and more update will be imposed.\


**You can use the following commands:**
/list - list current tracked pool
/tokenList - list current tracked token
/pool <pool> - track pool 
/request <pool> - request new pool
/token <token> - list info of token`;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    parse_mode: "Markdown",
  };

  bot.sendMessage(chatId, welcomeMSG, opts as any);
});

bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const resp =
    "*Currently Support Pool:*\n\n" + Object.keys(data["pool"]).join("\n");

  const opts = {
    parse_mode: "Markdown",
  };

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp, opts as any);
});

bot.onText(/\/tokenList/, (msg) => {
  const chatId = msg.chat.id;
  const resp =
    "*Currently Support Pool:*\n\n" + Object.keys(data["token"]).join("\n");

  const opts = {
    parse_mode: "Markdown",
  };

  bot.sendMessage(chatId, resp, opts as any);
});

bot.onText(/\/query (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (match![1] in data["pool"]) {
    const q = await query(match![1]);

    console.log((q as any).token0);
    const resp = `*${match![1]}* in **Uniswap V3 Polygon**\n\nToken 0: ${
      q.token0.symbol
    }\nToken 1: ${q.token1.symbol}\nfee:${q.fee}\ntick Current: ${
      q.tickCurrent
    }\n${q.token0.symbol} Price: ${q.token0Price.toSignificant()} (${
      q.token1.symbol
    })\n${q.token1.symbol} Price: ${q.token1Price.toSignificant()} (${
      q.token0.symbol
    })`;

    const opts = {
      parse_mode: "Markdown",
    };

    bot.sendMessage(chatId, resp, opts as any);
  } else {
    const resp = "Not in pool list!\n/list to see more.";
    bot.sendMessage(chatId, resp);
  }
});

bot.onText(/\/token (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (match![1] in data["token"]) {
    const tokenData = data["token"][match![1]];

    const resp = `*${match![1]}* in **Polygon**\n\nAddress: [${
      tokenData["address"]
    }](https://polygonscan.com/token/${tokenData["address"]})\nDecimal: ${
      tokenData["decimals"]
    }\nSymbol: ${tokenData["symbol"]}`;

    const opts = {
      parse_mode: "Markdown",
    };

    bot.sendMessage(chatId, resp, opts as any);
  } else {
    const resp = "Not in token list!\n/tokenList to see more.";
    bot.sendMessage(chatId, resp);
  }
});

bot.onText(/\/request (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  const fs = require("fs");
  try {
    fs.writeFileSync("./requestPool.txt", match![1]);
    bot.sendMessage(chatId, "Report to Devs!");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Failed. Try again later");
  }
});
