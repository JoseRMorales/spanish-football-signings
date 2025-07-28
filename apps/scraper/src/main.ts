import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { getTransfers } from "./lib/scraper.js";

const DB_PATH = process.env.DB_PATH || "transfers.db";

const db = new DatabaseSync(DB_PATH);
const rate = 5 * 60 * 1000;

db.exec(`
  CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    player TEXT,
    date TEXT,
    type TEXT,
    origin TEXT,
    destination TEXT,
    published_tg BOOLEAN DEFAULT FALSE,
    published_x BOOLEAN DEFAULT FALSE
  )
`);

function hashId(name: string, date: string): string {
	return crypto
		.createHash("sha256")
		.update(name + date)
		.digest("hex");
}

async function insertTransfers() {
	const transfers = await getTransfers();
	console.log("transfers", transfers);
	const insert = db.prepare(
		"INSERT OR IGNORE INTO transfers (id, player, date, type, origin, destination) VALUES (?, ?, ?, ?, ?, ?)",
	);

	for (const t of transfers) {
		const id = hashId(t.player, t.date);
		insert.run(id, t.player, t.date, t.type, t.origin, t.destination);
	}
	console.log(
		`[${new Date().toISOString()}] Inserted ${transfers.length} transfers`,
	);
}

insertTransfers();
setInterval(insertTransfers, rate);

function shutdown() {
	console.log("Shutting down, closing database...");
	db.close();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
