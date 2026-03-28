# Milestones

## v2.0 Web UI (Shipped: 2026-03-28)

**Phases completed:** 3 phases, 6 plans, 14 tasks

**Key accomplishments:**

- Next.js 16 app with SQLite/Drizzle schema (scripts + beats tables), shadcn/ui v4, and reference file reader for 7 video formats
- Agent SDK wrapper with structured JSON output and server actions for script generation, persistence, and re-generation
- Complete generation UI with format selector, dev context input, loading state with timer, and structured script display — after agent.ts was rewritten from markdown-parsing to JSON-prompt approach during Pavlo's checkpoint test
- Script editor page with dual-track beat cards, click-to-edit inline editing via save-on-blur, and hook variant tab switching using base-ui Tabs
- Per-beat AI regeneration with full script context, 5-dimension anti-slop score panel with stale/rescore workflow, and Edit link bridging generation page to editor
- Script library page with browsable table, inline status management, voiceover clipboard copy, and header navigation

---
