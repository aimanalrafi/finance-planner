import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(path.join(DATA_DIR, "finance.db"));
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    mode TEXT NOT NULL DEFAULT 'solo',              -- 'solo' | 'household'
    framework TEXT NOT NULL DEFAULT '50/30/20',     -- '50/30/20' | '70/20/10' | 'zero' | 'pyf' | 'custom'
    needs_pct REAL NOT NULL DEFAULT 50,
    wants_pct REAL NOT NULL DEFAULT 30,
    savings_pct REAL NOT NULL DEFAULT 20,
    onboarded INTEGER NOT NULL DEFAULT 0,
    surprise_alert_pct REAL NOT NULL DEFAULT 5,
    tour_seen INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR'
  );

  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY,                          -- 1 and 2
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS income_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,                             -- 'YYYY-MM'
    person_id INTEGER NOT NULL REFERENCES persons(id),
    name TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_income_month ON income_sources(month);

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bucket TEXT NOT NULL,                            -- 'needs' | 'wants' | 'savings'
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'category',
    owner_tag TEXT,                                  -- 'p1' | 'p2' | 'joint' | NULL
    is_buffer INTEGER NOT NULL DEFAULT 0,
    invest_type TEXT,                                -- e.g. 'stocks' | 'property' for savings bucket
    archived INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0,
    auto_paid INTEGER NOT NULL DEFAULT 0            -- fixed costs (rent etc.): always counted as paid, no manual logging
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    planned REAL NOT NULL DEFAULT 0,
    UNIQUE(month, category_id)
  );
  CREATE INDEX IF NOT EXISTS idx_plans_month ON plans(month);

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    spent_on TEXT,                                   -- ISO date, optional
    owner_tag TEXT,                                  -- 'p1' | 'p2' | 'joint' | NULL
    tentative INTEGER NOT NULL DEFAULT 0,
    surprise INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);

  CREATE TABLE IF NOT EXISTS instalments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'credit_card',
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    total REAL NOT NULL,
    months INTEGER NOT NULL,
    start_month TEXT NOT NULL,                       -- 'YYYY-MM'
    owner_tag TEXT
  );

  CREATE TABLE IF NOT EXISTS recurring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'event_repeat',
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount REAL NOT NULL,                            -- amount charged each occurrence
    schedule TEXT NOT NULL,                          -- 'annual' | 'quarterly' | 'semester' | 'custom'
    due_months TEXT NOT NULL,                        -- JSON array of month numbers 1-12
    owner_tag TEXT
  );

  CREATE TABLE IF NOT EXISTS month_closes (
    month TEXT PRIMARY KEY,
    closed_at TEXT NOT NULL DEFAULT (datetime('now')),
    actions_json TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    ip TEXT NOT NULL,
    attempted_at INTEGER NOT NULL                    -- unix seconds
  );
  CREATE INDEX IF NOT EXISTS idx_login_ip ON login_attempts(ip, attempted_at);
  `);

  // additive migrations for databases created before these columns existed
  try {
    d.exec("ALTER TABLE month_closes ADD COLUMN actions_json TEXT NOT NULL DEFAULT '[]'");
  } catch {
    /* column already exists */
  }
  try {
    d.exec("ALTER TABLE settings ADD COLUMN tour_seen INTEGER NOT NULL DEFAULT 0");
  } catch {
    /* column already exists */
  }
  try {
    d.exec("ALTER TABLE settings ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR'");
  } catch {
    /* column already exists */
  }
  try {
    d.exec("ALTER TABLE categories ADD COLUMN auto_paid INTEGER NOT NULL DEFAULT 0");
  } catch {
    /* column already exists */
  }

  // one-time data fixup: mark known fixed housing costs as auto_paid, drop the unused Gas category
  markFixedCostsAndDropGas(d);

  const row = d.prepare("SELECT COUNT(*) AS c FROM settings").get() as { c: number };
  if (row.c === 0) {
    d.prepare("INSERT INTO settings (id) VALUES (1)").run();
  }
  const pc = d.prepare("SELECT COUNT(*) AS c FROM persons").get() as { c: number };
  if (pc.c === 0) {
    d.prepare("INSERT INTO persons (id, name) VALUES (1, 'Person 1')").run();
  }
  const cc = d.prepare("SELECT COUNT(*) AS c FROM categories").get() as { c: number };
  if (cc.c === 0) seedCategories(d);
}

/** Idempotent: safe to run on every startup. Never deletes data with history — archives instead. */
function markFixedCostsAndDropGas(d: Database.Database) {
  d.prepare(
    `UPDATE categories SET auto_paid = 1
     WHERE bucket = 'needs' AND name IN ('Rent', 'Strom', 'Internet', 'Rundfunkbeitrag') AND auto_paid = 0`
  ).run();

  const gas = d.prepare("SELECT id FROM categories WHERE name = 'Gas'").get() as
    | { id: number }
    | undefined;
  if (!gas) return;
  const used = d
    .prepare(
      `SELECT (SELECT COUNT(*) FROM expenses WHERE category_id = @id)
             + (SELECT COUNT(*) FROM plans WHERE category_id = @id AND planned != 0)
             + (SELECT COUNT(*) FROM instalments WHERE category_id = @id)
             + (SELECT COUNT(*) FROM recurring WHERE category_id = @id) AS c`
    )
    .get({ id: gas.id }) as { c: number };
  if (used.c > 0) {
    d.prepare("UPDATE categories SET archived = 1 WHERE id = ?").run(gas.id);
  } else {
    d.prepare("DELETE FROM categories WHERE id = ?").run(gas.id);
  }
}

const FIXED_COST_NAMES = new Set(["Rent", "Strom", "Internet", "Rundfunkbeitrag"]);

function seedCategories(d: Database.Database) {
  const ins = d.prepare(
    "INSERT INTO categories (bucket, name, icon, owner_tag, is_buffer, invest_type, sort, auto_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const needs: [string, string][] = [
    ["Rent", "home"],
    ["Strom", "bolt"],
    ["Internet", "wifi"],
    ["Rundfunkbeitrag", "radio"],
    ["Phone Bills", "smartphone"],
    ["Insurance", "health_and_safety"],
    ["Groceries", "shopping_cart"],
    ["Semester Fees", "school"],
    ["DE-Ticket", "train"],
    ["Liability Insurance", "verified_user"],
    ["Berliner Mieterverein", "gavel"],
    ["Medical & Healing", "medical_services"],
    ["Sachiko & Beanie", "pets"],
  ];
  const wants: [string, string][] = [
    ["Leisure", "sports_esports"],
    ["Personal Money", "person"],
    ["Skincare", "spa"],
    ["Travel", "flight"],
    ["Wellness", "fitness_center"],
    ["Donations", "volunteer_activism"],
    ["Subscriptions", "subscriptions"],
  ];
  const tx = d.transaction(() => {
    needs.forEach(([name, icon], i) =>
      ins.run("needs", name, icon, null, 0, null, i, FIXED_COST_NAMES.has(name) ? 1 : 0)
    );
    wants.forEach(([name, icon], i) => ins.run("wants", name, icon, null, 0, null, i, 0));
    ins.run("savings", "Savings", "savings", null, 0, null, 0, 0);
    ins.run("savings", "Investments", "trending_up", null, 0, "stocks", 1, 0);
    ins.run("savings", "Emergency Buffer", "shield", null, 1, null, 2, 0);
  });
  tx();
}
