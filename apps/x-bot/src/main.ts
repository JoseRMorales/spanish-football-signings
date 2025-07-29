import { db } from "@repo/db";
import type { Signing } from "@repo/shared-types";
import bot from "./bot";

const rate = 5 * 60 * 1000 + 30000;

// Store the next available time to make requests
let nextAvailableTime = 0;

export async function broadcastTransferUpdate(
	transfer: Signing,
): Promise<void> {
	const message = `
🔄 **Transfer Update**

👤 Player: ${transfer.player}
📅 Date: ${transfer.date}
🏷️ Type: ${transfer.type}
🏟️ From: ${transfer.origin}
🏟️ To: ${transfer.destination}
  `;

	try {
		await bot.v2.tweet(message);
		// biome-ignore lint/suspicious/noExplicitAny: Safe
	} catch (error: any) {
		if (error.code === 429) {
			console.log(
				"Rate limit hit (429):",
				error.data?.detail || "Too Many Requests",
			);

			// Extract the reset time from rate limit info
			const resetTime = error.rateLimit?.day?.reset;
			if (resetTime) {
				nextAvailableTime = resetTime * 1000;
				const resetDate = new Date(nextAvailableTime);
				console.log(`Rate limit will reset at: ${resetDate.toISOString()}`);
				console.log(`Waiting until reset time before retrying...`);
			} else {
				// Fallback: wait 24 hours from now if no reset time available
				nextAvailableTime = Date.now() + 24 * 60 * 60 * 1000;
				console.log("No reset time found, waiting 24 hours from now");
			}

			throw error;
		}

		throw error;
	}
}

async function getTransfers() {
	if (nextAvailableTime > Date.now()) {
		const waitTime = nextAvailableTime - Date.now();
		const waitMinutes = Math.ceil(waitTime / (1000 * 60));
		console.log(
			`Still in rate limit cooldown. Waiting ${waitMinutes} more minutes...`,
		);
		return;
	}

	const query = db.prepare(`
    SELECT * FROM transfers
    WHERE published_x = 0
  `);

	// biome-ignore lint/suspicious/noExplicitAny: Safe
	const rows = query.all() as Record<string, any>[];
	const newSignings = rows.map((row) => ({
		id: row.id,
		player: row.player,
		date: row.date,
		type: row.type,
		origin: row.origin,
		destination: row.destination,
		published_x: row.published_x,
	})) as Signing[];

	for (const signing of newSignings) {
		try {
			await broadcastTransferUpdate(signing);

			const updateQuery = db.prepare(`
				UPDATE transfers
				SET published_x = 1
				WHERE id = ?
			`);
			updateQuery.run(signing.id);
			console.log(
				`Published transfer: ${signing.player} to ${signing.destination}`,
			);
			// biome-ignore lint/suspicious/noExplicitAny: Safe
		} catch (error: any) {
			if (error.code === 429) {
				console.log(
					`Rate limit hit while processing ${signing.player}. Stopping batch and waiting for reset.`,
				);
				break;
			} else {
				console.error(
					`Failed to publish transfer for ${signing.player}:`,
					error.message,
				);
			}
		}
	}
}

async function startBot() {
	console.log("Starting transfer bot...");

	await getTransfers();

	const intervalId = setInterval(async () => {
		try {
			await getTransfers();
		} catch (error) {
			console.error("Error in transfer processing interval:", error);
		}
	}, rate);

	process.on("SIGINT", () => {
		console.log("Received SIGINT, shutting down gracefully...");
		clearInterval(intervalId);
		process.exit(0);
	});

	process.on("SIGTERM", () => {
		console.log("Received SIGTERM, shutting down gracefully...");
		clearInterval(intervalId);
		process.exit(0);
	});
}

startBot().catch(console.error);
