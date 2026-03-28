# Project Research Summary

**Project:** Devlog Scriptwriter Web UI (v2.0 milestone)
**Domain:** Local Next.js web app wrapping an existing CLI-based AI scriptwriting pipeline
**Researched:** 2026-03-26 to 2026-03-28
**Confidence:** HIGH

## Executive Summary

This is a **subsequent milestone** on an already-functional project. Pavlo has a working CLI-based scriptwriting pipeline: a custom devlog-scriptwriter skill, anti-slop scoring with a 35+/50 threshold, brand voice reference files, and 7 proven script formats (The Bug, The Satisfaction, Before/After, etc.). The v2.0 Web UI wraps this existing system in a local Next.js app without replacing or duplicating any of the underlying skill infrastructure. The primary value of the web UI is making the dual-track visual/voiceover script format visible and editable — something a terminal cannot do. No existing competitor tool combines anti-slop quality scoring with a visual/voiceover dual-track editor; this structural and quality differentiation is what justifies building a custom app rather than using a generic scriptwriting tool.

The recommended approach is Next.js 16 (App Router) + Vercel AI SDK + Anthropic API key + SQLite via better-sqlite3. The single most consequential architectural decision is the AI backend: Pavlo's Claude Max subscription cannot be used to power the web app backend as of February 2026, when Anthropic updated their Terms of Service and deployed client fingerprinting to block unauthorized OAuth token usage in third-party apps. This is not a meaningful cost problem — the Anthropic API costs roughly $1-5 per year at Pavlo's script generation volume using Claude Haiku 4.5. It is a compliance and reliability decision. Use an Anthropic API key with a $5/month spend limit. Note: STACK.md recommends `@anthropic-ai/claude-agent-sdk` as an alternative that uses Max subscription auth via OAuth; this recommendation is superseded by the PITFALLS.md finding on Anthropic's February 2026 enforcement action. Use the Vercel AI SDK with an API key.

The app architecture is deliberately simple: one SQLite database for working script drafts, reference markdown files read directly from disk (shared with the CLI skill, never duplicated), streaming AI generation via the Vercel AI SDK, and a custom beat-card editor built with paired textareas rather than a block editor library. Three patterns define the architecture: (1) reference files as system prompt context injected at generation time, (2) streaming text parsed into structured JSON beat arrays on completion, and (3) the dual-track beat model as the central data structure — separate `beats` table from day one, never blob storage.

## Key Findings

### Recommended Stack

The stack maps directly to Pavlo's existing skills (React, TypeScript, Tailwind) plus targeted additions. Next.js 16 provides Server Components for direct database access without boilerplate API routes, Server Actions for CRUD operations, and a single Route Handler specifically for the streaming generation endpoint. The Vercel AI SDK with the `@ai-sdk/anthropic` provider handles streaming, structured output, and provider abstraction out of the box — a much thinner layer than building streaming manually. SQLite via `better-sqlite3` is the correct choice for a single-user local tool: zero config, one file to back up, synchronous API that fits SQLite's architecture, and sub-millisecond reads for hundreds of scripts. Drizzle ORM 0.45.x adds type-safe schema management without Prisma's 15MB engine binary. shadcn/ui v4 (released March 2026, full Next.js 16 + React 19 + Tailwind v4 compatibility) provides copy-pasted Radix UI component primitives — not a runtime dependency, no design system overhead.

**Core technologies:**
- **Next.js 16 (App Router):** Full-stack React framework — Server Components eliminate most API routes; Turbopack is now the default bundler; async request APIs enforced
- **Vercel AI SDK (`@ai-sdk/anthropic`):** AI streaming backend — handles `streamText()`, structured output, prompt caching, provider abstraction; requires separate Anthropic API key (not Max subscription)
- **better-sqlite3 11.x + Drizzle ORM 0.45.x:** Local persistence — synchronous SQLite driver; type-safe schema-as-code; ~50KB vs Prisma's 15MB engine; 100x faster in benchmarks
- **shadcn/ui v4 + Tailwind CSS 4.x:** UI components — copy-paste Radix primitives; fully compatible with Next.js 16 and React 19 as of March 2026
- **zod 3.x:** Schema validation — validate AI JSON output, form inputs, API responses; already a peer dependency of the Vercel AI SDK

