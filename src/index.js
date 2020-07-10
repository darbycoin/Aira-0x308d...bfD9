import { Telegraf, session, Stage, Extra } from "telegraf";
import Scene from "telegraf/scenes/base";
import fs from "fs";
import config from "../config.json";

const bot = new Telegraf(config.TOKEN);
bot.start((ctx) => ctx.reply("Welcome"));

const issue = new Scene("issue");
issue.enter((ctx) =>
  ctx.reply("pls write your question to Robonomics Core dev team:")
);
issue.on("text", async (ctx) => {
  await ctx.telegram.forwardMessage(
    config.DEV_GROUP,
    ctx.message.chat.id,
    ctx.message.message_id
  );

  await ctx.reply(
    "Thanks! I will send it to dev team. Also, I can subscribe to you to Robonomics newslettes, if you agree and will provide your email address.",
    Extra.HTML().markup((m) =>
      m.inlineKeyboard([
        m.callbackButton("Agree", "agree"),
        m.callbackButton("No, thanks", "no"),
      ])
    )
  );
});
issue.action("agree", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.enter("email");
});
issue.action("no", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("Ok.");
  ctx.scene.leave();
});

const email = new Scene("email");
email.enter((ctx) => ctx.reply("And your email, please"));
email.hears(/\S+@\S+\.\S+/, (ctx) => {
  fs.appendFileSync("./files/list.txt", ctx.message.text + "\n");
  ctx.reply("Ok, added.");
  ctx.scene.leave();
});
email.on("message", (ctx) => ctx.reply("Invalid email"));

const stage = new Stage([issue, email], { ttl: 10 });
bot.use(session());
bot.use(stage.middleware());
bot.command("issue", (ctx) => ctx.scene.enter("issue"));

bot.launch();
