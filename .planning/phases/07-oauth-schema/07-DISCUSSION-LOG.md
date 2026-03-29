# Phase 7: OAuth & Schema - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 07-oauth-schema
**Areas discussed:** Settings page design, Connection status placement, Token expiry handling, DB schema details

---

## Settings Page Design

### Navigation Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Add to header nav | Generate \| Scripts \| Settings — consistent with existing pattern | |
| Gear icon in header | Small gear icon next to nav links — cleaner, less clutter | ✓ |
| You decide | Claude picks the best approach | |

**User's choice:** Gear icon in header
**Notes:** Settings is rarely visited — gear icon keeps nav clean.

### Settings Scope

| Option | Description | Selected |
|--------|-------------|----------|
| YouTube only | Single section, clean and focused | |
| Sectioned layout | YouTube section now, structure ready for future sections | ✓ |

**User's choice:** Sectioned layout
**Notes:** None

### Channel Info Display

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — name + status | Channel name, badge, Disconnect button | |
| Card with details | Name, avatar, sub count, video count, last sync | ✓ |
| You decide | Claude picks based on API availability | |

**User's choice:** Card with details
**Notes:** None

---

## Connection Status Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Small dot on gear icon | Green/red dot — subtle, always visible | |
| Text badge in header | 'YT Connected' / 'YT Disconnected' text | |
| Only on settings page | Don't show elsewhere | |
| YouTube logo icon | Colored = connected, gray = disconnected | ✓ |

**User's choice:** YouTube logo icon in header — colored when connected, gray when disconnected
**Notes:** User specified: "youtube logo icon in header - if colored - connected, if greyedout - not"

---

## Token Expiry Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking banner | Yellow banner at top with reconnect link | |
| Icon goes red + tooltip | YouTube icon turns red, hover shows reconnect prompt | ✓ |
| You decide | Claude picks least disruptive approach | |

**User's choice:** Icon goes red with warning indicator
**Notes:** User clarified icon color states: disconnected = gray, connected = YouTube red (#FF0000), expired = red with warning.

---

## DB Schema Details

### Script-Video Linking

| Option | Description | Selected |
|--------|-------------|----------|
| FK on scripts table | Add videoId to scripts | |
| FK on videos table | Add scriptId to videos | |
| You decide | Claude picks based on schema patterns | ✓ |

**User's choice:** You decide
**Notes:** None

### Metrics Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Time-series snapshots | New row per sync per video | |
| Latest only | One row, overwritten each sync | |
| You decide | Claude picks based on Phase 8 needs | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Claude's Discretion

- FK direction (scriptId on videos table)
- Metrics storage approach (time-series snapshots)
- Token storage format (JSON file)
- OAuth callback route structure

## Deferred Ideas

None
