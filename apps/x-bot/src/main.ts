import { db } from "@spanish-football-signings/shared-bot";
import type { Signing } from "@spanish-football-signings/shared-types";
import bot from "./bot";

const rate = 5 * 60 * 1000 + 30000;

export async function broadcastTransferUpdate(transfer: Signing) {
	const message = `
🔄 **Transfer Update**

👤 Player: ${transfer.player}
📅 Date: ${transfer.date}
🏷️ Type: ${transfer.type}
🏟️ From: ${transfer.origin}
🏟️ To: ${transfer.destination}
  `;

	await bot.v2.tweet(message);
}

async function getTransfers() {
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
	}
}

getTransfers();
setInterval(getTransfers, rate);
