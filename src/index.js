import { Telegraf, session, Stage, Extra } from "telegraf";
import Scene from "telegraf/scenes/base";
import fs from "fs";
import messagesReply from "../messagesReply";
import config from "../config.json";

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

  return ctx.reply(
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
  await ctx.scene.enter("email");
});
issue.action("no", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Ok.");
  await ctx.scene.leave();
});

const email = new Scene("email");
email.enter((ctx) => ctx.reply("And your email, please"));
email.hears(/\S+@\S+\.\S+/, async (ctx) => {
  fs.appendFileSync("./files/list.txt", ctx.message.text + "\n");
  await ctx.reply("Ok, added.");
  return ctx.scene.leave();
});
email.on("message", (ctx) => ctx.reply("Invalid email"));

const bot = new Telegraf(config.TOKEN);
bot.start((ctx) => ctx.reply("Welcome"));

const dict = messagesReply.reduce((accumulator, item, index) => {
  item.words.forEach(word => {
    accumulator[word] = index
  });
  return accumulator;
}, {});
const words = Object.keys(dict);

bot.on("text", async (ctx, next) => {
  // console.log(ctx.update, ctx.botInfo);
  const i = words.findIndex((item) => {
    return ctx.message.text.search(new RegExp(item, "i")) >= 0;
  });
  if (i >= 0) {
    await ctx.replyWithMarkdown(messagesReply[dict[words[i]]].message, {
      reply_to_message_id: ctx.message.message_id,
    });
  }
  return next();
});

const stage = new Stage([issue, email], { ttl: 200 });
bot.use(session());
bot.use(stage.middleware());
bot.command("issue", (ctx) => ctx.scene.enter("issue"));

bot.on("new_chat_members", (ctx) => {
  let members = "";
  ctx.message.new_chat_members.forEach((member) => {
    members += "@" + member.username + " ";
  });
  ctx.reply(members + "привет");
});

bot.launch();
