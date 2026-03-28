# Stack Research

**Domain:** Web UI for AI-assisted scriptwriting pipeline (local app)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Important Context

This is a SUBSEQUENT MILESTONE. The CLI-based scriptwriting pipeline (custom skill, anti-slop scoring, brand voice) already works. This research covers ONLY what is needed to wrap it in a local web UI. The existing skill files, reference documents, and companion skills remain unchanged.

**The critical question:** How to call Claude AI from a web app using Pavlo's existing Claude Max subscription ($100/month) without additional API costs.

---

## AI Backend Decision: Claude Code Agent SDK

**Verdict:** Use `@anthropic-ai/claude-agent-sdk` -- Anthropic's official TypeScript SDK that spawns Claude Code as a subprocess. It inherits Max subscription auth automatically.

**Confidence:** HIGH -- verified via [official Claude Code docs](https://code.claude.com/docs/en/headless) and [Agent SDK TypeScript reference](https://platform.claude.com/docs/en/agent-sdk/typescript).

### How It Works

The Agent SDK spawns the Claude Code CLI binary as a child process, communicating over stdin/stdout via JSON-lines. When you call `query()`, it starts a Claude Code session that:

1. Uses the same auth as `claude` CLI (Max subscription OAuth -- no API key needed)
2. Automatically loads CLAUDE.md, skills, MCP servers from the working directory
3. Streams messages back as an async generator
4. Supports structured JSON output with schema validation

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const conversation = query({
  prompt: "Generate a script using The Bug format about collision detection",
  options: {
    cwd: "/path/to/content-pavyny",
    // Loads devlog-scriptwriter skill, brand-voice.md, anti-slop rules automatically
    settingSources: ["project"],
    allowedTools: ["Read"],
    outputFormat: {
      type: "json_schema",
      schema: scriptOutputSchema
    }
  }
});

for await (const message of conversation) {
  // Stream to the web UI in real-time
}
```

### Why NOT Other Approaches

| Approach | Why Rejected |
|----------|-------------|
| **Anthropic API (`@anthropic-ai/sdk`)** | Requires separate API key with per-token billing. Max subscription does NOT include API access -- [confirmed by Anthropic](https://support.claude.com/en/articles/9876003). Would cost additional money on top of $100/month Max. |
| **CLIProxyAPI** | Third-party Go binary that proxies Max subscription OAuth tokens into OpenAI-compatible API format. Clever hack but: (1) unofficial, (2) fragile if Anthropic changes auth flow, (3) unnecessary when official Agent SDK exists. |
| **Raw `claude -p` subprocess** | Works but you'd be reimplementing what the Agent SDK already provides: process management, streaming, structured output, error handling. The SDK is literally a wrapper around `claude -p`. |
| **Claude Code Web UI projects (sugyan, vultuk)** | Full terminal emulators for Claude Code in browser. Overkill -- we need script generation, not a general-purpose Claude terminal. |

### Key Agent SDK Options for This Project

| Option | Value | Purpose |
|--------|-------|---------|
| `cwd` | Project directory | So Claude finds CLAUDE.md and skills |
| `settingSources` | `["project"]` | Load CLAUDE.md, skills from project dir |
| `allowedTools` | `["Read"]` | Auto-approve reading reference files |
| `outputFormat` | JSON schema | Get structured script output (beats, hooks, scores) |
| `maxTurns` | `3-5` | Limit agentic loops for predictable response times |
| `systemPrompt` | `{ type: "preset", preset: "claude_code", append: "..." }` | Use Claude Code's system prompt + scriptwriting instructions |

### Auth Flow

1. Pavlo runs `claude` CLI once to authenticate with Max subscription (already done)
2. OAuth token is stored in system keychain
3. Agent SDK spawns `claude` subprocess which reads the same keychain
4. No API key, no env vars, no additional cost

**CRITICAL:** Do NOT set `ANTHROPIC_API_KEY` environment variable. If present, Claude Code uses API billing instead of Max subscription. The Agent SDK docs confirm: "Bare mode skips OAuth and keychain reads. Anthropic authentication must come from ANTHROPIC_API_KEY or an apiKeyHelper." So in non-bare mode (our case), it uses the keychain OAuth token from Max.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x | Full-stack React framework | Current stable release (16.2 as of March 2026). App Router with React Server Components for server-side Claude SDK calls. Server Actions for form submissions (generate script, save edits). Turbopack is now the default bundler -- fast dev server. Pavlo already knows React + TypeScript. |
| React | 19.x | UI rendering | Ships with Next.js 16. View Transitions for smooth page navigation. |
| TypeScript | 5.x | Type safety | Already in Pavlo's stack. Type the script schema, beat structure, API responses. |
| `@anthropic-ai/claude-agent-sdk` | latest | AI backend | Official SDK. Spawns Claude Code as subprocess. Uses Max subscription auth. Streams responses. Structured JSON output. |
| Drizzle ORM | 0.45.x | Database ORM | Type-safe, SQL-like syntax, zero overhead over raw SQL. Native `better-sqlite3` support with synchronous API matching SQLite's architecture. Schema-as-code with `drizzle-kit` migrations. Much lighter than Prisma (no engine binary, no WASM). |
| better-sqlite3 | 11.x | SQLite driver | Synchronous API aligns with SQLite's single-writer model. Fastest Node.js SQLite driver. No async overhead. Used by Drizzle as recommended driver. |
| Tailwind CSS | 4.x | Styling | Ships with Next.js 16 via `create-next-app`. OKLCh color tokens. Pavlo's stack already uses it. |
| shadcn/ui | v4 (CLI) | UI components | Copy-paste components (not a dependency). Radix UI primitives for accessibility. v4 released March 2026 with full Next.js 16 + React 19 + Tailwind v4 support. Perfect for a local tool -- no design system needed, just grab components. |

### Why Next.js 16 Over 15

Next.js 16 was released in early 2026. Key changes from 15:

| Change | Impact on This Project |
|--------|----------------------|
| Caching is fully opt-in (no more surprising cached responses) | Simpler mental model -- AI responses are never cached by default |
| `middleware` renamed to `proxy` | Minor naming change, follow the new convention |
| React 19.2 with View Transitions | Smooth navigation between script list and editor |
| Turbopack is default bundler (stable for dev + prod) | Faster builds |
| Async request APIs enforced (no more sync compat) | Use `await cookies()`, `await params` etc. |

If for some reason Next.js 16 causes issues, Next.js 15.5.x is a safe fallback -- the App Router API is nearly identical.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 3.x | Schema validation | Validate script structure, form inputs, Agent SDK output schemas. Already a dependency of the Agent SDK. |
| `sonner` | latest | Toast notifications | "Script saved", "Anti-slop score: 42/50", error messages. shadcn/ui uses it. |
| `lucide-react` | latest | Icons | shadcn/ui's icon library. Consistent with the component set. |
| `@tanstack/react-table` | latest | Script library table | Sortable, filterable table for browsing saved scripts. Only if script count grows beyond simple list. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `drizzle-kit` | DB migrations | `npx drizzle-kit push` for dev, `npx drizzle-kit migrate` for schema changes. Schema-as-code. |
| `eslint` + `@eslint/config` | Linting | Ships with `create-next-app`. |
| Turbopack | Bundler | Default in Next.js 16. No config needed. |

---

## Installation

```bash
# Scaffold Next.js 16 project (in project directory)
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir

# Core dependencies
cd web
npm install @anthropic-ai/claude-agent-sdk drizzle-orm better-sqlite3 zod

# Dev dependencies
npm install -D drizzle-kit @types/better-sqlite3

# UI components (copy into project, not an npm dependency)
npx shadcn@latest init
npx shadcn@latest add button card input textarea tabs badge dialog sheet table
```

---

## Database: SQLite via Drizzle ORM + better-sqlite3

### Why SQLite

This is a single-user local app. No server deployment, no concurrent users, no cloud database needed.

| Concern | SQLite Answer |
|---------|--------------|
| Concurrent access | Single user -- not an issue |
| Backup | Copy one `.db` file |
| Setup | Zero config, file-based |
| Performance | Sub-millisecond reads for hundreds of scripts |
| Portability | Works on Windows and macOS (Pavlo uses both) |

### Why Drizzle Over Prisma

| Factor | Drizzle | Prisma |
|--------|---------|--------|
| Bundle size | ~50KB | ~15MB (engine binary) |
| SQLite sync API | Native `db.select().all()` | Async-only (fights SQLite's architecture) |
| Schema | TypeScript code | Separate `.prisma` schema file |
| Migrations | `drizzle-kit push` (dev) / `drizzle-kit migrate` (prod) | `prisma migrate` |
| Performance | Near-raw SQL speed | [100x slower than better-sqlite3 in benchmarks](https://github.com/prisma/prisma/issues/12785) |
| Cold start | Instant | Engine initialization delay |

For a local tool with simple data (scripts, beats, scores), Drizzle's lightweight approach is the right choice.

### Example Schema

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const scripts = sqliteTable("scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  format: text("format").notNull(),        // "the-bug", "the-satisfaction", etc.
  hookVariant: text("hook_variant"),
  status: text("status").default("draft"), // "draft", "recorded", "published"
  slopScore: real("slop_score"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const beats = sqliteTable("beats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptId: integer("script_id").references(() => scripts.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  visual: text("visual").notNull(),       // What's on screen
  voiceover: text("voiceover").notNull(), // What Pavlo says
  duration: text("duration"),             // "2-3s"
});
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Vite + React | If SSR/Server Components are unwanted; but we need server-side SDK calls |
| Next.js 16 | Remix / React Router 7 | If you prefer loader/action pattern; Next.js is more familiar to Pavlo |
| Drizzle ORM | Prisma | If you need a visual schema editor (Prisma Studio); accept the performance cost |
| Drizzle ORM | Raw better-sqlite3 | If schema is truly minimal (2-3 tables); skip ORM overhead entirely |
| better-sqlite3 | `@libsql/client` | If you later want Turso cloud sync; for local-only, better-sqlite3 is simpler |
| shadcn/ui | Radix UI directly | If you want full control; shadcn is built on Radix anyway |
| shadcn/ui | Headless UI (Tailwind Labs) | If you prefer Headless UI patterns; but shadcn has more components and Next.js integration |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@anthropic-ai/sdk` (API SDK) | Requires API key with per-token billing. Does NOT use Max subscription. Additional cost. | `@anthropic-ai/claude-agent-sdk` (Agent SDK) |
| MongoDB / PostgreSQL | Over-engineered for single-user local app. Requires running a server process. | SQLite via better-sqlite3 |
| Prisma | 15MB engine binary, async-only SQLite access, 100x slower than better-sqlite3 | Drizzle ORM |
| `ANTHROPIC_API_KEY` env var | If set, Claude Code switches to API billing instead of Max subscription | Remove it; rely on OAuth keychain auth |
| Redux / Zustand for state | App is simple enough for React state + Server Components | React `useState` + Server Actions |
| tRPC | Adds complexity layer between frontend and backend; Server Actions are sufficient | Next.js Server Actions |
| Docker | Local dev tool, not a deployed service | Run directly with `npm run dev` |
| Electron | Adds 100MB+ overhead just for native window; `localhost:3000` in browser works fine | Next.js dev server |

---

## Stack Patterns by Variant

**For script generation (AI calls):**
- Use Server Actions that call Agent SDK `query()`
- Stream responses to client via `ReadableStream` + React Suspense
- Structured JSON output with Zod schema for typed beat/hook data

**For script storage (CRUD):**
- Drizzle ORM with better-sqlite3 in Server Components
- No API routes needed -- direct DB calls in Server Components/Actions
- SQLite file stored in project root: `./data/scripts.db`

**For script editing (interactive UI):**
- Client Components with `useState` for beat-level editing
- Save via Server Action on blur/button click
- Optimistic updates for responsiveness

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.x | React 19.x | Ships together |
| `@anthropic-ai/claude-agent-sdk` | Node.js 18+ | Requires `claude` CLI installed and authenticated |
| Drizzle ORM 0.45.x | better-sqlite3 11.x | Use `drizzle-orm/better-sqlite3` import |
| drizzle-kit | Drizzle ORM 0.45.x | Keep versions in sync |
| shadcn/ui v4 | React 19, Tailwind v4 | Full compatibility as of March 2026 |
| better-sqlite3 11.x | Node.js 18-22 | Native addon, needs node-gyp on Windows |
| Tailwind CSS 4.x | Next.js 16.x | Ships with `create-next-app` |

### Windows Note (better-sqlite3)

`better-sqlite3` is a native C++ addon. On Windows, it requires:
- Python 3.x (for node-gyp)
- Visual Studio Build Tools or `windows-build-tools`

If this causes issues, prebuild binaries are available and usually work automatically via `npm install`. Pavlo's dev machine likely already has build tools from UE5 development.

---

## Sources

### Official Documentation (HIGH confidence)
- [Claude Code Headless / Agent SDK](https://code.claude.com/docs/en/headless) -- programmatic usage, `-p` flag, streaming, structured output
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) -- `query()` function, Options type, full API
- [Claude Subscription vs API Pricing](https://support.claude.com/en/articles/9876003) -- confirmed Max subscription and API are separate billing
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- release announcement, breaking changes from 15
- [Next.js App Router Docs](https://nextjs.org/docs/app) -- Server Components, Server Actions, routing
- [Drizzle ORM SQLite Guide](https://orm.drizzle.team/docs/get-started-sqlite) -- better-sqlite3 integration, sync API
- [shadcn/ui v4 Changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) -- March 2026 release, Next.js 16 support

### Verified Community Sources (MEDIUM confidence)
- [CLIProxyAPI Blog Post](https://rogs.me/2026/02/use-your-claude-max-subscription-as-an-api-with-cliproxyapi/) -- third-party Max proxy (evaluated and rejected)
- [claude-code-webui](https://github.com/sugyan/claude-code-webui) -- reference implementation for web + Claude Code integration
- [Prisma SQLite Performance Issue](https://github.com/prisma/prisma/issues/12785) -- 100x slower than better-sqlite3 benchmark

---
*Stack research for: Devlog Scriptwriter Web UI (v2.0 milestone)*
*Researched: 2026-03-28*
