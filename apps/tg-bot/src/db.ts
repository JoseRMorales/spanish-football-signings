import { DatabaseSync } from "node:sqlite";

const DB_PATH = process.env.DB_PATH || "transfers.db";

const db = new DatabaseSync(DB_PATH);

export default db;
