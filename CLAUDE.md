# CLAUDE.md — Devlog Scriptwriter Project

> Этот файл содержит контекст предыдущей беседы в claude.ai и план действий.
> Павло — fullstack developer, создаёт игру и ведёт devlog на YouTube Shorts.
> Общайся с Павло на русском. Скрипты для видео пиши на английском.

---

## Контекст проекта

Павло ведёт YouTube канал с game devlog Shorts. Текущие метрики: 6 видео,
2-8K просмотров, 55 подписчиков. Формат: screen recording + voiceover на
английском. Цель — построить полный AI-assisted pipeline для написания
сценариев, чтобы видео звучали натурально, интересно и свежо.

## Что уже сделано (в предыдущем чате)

### 1. Исследование экосистемы
Провели масштабный ресёрч: Claude Code скиллы, MCP серверы, Reddit,
community best practices. Ключевые находки:

**Скиллы для scriptwriting:**
- `viral-reel-generator` (mcpmarket.com) — short-form + anti-AI-slop rules
- `script-writer` (ailabs-393) — persistent style database
- `stop-slop` (github.com/drm-collab/stop-slop) — scoring 5 dimensions, 35/50 threshold
- `humanizer` (github.com/abnahid/claude-humanizer) — Wikipedia "Signs of AI writing"
- `last30days` (github.com/mvanhorn/last30days-skill) — research Reddit/X/YouTube trends

**Инструменты для video pipeline:**
- `claude-code-video-toolkit` (github.com/digitalsamba/claude-code-video-toolkit) — Remotion + ElevenLabs + FFmpeg
- FFmpeg для субтитров, нарезки, overlay текста
- YouTube Data API через MCP для автоматического сбора метрик

### 2. Анализ успешных devlog каналов
Изучили формулы: Pirate Software (bite-sized мнения), Jonas Tyroller (проблема→решение),
DevDuck (chill tone + честность), PaperKlay (документировал годами → ready-made аудитория).

**Работающие форматы для devlog Shorts:**
- The Bug — "Этот баг сломал мою игру на 3 дня"
- The Satisfaction — satisfying механика/звук/визуал
- Before/After — трансформация
- The Decision — "Я чуть не удалил эту фичу"
- The Trick — "Одна строка кода всё изменила"
- The Fail — "Неделя работы в мусорку"
- The Number — "47 итераций чтобы сделать это правильно"

**Формула хука (первые 3 сек):** Pre-hook → Question → Deliver

**Ключевой совет из 2026 indie marketing guide:**
НЕ постить трейлеры. Постить: баги/фейлы (аутентичность), satisfying моменты
(визуальный допамин), before/after (трансформация). 7-14 клипов в неделю.

### 3. Создан кастомный SKILL.md
Собрали лучшее из всех найденных скиллов в один кастомный. Файлы готовы
и лежат в этом репозитории (или нужно установить — см. план действий).

**Структура скилла:**
```
devlog-scriptwriter/
├── SKILL.md                    # 4 фазы: setup → ideation → script → feedback loop
├── README.md                   # Инструкция
└── references/
    ├── anti-slop-rules.md      # 60+ забаненных фраз, структурные правила
    ├── brand-voice.md          # Шаблон голосового профиля (заполнить!)
    └── metrics-log.md          # Журнал метрик видео для feedback loop
```

### 4. Спроектирован workflow
```
Weekly Research → Ideation (5-7 angles) → Pick topic → Generate script
→ Anti-slop pass (score 35+/50) → Human polish (read aloud) → Record
→ Publish → 48h → Collect metrics → Pattern analysis → Feed back into generation
```

---

## План действий (TODO для Claude Code)

### Этап 1 — Установка скилла
- [ ] Установить `devlog-scriptwriter` skill в `.claude/skills/` или `~/.claude/skills/`
- [ ] Если файлы скилла ещё не в проекте — Павло их скачал из claude.ai, нужно скопировать
- [ ] Провести Phase 0 — Brand Voice Setup (интервью с Павло, заполнить brand-voice.md)
- [ ] Попросить Павло вставить транскрипт лучшего видео как style anchor

### Этап 2 — Установка companion skills
- [ ] Установить `stop-slop` — `git clone https://github.com/drm-collab/stop-slop.git`
- [ ] Установить `humanizer` — `git clone https://github.com/abnahid/claude-humanizer.git`
- [ ] Опционально: `last30days` для trend research — `git clone https://github.com/mvanhorn/last30days-skill.git`
- [ ] Проверить что все скиллы корректно подгружаются

