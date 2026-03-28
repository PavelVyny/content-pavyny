# Architecture Research

**Domain:** Local web app wrapping AI scriptwriting pipeline
**Researched:** 2026-03-26
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (localhost:3000)                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Generate │  │  Script   │  │  Script  │  │  Anti-Slop   │    │
│  │   Form   │  │  Editor   │  │  Library │  │   Display    │    │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │              │             │               │             │
├───────┴──────────────┴─────────────┴───────────────┴─────────────┤
│                     Next.js App Router                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Server       │  │ API Routes   │  │ Reference File       │    │
│  │ Actions      │  │ (streaming)  │  │ Loader               │    │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘    │
│         │                │                     │                 │
├─────────┴────────────────┴─────────────────────┴─────────────────┤
│                     Service Layer                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │ AI Service  │  │ Script Store │  │ Reference Manager    │     │
│  │ (Claude)    │  │ (SQLite)     │  │ (reads .md files)    │     │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘     │
│         │                │                     │                 │
├─────────┴────────────────┴─────────────────────┴─────────────────┤
│                     External / Filesystem                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │ Claude API  │  │ scripts.db   │  │ .claude/skills/      │     │
│  │ (Anthropic) │  │ (local file) │  │ devlog-scriptwriter/  │     │
│  └─────────────┘  └──────────────┘  └──────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Generate Form | Collect user input (format, context, dev progress) and trigger script generation | React client component with controlled form + format selector dropdown |
| Script Editor | Display and edit dual-track scripts (visual | voiceover) as block rows | React client component with contentEditable blocks or textarea per cell |
| Script Library | List, search, filter, delete saved scripts | Server component for initial load + client search/filter |
| Anti-Slop Display | Show scoring breakdown (5 dimensions), highlight banned phrases in script text | Pure client component receiving score data from AI response |
| Server Actions | Handle form submissions (save, delete, update scripts) | Next.js `'use server'` functions in `app/actions/` |
| API Routes (streaming) | Stream AI-generated scripts token by token to the client | Route handler at `app/api/generate/route.ts` using Vercel AI SDK |
| Reference File Loader | Read brand-voice.md, anti-slop-rules.md, video-formats.md, metrics-log.md at generation time | Node.js `fs.readFileSync` on server side, content injected into system prompt |
| AI Service | Build prompts from skill + reference files, call Claude API, parse structured responses | Vercel AI SDK with `@ai-sdk/anthropic` provider |
| Script Store | Persist scripts with metadata (title, format, score, dates) | SQLite via `better-sqlite3` |
| Reference Manager | CRUD operations on reference files (edit brand voice, update metrics log) | Direct filesystem read/write with markdown parsing |

## AI Backend: The Critical Decision

The PROJECT.md states: "AI Backend: Requires research -- must work with Claude Max subscription without additional costs."

**Finding:** Claude Max subscription does NOT include API access. The Claude API requires separate billing through the Anthropic Console. This is confirmed by Anthropic's help center.

**Three options, in order of recommendation:**

### Option 1: Anthropic API with minimal spend (RECOMMENDED)

Use `@ai-sdk/anthropic` with a separate API key. Script generation is low-volume (5-10 scripts/week). With Claude 3.5 Haiku for generation:

- Input: ~4K tokens (system prompt with reference files + user input)
- Output: ~1K tokens (script + score)
- Cost per script: ~$0.005-0.01
- Monthly cost for 40 scripts: ~$0.20-0.40

This is negligible. Use Haiku for drafts, Sonnet for final polish if needed. Set a $5/month spend limit in Console.

**Confidence:** HIGH -- based on official Anthropic pricing and SDK documentation.

### Option 2: CLIProxyAPI (Max subscription as API)

Open-source proxy that exposes Claude Max subscription as an OpenAI-compatible API endpoint. Uses the OAuth token from Claude Code CLI.

**Pros:** Zero additional cost if you already pay for Max.
**Cons:** Terms of Service gray area -- Anthropic has blocked subscription usage outside Claude Code before. Could break at any time. Requires running a separate proxy process. Only confirmed working on Linux/macOS (Pavlo uses Windows primarily).

**Confidence:** LOW -- relies on unofficial workaround that may violate ToS.

### Option 3: Direct Anthropic SDK without Vercel AI SDK

Use `@anthropic-ai/sdk` directly. More control, less abstraction. But you lose the unified streaming helpers and would need to implement streaming manually.

**Verdict:** Use Option 1 (Anthropic API + Vercel AI SDK). The cost is effectively zero for this use case. The Vercel AI SDK provides streaming, structured output, and provider abstraction out of the box.

