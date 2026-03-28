# Pitfalls Research

**Domain:** AI-powered scriptwriting web UI (Next.js + Claude API + local DB)
**Researched:** 2026-03-26
**Confidence:** HIGH (core pitfalls verified through multiple sources and official policies)

> This document covers pitfalls specific to the v2.0 Web UI milestone.
> For scriptwriting/content pitfalls (anti-slop, voice drift, feedback loops), see the original project research or the skill documentation.

## Critical Pitfalls

### Pitfall 1: Claude Max Subscription Cannot Power the Web App Backend

**What goes wrong:**
Developer assumes the existing Claude Max subscription can be used to make API calls from the Next.js web app. It cannot. Anthropic explicitly bans using OAuth tokens from Max/Pro subscriptions in any third-party tool, app, or automated system. In January 2026, Anthropic deployed client fingerprinting to block unauthorized access. In February 2026, they updated Terms of Service to make this unambiguous. Accounts have been suspended for violations.

**Why it happens:**
Pavlo already pays for Claude Max. The assumption "I pay for Claude, I can use it in my local app" feels logical. Community proxy tools (CLIProxyAPI, claude-code-proxy) exist and appear to work, creating a false sense of legitimacy. But Anthropic's Consumer ToS states: accessing the Services through automated or non-human means is prohibited except when using an Anthropic API Key.

**How to avoid:**
Use the Anthropic API with a paid API key. For this project's scale, costs are negligible:
- Claude Haiku 4.5: $1 input / $5 output per million tokens
- Claude Sonnet 4.6: $3 input / $15 output per million tokens
- A 60-second script is ~120 words / ~200 tokens. With system prompt (~2K tokens), one generation costs ~$0.003 with Haiku
- With prompt caching (90% discount on repeated system prompts), even cheaper
- At 1 video/week with 5 generation attempts: ~$0.08/month with Haiku, ~$0.40/month with Sonnet
- Annual API cost: roughly $1-5. Negligible.

Alternative: use the Vercel AI SDK which provides a clean abstraction layer over the Anthropic SDK, handles streaming, and makes it trivial to switch models.

**Warning signs:**
- Plans to shell out to `claude` CLI as a subprocess
- Searching for "proxy" solutions to route Max subscription through an API
- Using OAuth tokens anywhere outside claude.ai or Claude Code terminal
- Considering `claude -p` (print mode) as a backend

**Phase to address:**
Phase 1 (Project Setup) -- API key provisioning is the very first infrastructure decision. Everything depends on it.

