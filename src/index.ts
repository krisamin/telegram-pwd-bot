import { Bot } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is not set");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("pwd", async (ctx) => {
  const chat = ctx.chat;
  const threadId = ctx.message?.message_thread_id;

  const fields: [string, string | number | undefined][] = [
    ["chat_id", chat.id],
    ["thread_id", threadId],
    ["user_id", ctx.from?.id],
    ["username", "username" in chat ? chat.username : undefined],
    ["title", "title" in chat ? chat.title : undefined],
    ["type", chat.type],
  ];

  const present = fields.filter(
    ([, value]) => value !== undefined && value !== "",
  );

  // HTML parse mode: keys as plain text, values wrapped in <code> so a
  // single tap copies just the value. Only &, <, > need escaping.
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const body = present
    .map(
      ([key, value]) =>
        `${escapeHtml(key)}: <code>${escapeHtml(String(value))}</code>`,
    )
    .join("\n");

  await ctx.reply(body, {
    parse_mode: "HTML",
    message_thread_id: threadId,
  });
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

console.log("pwd bot starting (long polling)...");
bot.start({
  onStart: async (info) => {
    await bot.api.setMyCommands([
      { command: "pwd", description: "Show current chat info (chat_id, thread_id, etc.)" },
    ]);
    console.log(`Logged in as @${info.username}`);
  },
});

// Graceful shutdown for k8s rollouts.
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