## Recommended Project Structure

```
content-pavyny/
├── .claude/skills/devlog-scriptwriter/    # EXISTING -- skill files (read-only for web app)
│   ├── SKILL.md
│   └── references/
│       ├── anti-slop-rules.md
│       ├── brand-voice.md
│       ├── video-formats.md
│       └── metrics-log.md
├── scripts/                               # EXISTING -- generated scripts as markdown
│   └── 007-dead-world-to-living-forest.md
├── app/                                   # NEW -- Next.js app
│   ├── layout.tsx                         # Root layout with nav
│   ├── page.tsx                           # Dashboard / script library
│   ├── generate/
│   │   └── page.tsx                       # Script generation form
│   ├── scripts/
│   │   └── [id]/
│   │       └── page.tsx                   # Script editor view
│   ├── api/
│   │   └── generate/
│   │       └── route.ts                   # Streaming AI endpoint
│   └── actions/
│       ├── scripts.ts                     # CRUD server actions for scripts
│       └── references.ts                  # Read/update reference files
├── components/
│   ├── generate-form.tsx                  # Format picker + context input
│   ├── script-editor.tsx                  # Dual-track block editor
│   ├── script-block.tsx                   # Single visual|voiceover row
│   ├── script-card.tsx                    # Library list item
│   ├── anti-slop-panel.tsx                # Score display + phrase highlights
│   ├── format-selector.tsx                # Video format dropdown with descriptions
│   └── hook-variants.tsx                  # Display 2-3 hook options
├── lib/
│   ├── ai/
│   │   ├── client.ts                      # Vercel AI SDK setup + anthropic provider
│   │   ├── prompts.ts                     # System prompt builder (loads reference files)
│   │   └── parser.ts                      # Parse AI response into Script structure
│   ├── db/
│   │   ├── index.ts                       # SQLite connection (better-sqlite3)
│   │   ├── schema.ts                      # Table definitions
│   │   └── migrations/                    # Schema migrations
│   ├── references.ts                      # Read/write .claude/skills/ reference files
│   ├── anti-slop.ts                       # Client-side banned phrase scanner
│   └── types.ts                           # Shared TypeScript types
├── public/
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Structure Rationale

- **`app/` stays thin:** Pages are routing shells. Business logic lives in `lib/`, UI in `components/`. This keeps the App Router pages focused on layout and data loading.
- **`lib/ai/` encapsulates all AI logic:** The prompt builder reads reference files and constructs the system prompt. The parser turns AI text output into typed Script objects. This is the bridge between the existing skill files and the web app.
- **`lib/references.ts` reads existing files in-place:** Reference files stay in `.claude/skills/devlog-scriptwriter/references/`. The web app reads them directly via filesystem. No duplication. When Pavlo edits brand-voice.md through Claude Code CLI or the web UI, both tools see the same data.
- **`components/` is flat:** With only 7-8 components, nesting into subfolders adds friction without value.
- **`scripts/` directory is the source of truth for exported scripts:** The database stores working drafts and metadata. Export writes a markdown file to `scripts/` matching the existing format (see script #7 for the template).

## Architectural Patterns

### Pattern 1: Reference Files as System Prompt Context

**What:** At generation time, the server reads all 4 reference markdown files from disk, concatenates them into a structured system prompt, and sends to Claude. This replicates what SKILL.md does in Claude Code -- the skill instructs Claude to "read brand-voice.md" etc. The web app does this reading programmatically.

**When to use:** Every AI generation request.

**Trade-offs:** Reads files from disk on every request (negligible for local app). Reference files are ~10KB total -- well within Claude's context window. No caching needed for this scale.

```typescript
// lib/ai/prompts.ts
import { readFileSync } from 'fs';
import { join } from 'path';

const REFS_DIR = join(process.cwd(), '.claude/skills/devlog-scriptwriter/references');