### Этап 3 — YouTube MCP интеграция
- [ ] Исследовать YouTube Data API v3 MCP серверы (поискать на github)
- [ ] Настроить MCP для автоматического подтягивания метрик канала Павло
- [ ] Альтернатива: YouTube Studio API через OAuth2 для retention curves
- [ ] Связать метрики с `references/metrics-log.md` — автозаполнение после публикации

### Этап 4 — Эксперименты с AI монтажём
- [ ] Установить FFmpeg если нет
- [ ] Попробовать автоматическую генерацию субтитров (Whisper → SRT → burn-in через FFmpeg)
- [ ] Эксперимент с overlay текста хука на первые 3 секунды видео
- [ ] Исследовать Remotion для программного рендера Shorts (из toolkit digitalsamba)
- [ ] Попробовать auto-cut: определять тишину/паузы и вырезать автоматически

### Этап 5 — Первый полный цикл
- [ ] Сгенерировать 3-5 скриптов используя установленный скилл
- [ ] Павло записывает 1 видео по скрипту
- [ ] Собрать метрики через 48ч
- [ ] Заполнить metrics-log.md
- [ ] Проанализировать и скорректировать скилл

---

## Технические заметки

- Павло работает на Windows PC (WezTerm) и MacBook Air M1 (Ghostty)
- Claude Code запускается в терминале (не в Cursor extension)
- У Павло есть подписки: Cursor, Claude (Max/Pro), Antigravity
- Основной стек: Node.js, React, TypeScript — но для этого проекта стек не важен
- Павло учит английский с IT-репетитором — скрипты на английском, но могут быть
  шероховатости в произношении, скрипт должен быть easy to pronounce

## Важные принципы из ресёрча

1. **Anti-slop — главный приоритет.** AI-скрипт, который звучит как AI, хуже
   чем никакой скрипт. Лучше 80% натуральный с парой awkward моментов, чем
   100% гладкий но очевидно сгенерированный.

2. **Feedback loop — суперсила.** Большинство людей генерируют скрипты и забывают.
   Кормить метрики обратно — это то что превращает generic tool в personalized engine.

3. **Specificity = credibility.** Не "я работал над физикой" а "я переписал
   collision detection три раза на этой неделе". Конкретные числа, конкретные
   детали, конкретный опыт.

4. **One Short = one idea.** Если в скрипте есть "и ещё одна вещь" — это второе видео.

5. **Visuals drive, voice follows.** Voiceover комментирует то что зритель ВИДИТ.
   Никогда не описывает невидимое.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Devlog Scriptwriter Pipeline**

An AI-assisted pipeline for writing YouTube Shorts devlog scripts for Pavlo's indie game (UE5 Action RPG about a Troll). The pipeline generates natural-sounding English scripts, tracks video performance metrics, and feeds analytics back into script generation to continuously improve quality. Pavlo records screen + voiceover; this tool handles the writing side.

**Core Value:** Scripts must sound like Pavlo — natural, specific, with real dev details — never like AI-generated content. A slightly awkward but authentic script beats a polished but obviously generated one.

### Constraints