**What NOT to use:**
- `@anthropic-ai/sdk` (API SDK) — requires API key with per-token billing, but so does the correct approach; the difference is this SDK lacks Vercel AI SDK's streaming helpers
- Prisma — 15MB engine binary, async-only SQLite access, 100x performance regression
- Redux/Zustand — React state + Server Actions is sufficient for this app
- tRPC — Server Actions replace it; adds a complexity layer with no benefit here
- Block editor libraries (BlockNote, TipTap, Slate) — see Pitfalls section; build a custom beat-card component instead
- `ANTHROPIC_API_KEY` set from Max subscription OAuth token — ToS violation as of February 2026

**Windows note:** `better-sqlite3` is a native C++ addon requiring Python 3.x and Visual Studio Build Tools. Pavlo likely has these from Unreal Engine development, but verify during Phase 1 setup. Prebuild binaries usually install automatically via `npm install`.

### Expected Features

Feature research draws a clear three-tier line: P1 makes the web UI better than the CLI for the core workflow; P2 adds polish once the core loop works; P3 waits until the workflow proves its value over time.

**Must have (P1 — table stakes for launch):**
- Script generation form — format picker (7 cards) + context textarea + generate button
- Visual dual-track display — each beat rendered as a block with visual/voiceover lanes (the reason to build a UI at all)
- Inline script editing — click to edit any text in the dual-track display, no mode switching
- Anti-slop score display — score badge with pass/fail color coding + 5-dimension breakdown
- Script persistence — auto-save to local SQLite on every edit with debounce, scripts survive page refresh
- Script library (list) — browse saved scripts with title, format, date, score, status
- Copy-to-clipboard — one-click copy of voiceover-only text formatted for recording
- Hook section prominence — first beat block visually emphasized with accent border and HOOK label

**Should have (P2 — add after core loop validated):**
- Anti-slop inline highlighting — Grammarly-style red underlines on banned phrases with hover tooltip showing the rule and a suggested replacement (the killer feature; no competitor does this)
- Format template preview — show beat skeleton before committing to a format
- Script search and filter — keyword search + format/score filter chips above the library list
- Quick re-generate with tweak — regenerate same format with an additional instruction field
- Keyboard shortcuts — Cmd+Enter to generate, Cmd+S to save, Cmd+Shift+C to copy (developer expectation)
- Score breakdown visualization — radar or bar chart of 5 anti-slop dimensions (Directness, Rhythm, Trust, Authenticity, Density)

**Defer (P3 / v2+):**
- Beat-block drag-and-drop editor — HIGH complexity; dnd-kit required; only worth implementing if Pavlo frequently reorders beats
- Script comparison view — requires version history infrastructure first
- Generation history / undo — version snapshots add storage and UI complexity at low current volume
- Metrics dashboard with charts — metrics collection is paused; needs 10+ data points before charts are meaningful

**Confirmed anti-features (do not build):**
Real-time collaboration, WYSIWYG rich text formatting (scripts are spoken aloud, not read), AI chat sidebar (structured form inputs cover the use case), template builder (7 formats are sufficient; Pavlo is a developer and can add formats in code), dark/light theme switcher (start dark, no toggle needed), export to PDF, mobile PWA.

### Architecture Approach

The system has four layers: browser (React client components for the editor, Server Components for the library), Next.js App Router (Server Actions for CRUD, one Route Handler for streaming generation), a service layer (AI service, Script Store, Reference Manager), and the filesystem/database (Claude API via Anthropic, scripts.db local file, .claude/skills/ reference files on disk). The critical architectural constraint is that reference files must never be duplicated into the database — both the CLI skill and the web app read the same `.claude/skills/devlog-scriptwriter/references/*.md` files from disk, so edits in either tool are immediately visible to the other. SQLite is the draft workspace; `scripts/*.md` files are the export format; reference files stay where the CLI skill placed them.

