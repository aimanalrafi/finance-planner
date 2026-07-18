import path from "path";
import fs from "fs";
import { db } from "./db";

const KEEP_DAYS = 14;

export async function backupNow(): Promise<string> {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  const backupDir = path.join(dataDir, "backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 10);
  const dest = path.join(backupDir, `finance-${stamp}.db`);
  await db().backup(dest);

  // rotate: drop backups older than KEEP_DAYS
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const f of fs.readdirSync(backupDir)) {
    if (!/^finance-\d{4}-\d{2}-\d{2}\.db$/.test(f)) continue;
    const full = path.join(backupDir, f);
    try {
      if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
  console.log(`[backup] wrote ${dest}`);
  return dest;
}