export function buildSystemPrompt(format: string): string {
  const brandVoice = readFileSync(join(REFS_DIR, 'brand-voice.md'), 'utf-8');
  const antiSlop = readFileSync(join(REFS_DIR, 'anti-slop-rules.md'), 'utf-8');
  const videoFormats = readFileSync(join(REFS_DIR, 'video-formats.md'), 'utf-8');
  const metrics = readFileSync(join(REFS_DIR, 'metrics-log.md'), 'utf-8');

  return `You are a devlog scriptwriter for Pavlo's YouTube Shorts channel.

## Brand Voice
${brandVoice}

## Anti-Slop Rules
${antiSlop}

## Video Format to Use: ${format}
${videoFormats}

## Performance Metrics (for context)
${metrics}

## Output Format
Return the script as structured JSON matching this schema:
{
  "hooks": [{ "variant": "A", "visual": "...", "voiceover": "..." }],
  "beats": [{ "visual": "...", "voiceover": "..." }],
  "titles": ["...", "...", "..."],
  "thumbnail": "...",
  "duration_estimate": "~42 seconds",
  "anti_slop_score": {
    "directness": 8, "rhythm": 7, "trust": 8, "authenticity": 7, "density": 8,
    "total": 38, "notes": "..."
  }
}`;
}
```

### Pattern 2: Streaming Generation with Structured Output

**What:** Use Vercel AI SDK's `streamText` for the generation endpoint. The AI streams the response token-by-token to the client, giving immediate visual feedback. After streaming completes, parse the full response into the Script structure.

**When to use:** The `/api/generate` route handler.

**Trade-offs:** Streaming gives great UX but structured JSON output can be tricky to parse mid-stream. Two approaches: (a) stream raw text then parse on completion, or (b) use `generateObject` for guaranteed structure but no streaming. Recommend (a) -- stream the text for UX, parse after completion for the editor.

```typescript
// app/api/generate/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  const { format, context } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-haiku-20241022'),
    system: buildSystemPrompt(format),
    prompt: `Write a script in "${format}" format.\n\nDev context: ${context}`,
  });

  return result.toDataStreamResponse();
}
```

### Pattern 3: Dual-Track Editor as Block Array

**What:** The script editor represents each beat as an editable block with two cells: visual description and voiceover text. The script is an array of blocks. Blocks can be reordered, added, removed, or edited inline.

**When to use:** The script editing view.

**Trade-offs:** More complex than a single textarea but matches the existing dual-track format perfectly. The existing script format (see script #7) already uses a markdown table with VISUAL | VOICEOVER columns -- this is the same structure, just rendered as editable blocks instead of a table.

```typescript
// lib/types.ts
interface ScriptBeat {
  id: string;
  visual: string;
  voiceover: string;  // can be empty for visual-only beats
}

interface Script {
  id: number;
  title: string;
  format: string;         // "The Bug", "The Satisfaction", etc.
  hooks: HookVariant[];   // 2-3 variants
  beats: ScriptBeat[];
  titles: string[];       // 3 title options
  thumbnail: string;
  durationEstimate: string;
  antiSlopScore: AntiSlopScore;
  status: 'draft' | 'ready' | 'recorded' | 'published';
  createdAt: string;
  updatedAt: string;
}
```

## Data Flow

### Script Generation Flow

```
[User fills Generate Form]
    ↓ (format, dev context, optional notes)
[POST /api/generate]
    ↓
[Server reads reference files from disk]
    ↓ (brand-voice.md + anti-slop-rules.md + video-formats.md + metrics-log.md)
[Builds system prompt with all context]
    ↓
[Calls Claude via Vercel AI SDK (streaming)]
    ↓ (tokens stream back)
[Client displays streaming text]
    ↓ (on completion)
[Parser extracts structured Script from response]
    ↓
[User reviews: picks hook variant, edits beats]
    ↓
[Server Action saves to SQLite]
    ↓
[Script appears in library]
```

### Script Editing Flow

```
[User opens script from library]
    ↓
[Server loads script from SQLite]
    ↓
[Editor renders beats as block array]
    ↓
[User edits visual/voiceover cells inline]
    ↓ (on each edit)
[Client-side anti-slop scanner re-scores voiceover text]
    ↓ (highlights banned phrases in red)
[Anti-Slop Panel updates score in real-time]
    ↓
[User clicks Save → Server Action updates SQLite]
```

### Script Export Flow

```
[User clicks Export on a script]
    ↓
[Server Action reads script from SQLite]
    ↓
