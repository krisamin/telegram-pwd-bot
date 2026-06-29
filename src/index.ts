import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is not set");
  process.exit(1);
}

const bot = new Bot(token);

// Only these named entities are supported by Telegram rich messages; escape
// the structural ones so values never break the HTML.
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Field = [string, string | number | undefined];

function buildFields(
  chat: { id: number; type: string; username?: string; title?: string },
  threadId: number | undefined,
  userId: number | undefined,
): Field[] {
  const fields: Field[] = [
    ["chat_id", chat.id],
    ["thread_id", threadId],
    ["user_id", userId],
    ["username", "username" in chat ? chat.username : undefined],
    ["title", "title" in chat ? chat.title : undefined],
    ["type", chat.type],
  ];
  return fields.filter(([, value]) => value !== undefined && value !== "");
}

// Rich message (Bot API 10.1+): a borderless 2-column key/value table.
function buildTableHtml(present: Field[]): string {
  const rows = present
    .map(
      ([key, value]) =>
        `<tr><td>${escapeHtml(key)}</td><td><code>${escapeHtml(
          String(value),
        )}</code></td></tr>`,
    )
    .join("");
  return `<table>${rows}</table>`;
}

// Fallback for clients/servers without rich message support.
function buildPlainHtml(present: Field[]): string {
  return present
    .map(
      ([key, value]) =>
        `${escapeHtml(key)}: <code>${escapeHtml(String(value))}</code>`,
    )
    .join("\n");
}

// One copy-to-clipboard button per field, two per row. copy_text is limited
// to 256 chars by the Bot API.
function buildKeyboard(present: Field[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  present.forEach(([key, value], i) => {
    kb.copyText(`📋 ${key}`, String(value).slice(0, 256));
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

bot.command("pwd", async (ctx) => {
  const chat = ctx.chat;
  const threadId = ctx.message?.message_thread_id;
  const present = buildFields(chat, threadId, ctx.from?.id);
  const keyboard = buildKeyboard(present);

  // Try native rich message table first; fall back to inline-code HTML if the
  // server/client doesn't support rich messages yet. Copy buttons (inline
  // keyboard) work on both paths.
  try {
    await ctx.api.sendRichMessage(chat.id, { html: buildTableHtml(present) }, {
      reply_markup: keyboard,
      ...(threadId !== undefined ? { message_thread_id: threadId } : {}),
    });
  } catch (err) {
    console.error("sendRichMessage failed, falling back to HTML:", err);
    await ctx.reply(buildPlainHtml(present), {
      parse_mode: "HTML",
      reply_markup: keyboard,
      message_thread_id: threadId,
    });
  }
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

console.log("pwd bot starting (long polling)...");
bot.start({
  onStart: async (info) => {
    await bot.api.setMyCommands([
      {
        command: "pwd",
        description: "Show current chat info (chat_id, thread_id, etc.)",
      },
    ]);
    console.log(`Logged in as @${info.username}`);
  },
});

// Graceful shutdown for k8s rollouts.
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