**Major components and responsibilities:**
1. **`lib/ai/` (AI service):** Reads all 4 reference files at request time, builds the system prompt (replicating what SKILL.md orchestrates in the CLI), calls Claude via Vercel AI SDK `streamText()`, parses structured JSON response into typed Script objects
2. **`lib/db/` (Script Store):** SQLite schema with separate `scripts` and `beats` tables; Drizzle ORM for type-safe queries; WAL mode (`PRAGMA journal_mode=WAL`) enabled at connection initialization
3. **`lib/references.ts` (Reference Manager):** Reads/writes `.claude/skills/devlog-scriptwriter/references/` files in-place; serves as the data sharing bridge between CLI and web app
4. **`lib/anti-slop.ts` (Client-side scanner):** Pattern-matches 90+ banned phrases against voiceover text using regex; provides real-time highlighting and approximate re-scoring during editing
5. **`app/api/generate/route.ts` (Streaming endpoint):** The only Route Handler in the app; returns `ReadableStream` immediately; chunks buffered to React state AND saved as partial database records periodically during generation
6. **`components/script-editor.tsx` (Beat-card editor):** Custom component — an ordered list of cards with paired textareas (visual + voiceover per card); NOT a block editor library; dnd-kit added only if reordering is a documented need

**Key data flows:**
- Generation: form → POST /api/generate → reference files read → system prompt built → Claude streamed → partial saves every 2s → completion → JSON parsed → beats stored → library updated
- Editing: library → SQLite load → beats rendered as card list → inline edit → client-side anti-slop re-scan → save via Server Action
- Export: script → SQLite read → formatted as markdown matching `scripts/007-*` template → written to `scripts/` directory → visible to CLI skill

### Critical Pitfalls

1. **Claude Max subscription OAuth cannot power the web app backend** — Anthropic banned this in February 2026 with client fingerprinting enforcement and account suspension risk. Community proxy tools (CLIProxyAPI, claude-code-proxy) appear to work but violate ToS. Prevention: provision an Anthropic API key from the Console with a $5/month spend limit. Cost at Pavlo's volume is approximately $0.08/month with Haiku. This must be resolved before any other infrastructure decision in Phase 1.

2. **Storing scripts as unstructured text blobs** — storing AI output as a single `content TEXT` column makes every downstream feature (per-beat editing, anti-slop highlighting, beat reordering, timing estimates) require fragile text parsing. Migration from blob to structured storage is painful and lossy. Prevention: schema must have a separate `beats` table with `script_id FK`, `position`, `visual_description`, `voiceover_text` columns from day one. Prompt the AI to output structured JSON; parse immediately on generation completion.

3. **Streaming response buffering in Next.js Route Handlers** — returning a full `await anthropic.messages.create({ stream: false })` from a route handler buffers everything, causing a 10-30 second blank wait followed by a dump, or a timeout on longer generations. Prevention: use Vercel AI SDK `streamText()` which returns a `ReadableStream` correctly; add `X-Accel-Buffering: no` and `Cache-Control: no-cache` headers to prevent proxy buffering. Streaming must be implemented correctly from the start — retrofitting into a non-streaming architecture requires rewriting both API routes and all consuming UI components.

4. **Over-engineering the editor with a block editor library** — BlockNote, TipTap, Slate, and similar libraries are designed for arbitrary rich content; the script format is a fixed schema `{ visual: string, voiceover: string }[]`. These libraries introduce SSR hydration errors in Next.js, add 200KB+ to the bundle, require weeks of integration to fight the library's data model, and provide no value over simple textarea elements. Prevention: build a custom component — an ordered list of cards where each card has two textarea fields. If beat reordering is needed, dnd-kit is a lightweight addition (~25KB). Document this decision explicitly before writing editor code.

5. **Losing in-progress generation on navigation or error** — generation takes 10-20 seconds; if the user navigates away, closes the tab, or the network drops mid-stream, the partial result is lost entirely. Prevention: buffer streaming chunks into React state AND save partial records to the database every 2 seconds; the `status` field must be `'generating' | 'complete' | 'partial' | 'error'` from day one; add `beforeunload` warning during active generation.

## Implications for Roadmap

### Phase 1: Foundation