[Formats as markdown matching existing script template]
    ↓ (# Script #N: {title}\n**Format:**\n## Hook Variants\n## Script (Dual-Track)\n| VISUAL | VOICEOVER |)
[Writes to scripts/{number}-{slug}.md]
    ↓
[File is now readable by Claude Code skill + committed to git]
```

### Key Data Flows

1. **Reference files are read, not duplicated:** The web app reads `.claude/skills/devlog-scriptwriter/references/*.md` directly from disk. Both Claude Code CLI and the web app operate on the same files. Edits in either tool are immediately visible to the other.

2. **SQLite is the draft workspace:** Generated scripts go into SQLite as drafts. They can be edited, re-scored, and polished. Only when exported do they become markdown files in `scripts/`.

3. **Anti-slop scoring happens twice:** First by Claude during generation (full 5-dimension scoring with notes). Second by the client-side scanner during editing (real-time banned phrase highlighting + approximate re-scoring based on pattern matching).

## Database Schema

```sql
CREATE TABLE scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  format TEXT NOT NULL,                    -- "The Bug", "The Satisfaction", etc.
  hooks TEXT NOT NULL,                     -- JSON array of hook variants
  beats TEXT NOT NULL,                     -- JSON array of {visual, voiceover} blocks
  titles TEXT NOT NULL,                    -- JSON array of 3 title options
  thumbnail TEXT,                          -- thumbnail concept description
  duration_estimate TEXT,                  -- "~42 seconds"
  anti_slop_score TEXT,                    -- JSON: {directness, rhythm, trust, authenticity, density, total, notes}
  dev_context TEXT,                        -- original input context
  status TEXT NOT NULL DEFAULT 'draft',    -- draft | ready | recorded | published
  exported_path TEXT,                      -- path to exported .md file, null if not exported
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Why SQLite with JSON columns instead of normalized tables:** This is a single-user local app. Scripts are written and read as units. Normalizing beats into a separate table adds join complexity for zero benefit. JSON columns with TypeScript parsing keep the code simple and the schema flat.

**Why `better-sqlite3` over Prisma/Drizzle:** For a single-user local app with one table, an ORM adds dependency weight without value. `better-sqlite3` is synchronous (simpler in server actions), fast, and zero-config. If the schema grows beyond 2-3 tables, reconsider.

## Anti-Slop Integration

The anti-slop system works at two levels:

### Level 1: AI-side scoring (generation time)

The system prompt includes the full anti-slop-rules.md content. Claude scores its own output on 5 dimensions and rewrites if below 35/50. This is the same behavior as SKILL.md's "Anti-Slop Scoring (Mandatory)" section.

### Level 2: Client-side scanning (editing time)

A lightweight TypeScript module scans voiceover text against the banned phrase list. This provides:
- Real-time highlighting of banned phrases as the user edits
- Approximate re-scoring after human edits (catches regressions if Pavlo accidentally adds a banned phrase)
- Visual feedback in the Anti-Slop Panel

```typescript
// lib/anti-slop.ts
const BANNED_WORDS = [
  'journey', 'dive into', 'deep dive', 'game-changer', 'landscape',
  'realm', 'leverage', 'utilize', 'harness', 'optimize', 'elevate',
  'empower', 'seamless', 'robust', 'streamline', 'innovative',
  'cutting-edge', 'delve', 'navigate', 'ecosystem', 'testament',
  // ... full list extracted from anti-slop-rules.md
];

export function scanForSlop(text: string): SlopMatch[] {
  return BANNED_WORDS
    .map(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = [...text.matchAll(regex)];
      return matches.map(m => ({
        phrase,
        index: m.index!,
        length: phrase.length,
      }));
    })
    .flat();
}
```

## Build Order Implications

Based on dependencies between components:

### Phase 1: Foundation (build first)

1. **Next.js project setup** with App Router, TypeScript, Tailwind
2. **SQLite database** with `better-sqlite3` -- schema + basic CRUD server actions
3. **Reference file loader** (`lib/references.ts`) -- reads existing .md files from disk
4. **Type definitions** (`lib/types.ts`) -- Script, ScriptBeat, AntiSlopScore, etc.

**Rationale:** Everything else depends on the database, types, and file access.

### Phase 2: AI Generation (build second)

5. **AI service** (`lib/ai/`) -- prompt builder, Vercel AI SDK setup with Anthropic provider
6. **Streaming API route** (`app/api/generate/route.ts`)
7. **Generate Form page** (`app/generate/page.tsx` + `components/generate-form.tsx`)
8. **Response parser** (`lib/ai/parser.ts`) -- structured Script from AI text

**Rationale:** This is the core value. Once generation works, scripts flow into the database and everything downstream has data to render.

### Phase 3: Editor + Library (build third)

9. **Script Library page** (`app/page.tsx`) -- list, search, filter scripts
10. **Script Editor page** (`app/scripts/[id]/page.tsx`) -- dual-track block editor
11. **Anti-slop client scanner** (`lib/anti-slop.ts`) + Anti-Slop Panel component

**Rationale:** Library and editor are read/write views of data that already exists from Phase 2.

### Phase 4: Polish (build last)

12. **Export to markdown** -- write script to `scripts/` directory in existing format
13. **Reference file editor** -- edit brand-voice.md, metrics-log.md from the web UI
14. **Status workflow** -- draft -> ready -> recorded -> published transitions

**Rationale:** These are quality-of-life features that enhance but don't enable the core workflow.

## Anti-Patterns

### Anti-Pattern 1: Duplicating Reference Files into the Database

**What people do:** Copy brand-voice.md, anti-slop-rules.md etc. into database tables, then keep them in sync with the filesystem versions.
**Why it's wrong:** Creates two sources of truth. The Claude Code CLI skill reads from disk. The web app would read from the database. They drift apart. Edits in one place don't propagate.
**Do this instead:** Always read reference files from their original location on disk (`.claude/skills/devlog-scriptwriter/references/`). Both tools share the same files.

### Anti-Pattern 2: Building a Full Rich Text Editor

**What people do:** Reach for Slate, TipTap, or ProseMirror to build a "proper" editor.
**Why it's wrong:** The script format is highly structured (array of visual|voiceover pairs). A rich text editor adds massive complexity for a use case that is essentially "edit cells in a table." The script is NOT a free-form document.
**Do this instead:** Render beats as a list of paired textareas or contentEditable divs. Each beat is a row with two fields. Simple, predictable, easy to serialize back to the Script type.

### Anti-Pattern 3: Over-engineering the AI Layer

**What people do:** Add LangChain, implement tool use, multi-step chains, RAG pipelines, vector embeddings for reference files.
**Why it's wrong:** The reference files are 10KB total. They fit trivially in Claude's context window. There is one generation step, not a chain. The skill's logic (read files -> generate script -> score -> rewrite if needed) is a single prompt, not a pipeline.
**Do this instead:** One system prompt containing all reference file content. One user message with format + context. One API call. Parse the response. Done.

### Anti-Pattern 4: Using CLIProxyAPI to Avoid API Costs

**What people do:** Route web app traffic through CLIProxyAPI to use the Max subscription instead of paying for API access.
**Why it's wrong:** Anthropic has blocked OAuth token usage outside Claude Code before. The proxy can break without warning. It adds a separate process dependency. And the actual API cost for this use case is under $1/month.
**Do this instead:** Get an Anthropic API key. Set a $5/month spend limit. Use Claude 3.5 Haiku for generation. The cost is negligible.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude API (Anthropic) | Vercel AI SDK `@ai-sdk/anthropic` provider, streaming via `streamText` | API key in `.env.local`. Use Haiku for cost efficiency. Sonnet available for complex scripts. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Web App <-> Skill Reference Files | Direct filesystem read (`fs.readFileSync`) | Web app reads reference files in-place. Both tools share the same files. |
| Web App <-> Script Markdown Files | Filesystem write on export | Export creates markdown in `scripts/` matching existing format. Import reads existing scripts on first run. |
| Client <-> Server | Server Actions (mutations) + Route Handlers (streaming) | Use Server Actions for CRUD. Use Route Handler only for the streaming generation endpoint. |
| AI Response <-> App Types | JSON parsing in `lib/ai/parser.ts` | The system prompt instructs Claude to return structured JSON. Parser validates and types the response. |

### Existing File Integration Map

| Existing File | How Web App Uses It | Read/Write |
|---------------|---------------------|------------|
| `.claude/skills/devlog-scriptwriter/SKILL.md` | Source of generation logic -- the system prompt replicates its rules | Read-only |
| `references/brand-voice.md` | Injected into system prompt at generation time. Optionally editable via web UI. | Read + optional Write |
| `references/anti-slop-rules.md` | Injected into system prompt. Banned phrases extracted for client-side scanner. | Read-only |
| `references/video-formats.md` | Injected into system prompt. Format names/descriptions populate the format selector dropdown. | Read-only |
| `references/metrics-log.md` | Injected into system prompt for context. Editable via web UI to log new video metrics. | Read + Write |
| `scripts/*.md` | Imported on first run to populate the library. Export target for finished scripts. | Read + Write |

## Sources

- [Anthropic Help Center: Max subscription vs API billing](https://support.claude.com/en/articles/9876003)
- [Vercel AI SDK: Getting Started with Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Vercel AI SDK: Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [Vercel AI SDK: Stream Text](https://ai-sdk.dev/cookbook/next/stream-text)
- [CLIProxyAPI GitHub](https://github.com/router-for-me/CLIProxyAPI) -- researched but NOT recommended
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)

---
*Architecture research for: Devlog Scriptwriter Web UI*
*Researched: 2026-03-26*
