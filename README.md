# Personal Finance Planner — "Fiscal Harmony"

A big-picture personal finance planning app that replaces a rigid spreadsheet budget. Built for one person or a household of two, with variable incomes and real-life surprise expenses in mind. Currency: Euro (€).

Implemented from the product brief as a **mobile-first responsive web app** (installable as a PWA on your phone's home screen), deployed with Docker behind a login.

## Features

- **Budgeting frameworks** — 50/30/20 (recommended), 70/20/10, zero-based, pay-yourself-first, or custom percentages; chosen at onboarding, changeable in Settings. Live bucket percentages everywhere.
- **Solo or household mode** — two people with separate incomes; expenses taggable as Person 1 / Person 2 / Joint.
- **Variable income** — multiple income sources per person, entered per month; copy last month's plan in one tap.
- **Planning tab** — the monthly sit-down: allocate income across customisable categories in Needs / Wants / Savings buckets, live "remaining to allocate" bar, advisor insight, buffer pot, confirm plan.
- **Instalments** — split a large one-off cost across N months; the monthly portion is auto-allocated and shown with progress pips.
- **Yearly / recurring expenses** — annual, quarterly, semester or custom schedules distributed into the right months automatically.
- **Tentative expenses** — flagged with dashed styling, confirm or remove as the month approaches.
- **Surprise expense flow** — "Something came up?": log it, see the impact gauge on the affected bucket, get reallocation suggestions, decide, plan updates automatically.
- **Home tab** — current month at a glance: income, month progress, planned vs actual per bucket, harmony score, recent activity.
- **Review tab** — any past month: planned vs actual, deltas, bucket health, surprise list; year view with totals, table and chart; month close-out surfaces unspent budget (roll over / send to savings / ignore).
- **Persistence** — SQLite database stored on a host-mounted volume; survives container rebuilds and server reboots. Automatic daily backups with 14-day rotation (`data/backups/`).
- **Security** — session-cookie login (credentials in `.env`, never in the repo), signed HMAC cookies, login rate limiting, middleware guarding every route and API.

## Stack

- Next.js 16 (App Router, standalone output) + React 19 + TypeScript
- Tailwind CSS v4 with the "Fiscal Harmony" design system (Hanken Grotesk + JetBrains Mono, deep navy / emerald / amber)
- SQLite via better-sqlite3 (WAL mode) — no external database server
- Docker multi-stage build, docker-compose for deployment
- GitHub Actions CI/CD

## Local development

```bash
npm install
cp .env.example .env   # then edit credentials
npm run dev            # http://localhost:3000
```

## Run with Docker

```bash
cp .env.example .env   # then edit credentials
docker compose up -d --build
# app on http://localhost:8090, data persisted in ./data/
```

`.env` values:

| Var | Meaning |
|---|---|
| `APP_EMAIL` / `APP_PASSWORD` | The single login account |
| `SESSION_SECRET` | Random 32+ char string signing session cookies (`openssl rand -hex 32`) |
| `DATA_DIR` | SQLite location (defaults to `./data`, `/data` in Docker) |

## Deployment & CI/CD

Production runs on the server at `~/apps/finance-planner`, exposed on port **8090** via docker-compose.

- **CI** (`.github/workflows/ci.yml`): every push/PR → typecheck + Next build; Docker build on main.
- **CD** (`.github/workflows/deploy.yml`): every push to `main` → SSH to the server, `git reset --hard origin/main`, `docker compose up -d --build`, waits for the container health check. Uses repo secrets `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_USER`, `DEPLOY_HOST` (dedicated deploy key, not a personal key).

So the workflow is: merge/push to `main` → live in ~2 minutes. No manual server steps.

### Backups & restore

The app snapshots the SQLite DB daily to `data/backups/finance-YYYY-MM-DD.db` (kept 14 days). To restore:

```bash
docker compose down
cp data/backups/finance-<date>.db data/finance.db
docker compose up -d
```

## Data model (SQLite)

`settings` (mode, framework, percentages) · `persons` · `income_sources` (per month/person) · `categories` (bucket, icon, owner tag, buffer/investment flags) · `plans` (planned € per category per month) · `expenses` (actuals; tentative + surprise flags) · `instalments` (total, months, start) · `recurring` (amount, schedule, due months) · `month_closes`.

Design sources live in `design/` (Stitch mockups + design system).
