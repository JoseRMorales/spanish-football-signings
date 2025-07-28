import type { Signing } from "@spanish-football-signings/shared-types";
import bot from "./bot";
import db from "./db";

const rate = 5 * 60 * 1000 + 30000;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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