- **Anti-slop**: Every script must pass anti-slop scoring (35+/50). AI-sounding output is worse than no output.
- **Pronunciation**: Scripts must avoid complex English constructions that are hard for non-native speakers.
- **One idea per video**: If a script contains "and another thing" — that's a second video.
- **Visuals-first**: Voiceover never describes what isn't on screen. Script assumes screen recording exists.
- **Authenticity**: Use real numbers, real struggles, real details from Pavlo's actual dev work. No generic gamedev platitudes.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Important Context
## Recommended Stack
### Core: Custom Devlog Scriptwriter Skill
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom `devlog-scriptwriter` skill | N/A | Central orchestration skill for script generation | No single existing skill covers devlog + anti-slop + feedback loop + brand voice. Combine best patterns from `viral-reel-generator`, `script-writer`, and `stop-slop` into one custom skill. Custom skill matches Pavlo's exact workflow: ideation, format selection (The Bug, The Satisfaction, etc.), hook formula, anti-slop pass, pronunciation check. | HIGH |
### Anti-Slop Layer
| Tool | Source | Purpose | Why | Confidence |
|------|--------|---------|-----|------------|
| `stop-slop` (drm-collab) | [github.com/drm-collab/stop-slop](https://github.com/drm-collab/stop-slop) | 5-dimension scoring (directness, rhythm, trust, authenticity, density), 35/50 threshold, auto-rewrite | The scoring system is exactly what this project needs: quantifiable quality gate that blocks AI-sounding scripts. Learning capability via `feedback.log` means it improves over time. Based on hardikpandya/stop-slop (MIT). | HIGH |
| `claude-humanizer` (abnahid) | [github.com/abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer) | Wikipedia-based AI writing pattern detection, 24 pattern categories | Uses Wikipedia's "Signs of AI writing" guide from WikiProject AI Cleanup -- sourced from thousands of real AI text instances. Catches patterns stop-slop might miss. 1,600+ GitHub stars, actively maintained. | HIGH |
| Anti-slop rules in custom skill | Embedded in `references/anti-slop-rules.md` | 60+ banned phrases baked into the scriptwriter skill itself | First line of defense. Stop-slop and humanizer are second-pass validators. Having rules in the custom skill prevents slop from being generated in the first place, rather than just detecting it after. | HIGH |
### Trend Research (Optional)
| Tool | Source | Purpose | Why | Confidence |
|------|--------|---------|-----|------------|
| `last30days` (mvanhorn) | [github.com/mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) | Research topics across Reddit, X, YouTube, HN for recent 30 days | Discovers trending topics in indie gamedev community. When yt-dlp is installed, automatically searches YouTube and extracts transcripts from top videos -- useful for understanding what devlog formats are currently performing well. Requires SCRAPECREATORS_API_KEY. | MEDIUM |
### Metrics and Feedback Loop
| Approach | Format | Purpose | Why | Confidence |
|----------|--------|---------|-----|------------|
| Manual entry in `metrics-log.md` | Markdown table | Track per-video analytics: views, retention %, subs gained, hook type, format used | At 1 video/week, manual entry takes 2 minutes and avoids YouTube API setup complexity. The PROJECT.md explicitly scopes out YouTube MCP integration. The feedback loop (analyzing which formats/hooks perform best) is the superpower, not the data collection method. | HIGH |
| # | Title | Format | Hook Type | Views (48h) | Retention % | Subs | Notes |
|---|-------|--------|-----------|-------------|-------------|------|-------|
- 1 video/week does not justify OAuth2 setup, API key management, and MCP server maintenance
- YouTube Studio already shows all needed metrics in a browser tab
- The value is in the analysis pattern, not automation of data entry
- PROJECT.md explicitly lists this as Out of Scope
- Can revisit if publishing cadence increases to 3+ videos/week
### Content Scoring System
| Component | Method | Threshold | Confidence |
|-----------|--------|-----------|------------|
| stop-slop 5-dimension score | Directness, Rhythm, Trust, Authenticity, Density (1-10 each) | 35/50 minimum | HIGH |
| slop-radar (optional CLI) | 245 English buzzwords + 14 structural patterns + fuzzy matching | Scores 0-100, flag below 80 | MEDIUM |
### Supplementary Tools
| Tool | Source | Purpose | When to Use | Confidence |
|------|--------|---------|-------------|------------|
| `slop-radar` | [github.com/renefichtmueller/slop-radar](https://github.com/renefichtmueller/slop-radar) | CLI-based slop detection with 245 buzzwords + 14 structural patterns | Quick spot-checks via `npx slop-radar score`. Useful as independent second opinion alongside stop-slop. | MEDIUM |
| `anti-slop-writing` (adenaufal) | [github.com/adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing) | Universal system prompt for eliminating AI style tells | Consider embedding key rules from this into CLAUDE.md or the custom skill's anti-slop-rules.md. Works across Claude Code, Cursor, and other tools. | MEDIUM |
| `viral-reel-generator` | [mcpmarket.com](https://mcpmarket.com/tools/skills/viral-reel-generator) | Short-form video script generation with anti-slop rules and visual-audio sync | Reference for hook patterns and visual sync techniques when building custom skill. Do NOT install as primary tool -- too generic for devlog-specific needs. | LOW |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Anti-slop scoring | `stop-slop` (drm-collab) | `stop-slop` (hardikpandya) | drm-collab version adds learning via feedback.log; hardikpandya is the original but lacks feedback loop |
| Anti-slop scoring | `stop-slop` | `anti-slop-skill` (DataWhisker) | DataWhisker focuses on code quality, not prose/script writing |
| Humanizer | `claude-humanizer` (abnahid) | `humanizer` (blader) | abnahid has broader Wikipedia-sourced pattern database and more community traction |
| Humanizer | `claude-humanizer` (abnahid) | `avoid-ai-writing` (conorbronsdon) | conorbronsdon is good but abnahid's Wikipedia basis is more comprehensive |
| Trend research | `last30days` (mvanhorn) | Manual Reddit/YouTube browsing | last30days automates what would take 30+ minutes of manual browsing; worth the API key setup |
| Script generation | Custom skill | `viral-reel-generator` (mcpmarket) | mcpmarket skill is generic short-form; custom skill is devlog-specific with brand voice, game context, and feedback loop |
| Script generation | Custom skill | `youtube-content-creator` (mcpmarket) | Too generic, no anti-slop integration, no feedback loop |
| Metrics collection | Manual markdown | YouTube Data API v3 MCP | Overkill for 1 video/week; adds OAuth2 complexity without proportional value |
| Metrics collection | Manual markdown | VidIQ / TubeAnalytics | SaaS tools add cost and are designed for channels with much higher volume |
## What NOT to Use
| Tool/Approach | Why Avoid |
|---------------|-----------|
| **ElevenLabs TTS** | Pavlo records his own voiceover. TTS defeats the authenticity goal. |
| **Remotion programmatic rendering** | Experimental, adds massive technical complexity. Defer until script pipeline is proven and running. |
| **FFmpeg subtitle burn-in / auto-cut** | Out of scope per PROJECT.md. Separate initiative from scriptwriting. |
| **ChatGPT / GPT-4o for scripts** | Claude Code skills provide tighter integration, learning feedback loops, and embedded anti-slop. Switching tools fragments the workflow. |
| **Jasper / Copy.ai / KoalaWriter** | SaaS script generators are generic, have no feedback loop, no brand voice persistence, and no anti-slop scoring. They solve a different problem (content farms, not authentic devlogs). |
| **YouTube API MCP servers** | Over-engineered for current cadence. Manual metrics entry is 2 minutes/week. Revisit at 3+ videos/week. |
| **Multiple SaaS analytics tools** | YouTube Studio's built-in analytics provides everything needed. No need for Sprout Social, Planable, etc. at 55 subscribers. |
| **n8n / Zapier automation workflows** | Adding automation orchestration is premature. The workflow is: Claude Code generates script -> Pavlo records -> Pavlo enters metrics. No integration points that need automation. |
## Installation
### Phase 1: Core skill setup
# Create skill directory structure
# Install anti-slop companion skills
### Phase 2: Optional enhancements
# Trend research (requires SCRAPECREATORS_API_KEY)
# CLI slop detector (run ad-hoc, no installation needed)
### Phase 3: Verify skills load
# In Claude Code, check available skills
# Type / and look for: devlog-scriptwriter, stop-slop, humanizer
# Ask: "What skills are available?"
## Skill Architecture Reference
### SKILL.md Structure
# Process steps here (under 500 lines)
# Each step explicitly names which reference file to load
# Example: "Read references/brand-voice.md for tone and vocabulary"
### Key Architecture Rules
### Frontmatter Fields That Matter
| Field | Value | Rationale |
|-------|-------|-----------|
| `name` | `devlog-scriptwriter` | Lowercase, hyphens, descriptive |
| `description` | See above | Includes triggers: "writing scripts", "brainstorming", "video ideas" |
| `disable-model-invocation` | `false` | Claude should auto-activate when script/video topics come up |
| `allowed-tools` | (omit) | No special tool restrictions needed |
## Sources
### Official Documentation (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- skill architecture, directory structure, frontmatter reference
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- progressive disclosure, conciseness, testing guidelines
### GitHub Repositories (HIGH confidence)
- [drm-collab/stop-slop](https://github.com/drm-collab/stop-slop) -- 5-dimension scoring with feedback learning
- [abnahid/claude-humanizer](https://github.com/abnahid/claude-humanizer) -- Wikipedia-based AI pattern detection (1,600+ stars)
- [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) -- Multi-platform trend research
- [renefichtmueller/slop-radar](https://github.com/renefichtmueller/slop-radar) -- CLI slop detector with 245 buzzwords
- [adenaufal/anti-slop-writing](https://github.com/adenaufal/anti-slop-writing) -- Universal anti-slop system prompt
### Community Resources (MEDIUM confidence)
- [MCPMarket: Viral Reel Generator](https://mcpmarket.com/tools/skills/viral-reel-generator) -- reference for hook patterns
- [MindStudio: Skills Architecture](https://www.mindstudio.ai/blog/claude-code-skills-architecture-skill-md-reference-files) -- process vs. context separation
- [Hardik Pandya: Stop Slop](https://hardik.substack.com/p/new-claude-skill-stop-ai-slop-in) -- original stop-slop concept and rationale
### YouTube Analytics (HIGH confidence, not used in stack)
- [YouTube Analytics API](https://developers.google.com/youtube/analytics) -- verified available but scoped out for current project
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
