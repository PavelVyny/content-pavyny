# Phase 11: Data Migration & Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 11-data-migration-cleanup
**Areas discussed:** Timestamp conversion, Cross-machine verification, SQLite file cleanup

---

## Timestamp Conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect and convert | Migration script inspects each timestamp column, detects seconds vs milliseconds by magnitude | ✓ |
| Assume all seconds | Treat all epoch values as Unix seconds | |
| You decide | Let Claude determine during research | |

**User's choice:** Auto-detect and convert
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Print sample + summary | Show 3 sample rows per table with converted timestamps | |
| Just counts | Only show row counts per table | ✓ |
| Full validation | Compare every row against reasonable date range | |

**User's choice:** Just counts
**Notes:** None

---

## Cross-Machine Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Manual check on both machines | Open app on both machines, create script on one, see it on other | ✓ |
| Smoke test on both machines | Run smoke-test.ts on both | |
| Just verify M1 builds | If npm install + dev works on M1, cross-machine is proven | |

**User's choice:** Manual check on both machines
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Already set up | Repo cloned, npm installed, just need .env.local | ✓ |
| Need to set up from scratch | Clone, install, configure | |
| Not sure | Include setup instructions either way | |

**User's choice:** Already set up
**Notes:** M1 MacBook has repo cloned and npm installed, just needs .env.local with DATABASE_URL

---

## SQLite File Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Delete after verified migration | Remove scripts.db and data/ directory | |
| Keep as backup temporarily | Add to .gitignore, keep on disk, delete manually later | ✓ |
| Archive to .planning/ | Move .db to .planning/archive/ | |

**User's choice:** Keep as backup temporarily
**Notes:** None

---

## Claude's Discretion

- Migration script approach (read SQLite, write to Supabase)
- Epoch detection threshold logic
- Migration script location/naming
- Transaction wrapping

## Deferred Ideas

None
