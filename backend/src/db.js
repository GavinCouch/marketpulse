import Database from "better-sqlite3";

const db = new Database("marketpulse.sqlite");
db.pragma("journal_mode = WAL");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      retail_price_cents INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS price_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      condition TEXT NOT NULL DEFAULT 'new',
      platform TEXT NOT NULL DEFAULT 'unknown',
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_price_points_product_id ON price_points(product_id);
    CREATE INDEX IF NOT EXISTS idx_price_points_recorded_at ON price_points(recorded_at);
  `);
}

export default db;
