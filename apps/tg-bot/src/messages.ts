import { db } from "@spanish-football-signings/shared-bot";
import type { User } from "@spanish-football-signings/shared-types";
import type { Telegraf } from "telegraf";
import { TelegramError } from "telegraf";

const getAllUsers = db.prepare("SELECT id FROM users");
const removeUser = db.prepare("DELETE FROM users WHERE id = ?");

export const broadcastMessage = async (bot: Telegraf, message: string) => {
	const users = getAllUsers.all().map((row) => ({
		id: Number(row.id),
	})) as User[];
	const results = {
		sent: 0,
		failed: 0,
		blocked: 0,
	};

	console.log(`Starting broadcast to ${users.length} users...`);

	for (const user of users) {
		try {
			await bot.telegram.sendMessage(user.id, message);
			results.sent++;

			await new Promise((resolve) => setTimeout(resolve, 50));
		} catch (error) {
			if (error instanceof TelegramError) {
				if (error.code === 403) {
					removeUser.run(user.id);
					results.blocked++;
					console.log(`Removed blocked user: ${user.id}`);
				} else {
					console.error(
						`Telegram error for user ${user.id}:`,
						error.description || error.message,
					);
					results.failed++;
				}
			} else {
				console.error(
					`Failed to send to ${user.id}:`,
					error instanceof Error ? error.message : error,
				);
				results.failed++;
			}
		}
	}

	console.log(
		`Broadcast complete: ${results.sent} sent, ${results.failed} failed, ${results.blocked} blocked`,
	);
	return results;
};
