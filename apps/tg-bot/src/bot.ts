import { Telegraf } from "telegraf";
import db from "./db";

const BOT_TOKEN = process.env.BOT_TOKEN || "";
if (!BOT_TOKEN) {
	throw new Error("BOT_TOKEN environment variable is not set");
}
const bot: Telegraf = new Telegraf(BOT_TOKEN);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, first_name, username) 
  VALUES (?, ?, ?)
`);

bot.use((ctx, next) => {
	if (ctx.from) {
		insertUser.run(
			ctx.from.id,
			ctx.from.first_name || null,
			ctx.from.username || null,
		);
	}
	return next();
});

function shutdown() {
	console.log("Shutting down bot, closing database...");
	bot.stop("SIGINT");
	db.close();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the bot
bot.launch();
console.log("Bot started successfully!");

export default bot;
