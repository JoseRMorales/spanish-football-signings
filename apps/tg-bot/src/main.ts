import type { Signing } from "@repo/shared-types";
import bot from "./bot";
import "./commands";
import { db } from "@repo/db";
import type { SupportedLang } from "@repo/strings";
import { getTranslation } from "@repo/strings";
import { broadcastMessage } from "./messages";

const LANGUAGE = (process.env.LANGUAGE || "en") as SupportedLang;
const t = getTranslation(LANGUAGE);

const rate = 5 * 60 * 1000 + 15000;

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
${t("transfer")}

${t("player")}: ${transfer.player}
${t("date")}: ${transfer.date}
${t("type")}: ${transfer.type}
${t("origin")}: ${transfer.origin}
${t("destination")}: ${transfer.destination}

${t("inscriptions")} ${t("spanishLeague")} #${transfer.destination.replace(
		/\s+/g,
		"",
	)}
`;
	return await broadcastMessage(bot, message);
}

async function getTransfers() {
	const query = db.prepare(`
    SELECT * FROM transfers
    WHERE published_tg = 0
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
		published_tg: row.published_tg,
	})) as Signing[];

	for (const signing of newSignings) {
		await broadcastTransferUpdate(signing);
		const updateQuery = db.prepare(`
      UPDATE transfers
      SET published_tg = 1
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
