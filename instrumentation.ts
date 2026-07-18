/**
 * Runs once at server start (Next.js instrumentation hook).
 * Schedules a daily SQLite backup into DATA_DIR/backups with 14-day rotation.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { backupNow } = await import("./lib/backup");
  const DAY_MS = 24 * 60 * 60 * 1000;
  // first backup shortly after boot, then daily
  setTimeout(() => backupNow().catch((e) => console.error("[backup] failed:", e)), 60_000);
  setInterval(() => backupNow().catch((e) => console.error("[backup] failed:", e)), DAY_MS);
}
