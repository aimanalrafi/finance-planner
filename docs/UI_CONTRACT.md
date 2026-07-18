# UI Contract for screen builders

Repo root: `/home/wheego/Personal/finance-planner`. Next.js 16 App Router + Tailwind v4 + TypeScript.

## Hard rules
- ONLY create/edit files explicitly assigned to you. NEVER touch shared files (`lib/*`, `components/*` at top level, `app/(tabs)/layout.tsx`, `app/globals.css`, config files). If you need a helper, create it inside YOUR OWN directory.
- All pages are client components (`"use client"`).
- Mobile-first, max-width already constrained by layout (`max-w-lg`). Design must match the Stitch mockup PNG for your screen (path given in your task).
- Currency is Euro; ALWAYS render amounts with `euro()` from `@/lib/client` and the `data-mono` CSS class (JetBrains Mono).
- Icons: Material Symbols via `<Icon name="..." fill size={..} className="..."/>` from `@/components/Icon`.
- Colors (Tailwind classes from theme): `bg-surface, bg-slate-surface, bg-card(white), text-ink, text-muted, text-faint, border-line, bg-navy, bg-navy-deep, text-emerald, text-emerald-deep, bg-mint, bg-mint-strong, text-amber, bg-cream, bg-chip, text-chip-ink, bg-lav, text-error, bg-error-light`. Utility classes in globals.css: `.card`, `.dashed-card`, `.label-caps`, `.data-mono`, `.glass-backdrop`, `.animate-slide-up`.
- Buckets tone: Needs = navy, Wants = emerald, Savings = amber (matches mockups).

## Shared building blocks (import, don't reimplement)
- `useMonth()` from `@/components/MonthContext` → `{ month, setMonth, bundle, loading, error, refresh, settings }`. `bundle: MonthBundle | null`. After ANY mutation call `refresh()`.
- `<MonthSwitcher/>` from `@/components/MonthSwitcher` — prev/next month control bound to context.
- `<Modal open onClose title>` from `@/components/Modal` — bottom sheet.
- `<ProgressBar value max tone height/>` tone: emerald|navy|amber|error (auto-red when over max).
- `<Segmented options value onChange/>`, `<CurrencyInput value onChange amber large autoFocus/>` (string value).
- `api<T>(path, {method, body})` from `@/lib/client`; `euro(n, {sign, decimals})`, `pct(n)`.
- Month helpers from `@/lib/months`: `currentMonth, addMonths, monthDiff, monthLabel, monthName, shortMonthName, monthNumber, yearOf, isValidMonth`.
- ALL types from `@/lib/types` — read that file. Key: `MonthBundle` has `settings, incomes, total_income, income_by_person, categories: CategoryMonth[], buckets: BucketSummary[], instalments (active this month, with monthly/paid_count/months), tentative: Expense[], expenses: Expense[], unallocated, closed`.
- `CategoryMonth`: `planned` (user-set), `auto_planned` (instalments+recurring landing this month), `total_planned = planned + auto_planned`, `actual` (confirmed spend), `tentative_total`, `instalment_items[], recurring_items[]`.

## API endpoints (all JSON; 400 => `{error}`)
- `GET /api/month/{YYYY-MM}` → MonthBundle
- `PUT /api/settings` body: any of `{mode:'solo'|'household', framework:'50/30/20'|'70/20/10'|'zero'|'pyf'|'custom', needs_pct, wants_pct, savings_pct, surprise_alert_pct, onboarded:boolean, persons:[{id:1|2,name}]}` → Settings. `GET /api/settings` → Settings.
- `POST /api/incomes` `{month, person_id:1|2, name, amount}`; `PUT/DELETE /api/incomes/{id}` (PUT: `{name?, amount?}`)
- `GET /api/categories?archived=1`; `POST /api/categories` `{bucket, name, icon?, owner_tag?, is_buffer?, invest_type?}`; `PUT /api/categories/{id}` (any field incl. `archived`); `DELETE /api/categories/{id}` (auto-archives if it has history)
- `PUT /api/plans` `{month, items:[{category_id, planned}]}` (bulk upsert); `POST /api/plans` `{from, to}` copies plan+incomes from another month
- `POST /api/expenses` `{month, category_id, name, amount, spent_on?, owner_tag?, tentative?, surprise?, note?}`; `PUT /api/expenses/{id}` any field (set `tentative:false` to confirm a tentative expense); `DELETE /api/expenses/{id}`
- `GET /api/instalments?month=`; `POST /api/instalments` `{name, icon?, category_id, total, months(1-120), start_month, owner_tag?}`; `PUT/DELETE /api/instalments/{id}`
- `GET /api/recurring`; `POST /api/recurring` `{name, icon?, category_id, amount, schedule:'annual'|'quarterly'|'semester'|'custom', due_months:[1..12], owner_tag?}`; `PUT/DELETE /api/recurring/{id}`
- `POST /api/surprise` `{month, category_id, amount}` → `SurprisePreview {bucket, bucket_planned, bucket_actual_before/after, overflow, suggestions:[{category_id, category_name, bucket, remaining, take}]}` (preview only, nothing saved)
- `POST /api/surprise/apply` `{month, name, category_id, amount, owner_tag?, note?, moves:[{from_category_id, amount}]}` — logs the surprise expense + moves plan money INTO its category
- `GET /api/year/{year}` → `YearMonthSummary[]` (12 entries)
- `GET /api/month/{m}/close` → `{month, closed, unspent:[{category_id,name,bucket,unspent}]}`; `POST /api/month/{m}/close` `{actions:[{category_id, action:'rollover'|'save'|'ignore', amount, save_category_id?}]}`; `DELETE /api/month/{m}/close` reopens
- `POST /api/auth/logout`

## Error/UX conventions
- Wrap mutations in try/catch; on error show inline red text (`text-error bg-error-light rounded-lg px-3 py-2 text-sm`).
- Disable buttons while submitting.
- Household mode: `settings.mode === 'household'`, person names `settings.persons` (ids 1,2). Owner tags: 'p1' | 'p2' | 'joint' shown as pill chips with person names. In solo mode hide all owner tag UI.
- Numbers in inputs are strings; parse with `Number()` before sending.