**Rationale:** Every other component depends on the database schema, TypeScript types, and file access layer. Getting the schema right now — structured beats table, `status` field for partial results, WAL mode — is dramatically cheaper than migrating later. The reference file reader establishes the contract for CLI/web app data sharing. The Anthropic API key is the first infrastructure decision that everything downstream depends on.

**Delivers:** Next.js 16 project scaffold in `app/` directory; SQLite schema with `scripts` + `beats` tables via Drizzle ORM; `lib/types.ts` (Script, ScriptBeat, AntiSlopScore, status enum); `lib/references.ts` (reads 4 reference markdown files from `.claude/skills/devlog-scriptwriter/references/`); Anthropic API key provisioned with $5/month spend limit; `.env.local` confirmed in `.gitignore` before first commit.

**Addresses from FEATURES.md:** Script persistence (P1 table stakes) — the database layer that all other P1 features depend on.

**Avoids from PITFALLS.md:** Pitfall 1 (Max subscription ToS), Pitfall 2 (blob storage), Pitfall 5 (missing status field for generation loss) — all three are architectural decisions with HIGH migration cost if deferred.

**Research flag:** Standard patterns — Next.js 16 setup, Drizzle with better-sqlite3, and `.env.local` security are well-documented in official guides. Skip research-phase for this phase.

### Phase 2: AI Generation

**Rationale:** Core value of the app. Once the generation flow works end-to-end (form submission → streaming → JSON parse → save to database), every downstream feature has real data to work with. Streaming and partial persistence must be implemented correctly here — retrofitting is expensive and requires rewriting both server routes and all client components that consume streamed data.

**Delivers:** `lib/ai/prompts.ts` (builds system prompt by injecting all 4 reference files); `lib/ai/parser.ts` (validates and types AI JSON response as Script/ScriptBeat objects); streaming Route Handler at `/api/generate/route.ts`; Generate Form page (`app/generate/page.tsx` + `components/generate-form.tsx`) with 7 format cards and context textarea; partial result saving with status tracking; in-progress generation warning on navigation.

**Uses from STACK.md:** `streamText()` from Vercel AI SDK; `@ai-sdk/anthropic` provider with Claude Haiku 4.5; `zod` schema for structured JSON output validation; `buildSystemPrompt()` injecting brand-voice.md + anti-slop-rules.md + video-formats.md + metrics-log.md.

**Implements from ARCHITECTURE.md:** Reference Files as System Prompt Context pattern; Streaming with Structured Output pattern; partial result persistence with status tracking.

**Avoids from PITFALLS.md:** Pitfall 3 (streaming buffering — `streamText()` handles this correctly), Pitfall 5 (generation loss — partial saves every 2 seconds with `status: 'generating'`).

**Research flag:** Standard patterns — Vercel AI SDK streaming with Next.js App Router is a primary documented use case. Skip research-phase.

### Phase 3: Script Editor and Library

**Rationale:** The dual-track beat display is the core reason to build a web UI at all. With scripts flowing into the database from Phase 2, this phase builds the views Pavlo actually uses during the recording workflow. The custom beat-card editor decision (vs block editor library) must be explicitly documented before writing any editor code — this is the highest-risk architecture decision in the UI layer.

**Delivers:** Script Library page (`app/page.tsx`) with sorted list view (title, format, date, score, status); Script Editor page (`app/scripts/[id]/page.tsx`); custom beat-card editor component (paired textareas per beat, no block editor library); `lib/anti-slop.ts` (client-side phrase scanner with 90+ patterns); Anti-Slop Panel component (score badge with pass/fail color + 5-dimension breakdown); hook block visual emphasis (accent border, HOOK label on first beat); copy-to-clipboard for voiceover-only text.

**Addresses from FEATURES.md:** All P1 table stakes features. This phase is the MVP definition from FEATURES.md.

**Avoids from PITFALLS.md:** Pitfall 4 (block editor library — custom beat-card component explicitly chosen and documented); editor hydration issues (custom textareas render cleanly in SSR, no `ssr: false` needed); anti-slop score shown as context-rich display with dimension breakdown, not just a number.

**Research flag:** Custom sortable textarea list is standard React. Skip research-phase. If beat drag-and-drop reordering is added (P3 feature from FEATURES.md), a brief review of dnd-kit integration patterns is worthwhile before implementing.

