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
    surprise_alert_pct REAL NOT NULL DEFAULT 5
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
    sort INTEGER NOT NULL DEFAULT 0
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

  // additive migration for databases created before actions_json existed
  try {
    d.exec("ALTER TABLE month_closes ADD COLUMN actions_json TEXT NOT NULL DEFAULT '[]'");
  } catch {
    /* column already exists */
  }

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

function seedCategories(d: Database.Database) {
  const ins = d.prepare(
    "INSERT INTO categories (bucket, name, icon, owner_tag, is_buffer, invest_type, sort) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const needs: [string, string][] = [
    ["Rent", "home"],
    ["Gas", "local_fire_department"],
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
    needs.forEach(([name, icon], i) => ins.run("needs", name, icon, null, 0, null, i));
    wants.forEach(([name, icon], i) => ins.run("wants", name, icon, null, 0, null, i));
    ins.run("savings", "Savings", "savings", null, 0, null, 0);
    ins.run("savings", "Investments", "trending_up", null, 0, "stocks", 1);
    ins.run("savings", "Emergency Buffer", "shield", null, 1, null, 2);
  });
  tx();
}