**Sources:**
- [Anthropic clarifies ban on third-party access (The Register)](https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access/)
- [Anthropic bans subscription OAuth (WinBuzzer)](https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/)
- [ToS violation guide (Dev Genius)](https://blog.devgenius.io/you-might-be-breaking-claudes-tos-without-knowing-it-228fcecc168c)
- [Claude API Pricing (official)](https://platform.claude.com/docs/en/about-claude/pricing)

---

### Pitfall 2: Streaming Response Buffering in Next.js Route Handlers

**What goes wrong:**
User clicks "Generate Script" and sees nothing for 10-30 seconds, then the entire response dumps at once. Or worse: the connection times out entirely for longer generations. The app feels broken even though the AI is working correctly.

**Why it happens:**
Next.js route handlers buffer the response by default. If you `await` the full Claude API response inside the handler before returning `Response`, Next.js holds everything until the handler finishes. The stream never reaches the client incrementally. Additionally, reverse proxies (NGINX, Cloudflare) buffer SSE streams unless headers explicitly disable it.

Common broken pattern:
```typescript
// WRONG: Buffers everything, user waits 15+ seconds seeing nothing
export async function POST(req: Request) {
  const result = await anthropic.messages.create({ stream: false, ... });
  return Response.json(result);
}
```

**How to avoid:**
Return the `Response` with a `ReadableStream` immediately. Async work runs inside the stream's controller:

```typescript
// CORRECT: Stream chunks to client as they arrive
export async function POST(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.stream({ ... });
      for await (const event of response) {
        if (event.type === 'content_block_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
```

Or better: use the Vercel AI SDK which handles all of this correctly via `streamText()`.

Required headers to prevent proxy buffering:
- `Content-Type: text/plain; charset=utf-8` (NOT `application/json`)
- `X-Accel-Buffering: no` (prevents NGINX buffering)
- `Cache-Control: no-cache` (prevents edge caching)

**Warning signs:**
- Response appears all at once after a long wait
- Timeout errors on longer generations (extended thinking, complex prompts)
- Works in development but breaks behind any reverse proxy
- `Content-Type` set to `application/json` on streaming endpoints

**Phase to address:**
Phase 2 (AI Integration) -- streaming must be implemented correctly from the start. Retrofitting streaming into a non-streaming architecture requires rewriting both API routes and all UI components that consume responses.

**Sources:**
- [Next.js SSE discussion #48427](https://github.com/vercel/next.js/discussions/48427)
- [Fixing Slow SSE in Next.js (Medium)](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996)
- [Streaming LLM in Next.js without timeouts (Eaures)](https://www.eaures.online/streaming-llm-responses-in-next-js)
- [Vercel AI SDK streaming guide (LogRocket)](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)

---

### Pitfall 3: Over-Engineering the Editor with a Block Editor Library

**What goes wrong:**
Developer reaches for a full-featured block editor (BlockNote, TipTap, Editor.js, Slate) when the actual data model is fixed and simple: a script is an ordered list of beats, each beat has a visual description and a voiceover line. The block editor adds weeks of integration complexity, introduces hydration errors with Next.js SSR, creates hard-to-debug edge cases, and ties the codebase to a heavy dependency -- all for a problem that doesn't require it.

**Why it happens:**
The spec says "block-based editor." This sounds like it needs a block editor library. But the blocks here are not arbitrary rich content -- they are a fixed schema: `{ visual: string, voiceover: string }[]`. A Notion-style editor supports headings, lists, embeds, tables, drag-and-drop of arbitrary types. This project needs none of that. Scripts are spoken aloud -- they don't need bold, italic, links, or rich formatting.

**How to avoid:**
Build a custom component: a sortable list of cards where each card has two textarea fields (visual description + voiceover). Use a lightweight drag-and-drop library (dnd-kit or @hello-pangea/dnd) for reordering. This gives:
- Full control over the data model (no fighting the library's schema)
- No hydration issues (simple textarea elements render fine in SSR)
- No dependency on complex editor libraries (~0 vs ~200KB bundle)
- Easy to add domain-specific features (anti-slop highlighting per beat, word count, timing estimates)
- Simpler testing and maintenance

Reserve block editor libraries for if/when the script format genuinely needs rich text. It likely never will.

**Warning signs:**
- Spending more than a day integrating an editor library
- Fighting the library's data model to fit the beat structure
- Customizing rendering for every block type to match the simple beat layout
- Editor bundle size exceeding 100KB

**Phase to address:**
Phase 3 (Script Editor) -- this is an architecture decision that must be made before writing any editor code. Document the decision explicitly: "custom beat-card list, not a library."

---

### Pitfall 4: Block Editor Hydration Mismatch (If You Use One Anyway)

**What goes wrong:**
If a block editor library is used, the page crashes on load with "Hydration failed because the initial UI does not match what was rendered on the server." The editor renders blank, shows a flash of unstyled content, or throws React errors.

**Why it happens:**
Rich text editors require browser APIs (DOM manipulation, Selection API, contenteditable). They cannot render on the server. Next.js App Router renders components as Server Components by default. If you import a block editor in a Server Component (or in a Client Component without proper lazy loading), SSR produces HTML that doesn't match the client-side editor, triggering hydration errors.

**How to avoid:**
1. Mark editor components with `'use client'` directive
2. Use `dynamic` import with `ssr: false`:
```typescript
const ScriptEditor = dynamic(() => import('@/components/ScriptEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
```
3. Always show a loading skeleton during client-side mount, never a blank space
4. Keep all editor state management client-side; sync to server via API calls only

**Warning signs:**
- "Hydration mismatch" errors in browser console
- Editor flickers or flashes on page load
- Works in development (`next dev`) but breaks in production build
- Editor component imported directly without dynamic/lazy loading

**Phase to address:**
Phase 3 (Script Editor) -- if using a library, `ssr: false` must be the default pattern from the start.

**Sources:**
- [BlockNote Next.js docs](https://www.blocknotejs.org/docs/advanced/nextjs)
- [Isolated Block Editor Next.js issues](https://github.com/Automattic/isolated-block-editor/issues/257)

---

### Pitfall 5: Losing In-Progress Generation on Navigation or Error

**What goes wrong:**
User triggers script generation (takes 10-20 seconds with streaming). During generation, they accidentally navigate away, close the tab, or the stream errors partway through. The partial result -- which may have been 80% complete and usable -- is lost entirely. User must start over from scratch.

**Why it happens:**
Streaming responses are ephemeral. If you only persist the result after the stream completes, any interruption means total loss. Browser navigation kills the fetch connection immediately. Network hiccups close the stream mid-sentence.

**How to avoid:**
1. Buffer chunks into React state as they arrive (for display) AND into a server-side partial record
2. Save partial results to the database periodically (every 2 seconds or every 500 characters)
3. Mark saved results with status: `generating | complete | partial | error`
4. On page reload, show the last partial result with option to continue or regenerate
5. Use `beforeunload` event to warn user if generation is in progress
6. Disable navigation links during active generation, or show confirmation dialog

Data model implication: the `scripts` table needs a `status` field from day one.

**Warning signs:**
- No "are you sure?" prompt when navigating during generation
- Database only stores `complete` scripts, never partials
- User reports having to regenerate after browser hiccups
- No `status` field in the scripts schema

**Phase to address:**
Phase 2 (AI Integration) -- partial result persistence must be part of the data model and streaming handler design from the start.

---

### Pitfall 6: Storing Scripts as Unstructured Text Blobs

**What goes wrong:**
Scripts are stored as a single text or markdown field in the database. This makes it impossible to: highlight individual beats with anti-slop issues, calculate per-beat timing, reorder beats without text parsing, show visual/voiceover side by side, or do any structured analysis on script content. Every feature that touches script content requires a fragile text parser.

**Why it happens:**
The AI generates a script as continuous text. The simplest path is to store that text as-is in one column. Parsing it into structured beats feels like premature optimization. "We can always parse it later."

**How to avoid:**
Design the database schema with structure from day one:
```sql
scripts (id, title, format, status, slop_score, model, created_at, updated_at)
beats   (id, script_id, position, visual_description, voiceover_text)
```

Prompt the AI to output JSON directly:
```json
{ "beats": [
  { "visual": "Screen: troll ragdolling off a cliff",
    "voiceover": "So I added ragdoll physics. Big mistake." }
]}
```

Parse AI output into beats immediately after generation. Store structured data. Render to readable format for display.

**Warning signs:**
- Scripts table has a single `content TEXT` column
- Using regex to extract beats from stored text
- Unable to edit a single beat without reparsing everything
- Anti-slop scoring runs on the full blob instead of per-beat

**Phase to address:**
Phase 1 (Database Schema) -- schema must model beats as separate rows from the start. Migrating from blob to structured data is painful and lossy.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing scripts as text blobs | Skip parsing, faster to build | Cannot edit beats individually, cannot score per-beat, every feature needs a parser | Never -- structured storage is barely more work upfront |
| Hardcoding anti-slop rules in frontend JS | Quick to implement | Cannot update rules without redeploy, rules diverge from CLI skill | MVP only -- extract to config/DB within first sprint |
| No streaming (wait for full response) | Simpler API route, simpler UI | Terrible UX for any generation over 3 seconds | Never -- streaming is table stakes for AI apps in 2026 |
| Single API route for all AI operations | One file to maintain | Becomes 500+ line god-route as you add ideation, scoring, rewriting, individual beat regeneration | Acceptable for first 2 endpoints, then split by concern |
| SQLite without WAL mode | Default just works | Readers block writers. Two browser tabs = potential lock conflicts | Never -- `PRAGMA journal_mode=WAL` is one line at connection time |
| Using localStorage for script data | Zero backend needed | Data loss on browser clear, no search, no cross-device | Never for scripts -- OK for UI preferences (theme, sidebar state) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Anthropic SDK | Using `messages.create()` with `stream: false`, blocking the route | Use `messages.stream()` or Vercel AI SDK's `streamText()` |
| Anthropic SDK | Sending full system prompt (brand voice + anti-slop rules ~2K tokens) on every request without caching | Use prompt caching: add `cache_control: { type: "ephemeral" }` to system message, saves 90% on repeated prompts |
| Anthropic SDK | Not setting `max_tokens` -- defaults vary by model and may cut off or over-generate | Set explicit `max_tokens` (512-1024 for a 60-second script) |
| Anthropic SDK | Trusting the AI to always output valid JSON for beat parsing | Wrap JSON parsing in try/catch. If parse fails, fall back to text storage with `status: 'parse_error'` and let user manually structure |
| SQLite (better-sqlite3) | Using async SQLite driver in Next.js dev mode -- hot reload creates connection leaks and SQLITE_BUSY errors | Use synchronous better-sqlite3 with a module-level singleton, or use Drizzle ORM for managed connections |
| SQLite | Forgetting WAL mode | Run `PRAGMA journal_mode=WAL;` on every new connection. Without it, concurrent reads block writes |
| Next.js App Router | Mixing Server and Client component concerns in the editor page | Editor is fully client-side (`'use client'` + `ssr: false`). Script list/library can be Server Component. Data flows through API routes, not props drilling from server to client |
| Next.js App Router | Using `getServerSideProps` patterns from Pages Router | App Router uses `async` Server Components, `route.ts` handlers, and `'use client'` directives. Do not mix paradigms |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending full script history as context to Claude | Slow responses, high token costs, hitting context limits | Only send brand voice + anti-slop rules + current request. Past scripts are irrelevant to new generation | After 20-30 scripts in conversation history |
| Re-running anti-slop check on every keystroke | UI freezes/jank during typing | Debounce scoring (500ms+ delay), or only score on explicit action (Save/Check button) | Immediately noticeable with 60+ anti-slop rules |
| Loading all scripts on library page without pagination | Slow initial page load, memory bloat | Paginate (20 per page), implement search server-side with SQL LIKE, virtual scroll only if needed | After 50+ scripts |
| Not caching the system prompt via Anthropic's prompt caching | Each request sends ~2K tokens of system prompt at full input price | Set `cache_control` on system message. First request pays full price; subsequent requests pay 10% | Adds up after 100+ generations ($0.20 vs $2.00) |
| Full re-render of beat list on every state change | Editor feels sluggish with 8+ beats | Memoize individual beat card components with `React.memo`, use stable keys, avoid re-creating handler functions | Noticeable at 8+ beats with complex per-beat UI |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing Anthropic API key in `.env.local` that gets committed to git | Key exposed publicly, unauthorized API usage, billing surprise | Add `.env*` to `.gitignore` before first commit. Use `ANTHROPIC_API_KEY` env var only in server-side code (`route.ts`), never import in client components |
| No rate limiting on generation API route | A bug, browser retry loop, or curious user could trigger hundreds of API calls | Add simple in-memory rate limiter: max 5 generations per minute. Even a basic counter prevents runaway costs |
| Exposing raw Anthropic error messages to frontend | Error messages may reveal API key prefix, internal model details, or system prompt structure | Catch all errors server-side, return generic `{ error: "Generation failed. Please try again." }` to client |
| API key accessible via client-side code | Anyone inspecting network requests sees the key | Anthropic SDK must only be instantiated in server-side route handlers. Never `import Anthropic from '@anthropic-ai/sdk'` in a `'use client'` file |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty state with just a text input | User (Pavlo) doesn't know what to type or how to start | Show format selector (The Bug, The Satisfaction, Before/After, etc.) + context input (what did you work on?) + example prompts |
| No visual feedback during generation | User thinks app is broken after 3 seconds of nothing | Stream text as it arrives with a typing cursor animation. Show elapsed time. |
| Anti-slop score shown as just a number (e.g., "38/50") | Number is meaningless without context -- what's bad? where? | Highlight flagged phrases inline in the editor with red underline. Click to see the rule and a suggested fix. |
| Regenerate button replaces current script without saving | User loses a version they partially liked | Keep generation history. Each generation is a version. Show version switcher (v1, v2, v3...). Never delete automatically. |
| No way to edit individual beats | User must accept or reject the whole script | Each beat is independently editable. Option to regenerate a single beat while keeping the rest. |
| Script generation blocks the entire UI | User can't do anything while waiting for AI | Generate in background. Show progress indicator. Allow user to browse library or edit other scripts while generation runs. |
| Full-screen modal for generation results | Can't reference previous scripts while reviewing new one | Split or side-panel layout: library/list on left, editor/preview on right. |

## "Looks Done But Isn't" Checklist

- [ ] **Streaming:** Verify chunks appear word-by-word in the UI, not all at once after a delay -- test with browser DevTools Network tab set to "Slow 3G"
- [ ] **Anti-slop scoring:** Verify it catches phrases from the ACTUAL 90+ rules list (not a hardcoded subset) -- test with a script containing 5 known-bad phrases
- [ ] **Script persistence:** Verify scripts survive: page reload, browser restart, and `next dev` restart -- test by killing the dev server mid-session
- [ ] **Partial generation:** Verify that closing the browser tab mid-generation saves a partial script -- test by navigating away at 50% progress
- [ ] **Beat editing:** Verify editing one beat doesn't reset others, and changes persist after navigation -- test editing the middle beat then going to library and back
- [ ] **Error handling:** Verify behavior when Anthropic API returns 429 (rate limit), 500 (server error), or network disconnects mid-stream -- test by temporarily using an invalid API key
- [ ] **Format selection:** Verify all 7 script formats actually produce meaningfully different outputs -- generate same topic in 3 different formats and compare
- [ ] **SQLite concurrent access:** Verify opening the app in two browser tabs doesn't cause SQLITE_BUSY errors -- test by loading library in one tab while generating in another
- [ ] **JSON parsing:** Verify the app handles malformed AI JSON output gracefully -- test by prompting the AI to output a script, then manually corrupting the response handler to simulate bad JSON

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Used Max subscription via proxy (ToS violation) | LOW | Switch to API key. No data migration needed. Just change auth config in route handler. Cost: ~$0.08/month. |
| Stored scripts as text blobs | MEDIUM | Write migration: parse existing blobs into beats using AI (prompt Claude to split them). Some may lose structure. ~1 day effort. |
| Built with complex block editor library | HIGH | Extract data model first (export all scripts as JSON). Rebuild editor UI as custom component. Keep data layer. ~3-5 day effort. |
| No streaming implemented | MEDIUM | Rewrite API route to return ReadableStream. Rewrite frontend fetch to use reader. If using Vercel AI SDK, much easier (~few hours). |
| Editor hydration errors | LOW | Add `dynamic(() => import(...), { ssr: false })`. Add loading skeleton. ~1 hour fix. |
| No partial result saving | MEDIUM | Add `status` column to scripts table. Modify stream handler to save periodically. Add beforeunload handler. ~1 day effort. |
| API key exposed in git history | HIGH | Immediately rotate the API key in Anthropic console. Scrub git history with `git filter-branch` or BFG Repo-Cleaner. Verify no unauthorized usage in billing dashboard. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Claude Max as API (ToS) | Phase 1: Setup | API key in `.env.local`, test API call succeeds with key auth, `.env*` in `.gitignore` |
| Script storage as blobs | Phase 1: Database Schema | Schema has `beats` table with `script_id` FK, AI outputs JSON, parser tested |
| SQLite WAL mode | Phase 1: Database Schema | `PRAGMA journal_mode` returns `wal` on app startup |
| Streaming buffering | Phase 2: AI Integration | Tokens appear word-by-word in browser with DevTools Network showing chunked transfer |
| Partial result loss | Phase 2: AI Integration | Kill browser mid-gen, reload, see partial script with `status: 'partial'` |
| Rate limiting | Phase 2: AI Integration | Clicking generate 10 times fast only triggers 1-2 actual API calls |
| Prompt caching | Phase 2: AI Integration | Anthropic dashboard shows cache hits on system prompt after first request |
| Over-engineered editor | Phase 3: Script Editor | Editor is custom component (<500 LOC), not a library. Decision documented. |
| Editor hydration (if library) | Phase 3: Script Editor | No console errors on production build page load |
| Empty state UX | Phase 3: Script Editor | New session shows format picker + context input, not a blank page |
| Anti-slop as number only | Phase 4: Anti-slop UI | Flagged phrases highlighted inline with red underline and tooltip explanation |
| No generation history | Phase 4: Polish | Each generation creates a version; user can browse and compare versions |

## Sources

- [Anthropic bans third-party subscription OAuth (The Register, Feb 2026)](https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access/) -- HIGH confidence
- [Anthropic bans subscription OAuth (WinBuzzer, Feb 2026)](https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/) -- HIGH confidence
- [Claude API Pricing (official)](https://platform.claude.com/docs/en/about-claude/pricing) -- HIGH confidence
- [CLIProxyAPI blog (demonstrates what NOT to do)](https://rogs.me/2026/02/use-your-claude-max-subscription-as-an-api-with-cliproxyapi/) -- HIGH confidence
- [Next.js SSE discussion #48427](https://github.com/vercel/next.js/discussions/48427) -- HIGH confidence
- [Fixing Slow SSE in Next.js](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) -- MEDIUM confidence
- [Streaming LLM in Next.js (Eaures)](https://www.eaures.online/streaming-llm-responses-in-next-js) -- MEDIUM confidence
- [BlockNote Next.js docs](https://www.blocknotejs.org/docs/advanced/nextjs) -- HIGH confidence
- [Claude streaming stall issues #18028](https://github.com/anthropics/claude-code/issues/18028) -- MEDIUM confidence
- [10 Common AI Product UX Mistakes (UZER)](https://uzer.co/en/mistakes-designing-ai-products-ux-tips/) -- MEDIUM confidence
- [Vercel AI SDK streaming (LogRocket)](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) -- MEDIUM confidence
- [Agent SDK Max plan billing issue #559](https://github.com/anthropics/claude-agent-sdk-python/issues/559) -- HIGH confidence

---
*Pitfalls research for: AI-powered scriptwriting web UI (Next.js + Claude API + local DB)*
*Researched: 2026-03-26*