### Phase 4: Polish and Integration

**Rationale:** These features close the loop between the web app and the existing CLI workflow, and add the quality differentiators that make the web app noticeably better than the CLI. Anti-slop inline highlighting is the most important P2 feature — it surfaces quality issues inline rather than requiring the user to interpret a score. Export to markdown closes the loop with the existing `scripts/` directory format that the CLI skill uses.

**Delivers:** Anti-slop inline highlighting (regex pattern matching on voiceover text with red underlines and hover tooltip suggestions); format template preview cards (beat skeleton shown before format selection); quick re-generate with tweak instruction field; keyboard shortcuts (Cmd+Enter, Cmd+S, Cmd+Shift+C); export to `scripts/*.md` in existing markdown table format; reference file editor in the web UI (edit brand-voice.md and metrics-log.md without opening a terminal); status workflow (draft → ready → recorded → published).

**Avoids from ARCHITECTURE.md anti-patterns:** Reference files never duplicated into the database — export writes to `scripts/`, reference edits write back to `.claude/skills/devlog-scriptwriter/references/` in-place.

**Research flag:** Anti-slop inline highlighting implementation needs brief targeted research. Applying regex-matched highlights inside editable text areas has edge cases around cursor position preservation, selection behavior, and React reconciliation. Multiple implementation approaches exist (overlay div, mark elements, contenteditable with decorated spans) and the choice has UX implications. Allocate 1-2 hours of research before implementing this feature.

### Phase Ordering Rationale

- **Schema first, always:** Pitfall 2 (blob storage) and Pitfall 5 (missing status field) are architectural mistakes with HIGH recovery cost (1-5 days of migration work). Both must be decided and implemented before any AI or UI code is written.
- **AI generation before editor:** The editor has nothing meaningful to display until scripts exist in the database. Phase 2 before Phase 3 ensures the editor is developed against real generated data, not mock fixtures.
- **Feature dependency chain enforced by phase boundaries:** Anti-slop score display (Phase 3) must work before anti-slop inline highlighting (Phase 4). Beat editor (Phase 3) must exist before export to markdown (Phase 4). Script library (Phase 3) must exist before script search (P2 feature, Phase 4).
- **P3 features excluded from all phases:** Beat drag-and-drop, script comparison, generation history, and metrics dashboard are deferred until workflow volume makes the friction they solve observable. Building them speculatively adds complexity without validated need.

### Research Flags

Phases needing deeper research during planning:
- **Phase 4, anti-slop inline highlighting:** Regex pattern highlighting inside editable text has non-trivial edge cases (cursor position, React reconciliation, selection ranges). Worth 1-2 hours of targeted research before implementation. Possible approaches: overlay div with pointer-events none, mark/span decoration in contenteditable, or textarea + transparent overlay.

Phases with standard well-documented patterns (skip research-phase):
- **Phase 1:** Next.js 16 scaffold, Drizzle + better-sqlite3 setup, and environment variable security are fully covered by official documentation
- **Phase 2:** Vercel AI SDK streaming with App Router is a primary documented use case with official examples
- **Phase 3:** Custom sortable textarea list with React is standard; no novel patterns required

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs verified for Next.js 16 (released early 2026), Vercel AI SDK, Drizzle ORM, shadcn/ui v4 (March 2026 release); version compatibility confirmed across all packages |
| Features | MEDIUM-HIGH | P1/P2/P3 split is well-reasoned against Pavlo's actual workflow; competitor analysis confirms dual-track + anti-slop is a genuine differentiator; P3 deferral decisions are opinionated but sound |
| Architecture | HIGH | Reference file sharing pattern is unambiguous and eliminates data duplication risk; streaming and schema decisions are verified against official documentation; single-user SQLite is the correct choice |
| Pitfalls | HIGH | ToS ban on Max subscription OAuth confirmed by multiple news sources (February 2026) and official Anthropic policy; streaming buffering and blob storage pitfalls are verified against official Next.js and Anthropic SDK documentation |

**Overall confidence:** HIGH

### Gaps to Address

