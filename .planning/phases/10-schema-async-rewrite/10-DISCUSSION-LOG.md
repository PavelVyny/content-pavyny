# Phase 10: Schema & Async Rewrite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 10-Schema & Async Rewrite
**Areas discussed:** Supabase setup approach, Migration strategy, Error handling for network DB, Timestamp conversion

---

## Supabase Setup Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Already have one | I'll provide the DATABASE_URL — plan should just configure .env.local and connect | |
| Need to create one | Plan should include step-by-step Supabase project setup | |
| I'll create it myself | I'll create the project before execution starts | |

**User's choice:** Already has Supabase project, provided connection string (eu-west-1 pooler)
**Notes:** Project name "pavyny", password provided. Connection string uses pooler port 6543.

| Option | Description | Selected |
|--------|-------------|----------|
| One instance | Single Supabase project for everything | ✓ |
| Separate dev/prod | Two Supabase projects | |

**User's choice:** One instance (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| drizzle-kit push | Direct schema push, no migration files | ✓ |
| drizzle-kit generate + migrate | Creates SQL migration files | |

**User's choice:** drizzle-kit push for Phase 10
**Notes:** User has existing data in SQLite they want to keep — confirmed Phase 11 handles data migration, Phase 10 just creates empty tables.

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Big-bang rewrite | Replace all at once, single pass | ✓ |
| Incremental with dual driver | Keep SQLite working during conversion | |

**User's choice:** Big-bang rewrite (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Manual testing | Start app and test each flow manually | |
| Quick smoke test script | Script that exercises each server action | ✓ |

**User's choice:** Quick smoke test script

---

## Error Handling for Network DB

| Option | Description | Selected |
|--------|-------------|----------|
| Let it crash | Next.js error boundaries catch it | ✓ |
| Retry with backoff | Wrap DB calls with 1-2 retries | |
| Connection check on startup | Test DB on app start | |

**User's choice:** Let it crash (Recommended)

---

## Timestamp Conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Native timestamp | PostgreSQL timestamp() type | ✓ |
| Keep as integers | integer() like SQLite | |

**User's choice:** Native timestamp (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| jsonb | PostgreSQL native jsonb() type | ✓ |
| Keep as text | Store JSON as text | |

**User's choice:** Yes, jsonb (Recommended)

---

## Claude's Discretion

- Connection singleton pattern adaptation for postgres-js
- Async patterns for page components vs server actions
- Smoke test script structure and coverage

## Deferred Ideas

None — discussion stayed within phase scope
