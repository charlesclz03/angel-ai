---
name: sync-docs
description: Sync Angel AI operational markdown after substantial implementation work. Use when behavior changes, tests or verification status change, roadmap status changes, new commands/env/contracts land, or a session is ending after a meaningful slice.
---

# Sync Angel AI Docs

Use this skill after implementation and verification to keep the active Angel AI markdown set aligned with the code.

## Core Rule

Do not end a substantial coding slice until the relevant docs are updated.

## Always Review These Docs

Check these every time:

1. `docs/angel-ai-next-session-handoff-2026-03-24.md`
2. `docs/angel-ai-progress-log.md`
3. `docs/angel-ai-next-steps.md`
4. `docs/reference/PATCH_NOTES_MASTER.md`

## Update These Conditionally

Only touch the docs that are actually affected:

- `AGENTS.md`
  Use when workflow expectations, bootstrap order, or required repo habits change.
- `docs/README.md`
  Use when the canonical read order, current build target, or doc navigation changes.
- `docs/runbooks/*.md`
  Use when setup, verification, debugging, deploy, media, billing, or provider procedures change.
- `docs/reference/commands.md`
  Use when commands, scripts, or required verification steps change.
- `docs/reference/env-vars.md`
  Use when env vars are added, removed, renamed, or become required/optional.
- `docs/architecture/*.md`
  Use when ownership, runtime flow, system boundaries, or model/data flow changes.
- `README.md`
  Use when product positioning, setup, or top-level feature status changes.
- product spec docs
  Use when roadmap or phase scope materially changes.

## Workflow

1. Identify the real behavior change.
2. Confirm what was actually verified.
3. Update the handoff with the new current truth and next action.
4. Append the shipped slice to the progress log.
5. Mark completed or newly introduced backlog items in next steps.
6. Add a concise patch-notes entry.
7. Update any conditional docs touched by commands, env, architecture, or runbook flow changes.
8. Keep active docs authoritative and archive docs historical.

## Guardrails

- Do not claim verification you did not run.
- Do not let archive or recording docs override the active handoff.
- Do not update unrelated docs just for completeness theater.
- Keep dates, version labels, and next steps concrete.
- If the code changed but no operational doc changed, explain why before ending.

## Required Output

Before ending the session, be able to state:

1. which markdown files were updated
2. why each one changed
3. what verification actually ran
4. what the next coding session should do next