- **STACK.md vs PITFALLS.md contradiction on AI backend:** STACK.md recommends `@anthropic-ai/claude-agent-sdk` which uses Max subscription OAuth (no API key needed). PITFALLS.md documents that Anthropic banned this usage in February 2026 with active enforcement. Resolution: PITFALLS.md is the higher-confidence and more recent finding. Use Vercel AI SDK with an Anthropic API key. Treat the Agent SDK recommendation in STACK.md as superseded.

- **Windows build tools for better-sqlite3:** `better-sqlite3` requires Python 3.x and Visual Studio Build Tools as a native C++ addon. Pavlo likely has these from Unreal Engine development, but this should be verified during Phase 1 before committing to the stack. If prebuild binaries fail to install, `@libsql/client` (pure JavaScript, no native compilation) is the fallback with a compatible API surface.

- **Metrics log editing without a dashboard:** FEATURES.md defers the metrics dashboard to v2+. However, ARCHITECTURE.md includes `metrics-log.md` as a reference file injected into every generation prompt, making it part of the active feedback loop. Phase 4 should include a simple reference file editor for `metrics-log.md` so the feedback loop functions from the web UI without requiring a terminal session. This is editing a markdown file, not building a dashboard — low complexity, high workflow value.

## Sources

### Primary (HIGH confidence)
- [Anthropic ToS enforcement on third-party OAuth (The Register, Feb 2026)](https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access/) — Max subscription OAuth ban confirmed with enforcement details
- [Anthropic bans subscription OAuth (WinBuzzer, Feb 2026)](https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/) — corroborating source for ToS enforcement
- [Claude API Pricing (official)](https://platform.claude.com/docs/en/about-claude/pricing) — cost calculations for Haiku 4.5 and Sonnet 4.6
- [Claude Code Headless / Agent SDK (official)](https://code.claude.com/docs/en/headless) — programmatic usage, auth flow, `query()` options
- [Agent SDK TypeScript Reference (official)](https://platform.claude.com/docs/en/agent-sdk/typescript) — full API surface, `settingSources`, `outputFormat`
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) — release announcement, breaking changes from 15, Turbopack default
- [Next.js App Router Docs](https://nextjs.org/docs/app) — Server Components, Server Actions, Route Handlers
- [Vercel AI SDK: Getting Started with Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — streaming, structured output, provider setup
- [Vercel AI SDK: Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) — provider configuration and model IDs
- [Drizzle ORM SQLite Guide](https://orm.drizzle.team/docs/get-started-sqlite) — better-sqlite3 integration, synchronous API
- [shadcn/ui v4 Changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — March 2026 release, Next.js 16 + React 19 + Tailwind v4 compatibility

### Secondary (MEDIUM confidence)
- [Next.js SSE discussion #48427](https://github.com/vercel/next.js/discussions/48427) — streaming buffering behavior in Route Handlers confirmed by community
- [Fixing Slow SSE in Next.js (Medium)](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) — required headers for streaming (`X-Accel-Buffering: no`, `Cache-Control: no-cache`)
- [Prisma SQLite Performance Issue](https://github.com/prisma/prisma/issues/12785) — 100x slower than better-sqlite3 benchmark, referenced in Drizzle vs Prisma decision
- [BlockNote Next.js docs](https://www.blocknotejs.org/docs/advanced/nextjs) — SSR hydration requirements confirming the `ssr: false` requirement for block editors
- [Vercel AI SDK streaming (LogRocket)](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) — implementation patterns and streaming UX
- [Maekersuite Script Editor](https://maekersuite.com/tools/script-editor) — competitor analysis: AI script generation, no dual-track, no quality scoring
- [Squibler AI Script Writer](https://www.squibler.io/ai-script-writer/) — competitor analysis: chapter-based sidebar, no anti-slop

### Tertiary (LOW confidence — evaluated and rejected)
- [CLIProxyAPI blog](https://rogs.me/2026/02/use-your-claude-max-subscription-as-an-api-with-cliproxyapi/) — demonstrates the anti-pattern; explicitly rejected due to ToS violation risk
- [claude-code-webui (sugyan)](https://github.com/sugyan/claude-code-webui) — terminal emulator approach reviewed but not followed; overkill for script generation use case

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
