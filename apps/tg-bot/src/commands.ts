import { db } from "@repo/db";
import bot from "./bot";
import { broadcastMessage } from "./messages";

const TG_ADMIN_ID = process.env.TG_ADMIN_ID || "";

bot.start((ctx) => {
	ctx.reply("Welcome! You are now subscribed to receive updates.");
});

bot.help((ctx) => {
	ctx.reply("This bot sends you transfer updates. Use /start to subscribe.");
});

// Admin commands
const ADMIN_IDS = TG_ADMIN_ID ? [parseInt(TG_ADMIN_ID, 10)] : [];

bot.command("broadcast", async (ctx) => {
	if (!ADMIN_IDS.includes(ctx.from.id)) {
		return ctx.reply("You are not authorized to use this command.");
	}

	const message = ctx.message.text.replace("/broadcast ", "");
	if (!message || message === "/broadcast") {
		return ctx.reply(
			"Please provide a message to broadcast.\nUsage: /broadcast Your message here",
		);
	}

	await ctx.reply("Broadcasting message...");
	const results = await broadcastMessage(bot, message);
	return await ctx.reply(
		`📊 Broadcast Results:\n` +
			`✅ Sent: ${results.sent}\n` +
			`❌ Failed: ${results.failed}\n` +
			`🚫 Blocked (removed): ${results.blocked}`,
	);
});

bot.command("stats", async (ctx) => {
	if (!ADMIN_IDS.includes(ctx.from.id)) {
		return await ctx.reply("You are not authorized to use this command.");
	}

	const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
	const totalUsers =
		userCount && typeof userCount.count === "number" ? userCount.count : 0;
	return await ctx.reply(`📈 Bot Statistics:\n👥 Total Users: ${totalUsers}`);
});
