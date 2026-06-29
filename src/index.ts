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
  const pad = Math.max(...present.map(([key]) => key.length)) + 1;

  const body = present
    .map(([key, value]) => `${(key + ":").padEnd(pad)} ${value}`)
    .join("\n")
    // MarkdownV2 code blocks still require escaping backtick and backslash.
    .replace(/[`\\]/g, "\\$&");

  await ctx.reply("```\n" + body + "\n```", {
    parse_mode: "MarkdownV2",
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
