import { Bot } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is not set");
  process.exit(1);
}

const bot = new Bot(token);

function escapeMarkdown(value: string): string {
  // Telegram legacy Markdown: escape the characters that break parsing.
  return value.replace(/([_*`\[])/g, "\\$1");
}

bot.command("pwd", async (ctx) => {
  const chat = ctx.chat;
  const threadId = ctx.message?.message_thread_id;

  const lines: string[] = [
    `*Chat ID:* \`${chat.id}\``,
    `*Type:* ${chat.type}`,
  ];

  if ("title" in chat && chat.title) {
    lines.push(`*Title:* ${escapeMarkdown(chat.title)}`);
  }
  if ("username" in chat && chat.username) {
    lines.push(`*Username:* @${chat.username}`);
  }
  if (threadId !== undefined) {
    lines.push(`*Thread ID:* \`${threadId}\``);
  }
  if (ctx.from) {
    lines.push(`*Your user ID:* \`${ctx.from.id}\``);
  }

  await ctx.reply(lines.join("\n"), {
    parse_mode: "Markdown",
    message_thread_id: threadId,
  });
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

console.log("pwd bot starting (long polling)...");
bot.start({
  onStart: (info) => console.log(`Logged in as @${info.username}`),
});

// Graceful shutdown for k8s rollouts.
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
