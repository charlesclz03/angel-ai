# Documentation Operating System Playbook

Purpose:

- capture the documentation system used in Angel AI so it can be reused across other projects

Audience:

- founders
- maintainers
- coding agents

Status:

- template

Source of truth scope:

- reusable documentation architecture and operating model

Last updated:

- 2026-03-24

Related docs:

- `docs/README.md`
- `docs/architecture/system-map.md`
- `docs/runbooks/local-development.md`
- `docs/archive/README.md`

## Why This Exists

Most repos do not fail because they have no docs.
They fail because the docs are:

- scattered
- stale
- overlapping
- hard to navigate under pressure
- written for reading, not for execution

This playbook is meant to fix that.

The goal is not "more documentation."
The goal is an execution-grade documentation system that helps a human or an agent answer, fast:

- what is this project
- what is already built
- what is next
- where do I start in the code
- which file owns this behavior
- which command verifies it
- which docs are current and which are only historical context

## Core Principles

### 1. One canonical entry point

Every repo should have one internal docs hub:

- `docs/README.md`

This is the place future sessions start from.

### 2. One doc per job

Avoid multiple active docs all trying to answer the same question.

Recommended ownership:

- `README.md`
  - external-facing overview
- `docs/README.md`
  - internal docs navigation
- `progress-log.md`
  - what has shipped
- `next-steps.md`
  - immediate backlog
- `next-phases.md`
  - medium-term sequencing
- `next-session-handoff.md`
  - current execution brief

### 3. Active docs and archive docs must be separated

Concept docs, transcript docs, and superseded proposals should not sit beside the docs that tell the next session what to do now.

Use:

- `docs/archive/recordings/`
- `docs/archive/research/`
- `docs/archive/superseded/`

### 4. Documentation should mirror the system

The doc structure should reflect the real shape of the product:

- routes
- services
- integrations
- verification paths
- runbooks
- decisions

### 5. Status metadata should be explicit

Every active doc should begin with:

- `Purpose`
- `Audience`
- `Status`
- `Source of truth scope`
- `Last updated`
- `Related docs`

This prevents ambiguity immediately.

### 6. Write for execution, not admiration

A useful doc answers:

- what file do I open
- what command do I run
- what can go wrong
- how do I verify success

## Recommended Folder Structure

```text
docs/
  README.md
  progress-log.md
  next-steps.md
  next-phases.md
  next-session-handoff.md
  architecture/
    system-map.md
    runtime-flows.md
    data-model.md
    testing-map.md
  runbooks/
    local-development.md
    verification.md
    auth.md
    billing.md
    media.md
    deploy.md
  decisions/
    0001-<decision>.md
    0002-<decision>.md
  reference/
    env-vars.md
    commands.md
    glossary.md
    patch-notes.md
  archive/
    README.md
    recordings/
    research/
    superseded/
  templates/
```

## What Each Section Is For

### `docs/README.md`

Should answer:

1. what the project is now
2. what is already verified
3. what the next session should do first
4. which files to read before touching code
5. which runbook to use for each subsystem
6. what is archival and should not drive implementation

### `docs/architecture/`

This is the technical map layer.

Recommended docs:

- `system-map.md`
  - route -> action -> service -> model -> external integration
- `runtime-flows.md`
  - key execution flows
- `data-model.md`
  - conceptual guide to the schema
- `testing-map.md`
  - coverage and verification map

### `docs/runbooks/`

This is the operational layer.

Recommended docs:

- `local-development.md`
- `verification.md`
- subsystem runbooks for:
  - auth
  - billing
  - media
  - deployment
  - external runtime / AI handoff

Runbooks should be procedural and practical.

### `docs/decisions/`

This is where architecture decisions live.

Use short ADRs for:

- context
- decision
- consequences

Do not bury key trade-offs in long roadmap docs.

### `docs/reference/`

This is the lookup layer.

Good candidates:

- env vars
- commands
- glossary
- patch notes

### `docs/archive/`

This is the historical layer.

Put here:

- transcripts
- exploratory reports
- old proposals
- material useful for context but not for current implementation

## Minimal Enterprise-Grade Starter Set

If you want the highest leverage with the fewest files, start with these:

1. `docs/README.md`
2. `docs/next-session-handoff.md`
3. `docs/progress-log.md`
4. `docs/next-steps.md`
5. `docs/architecture/system-map.md`
6. `docs/runbooks/local-development.md`
7. `docs/runbooks/verification.md`
8. `docs/reference/env-vars.md`
9. `docs/reference/commands.md`
10. `docs/archive/README.md`

That is enough to make most repos dramatically easier to operate.

## Ownership Rules

Use these rules consistently:

- `README.md` is for repo overview, not the full operator manual
- `next-session-handoff.md` is the execution source of truth
- `progress-log.md` is shipped-history only
- `next-steps.md` is the immediate backlog only
- `next-phases.md` is medium-term planning only
- `architecture/` explains structure
- `runbooks/` explain operations
- `reference/` is lookup-only
- `archive/` is non-operational context

## How To Install This In Another Repo

### Option A. Greenfield repo

1. create the folder structure
2. add `docs/README.md`
3. add `docs/architecture/system-map.md`
4. add `docs/runbooks/local-development.md`
5. add `docs/runbooks/verification.md`
6. add `docs/reference/env-vars.md`
7. add `docs/reference/commands.md`
8. add `docs/archive/README.md`
9. point `README.md` and `AGENTS.md` to the docs hub

### Option B. Existing messy repo

1. inventory all current docs
2. classify each doc as:
   - active
   - reference
   - archive
   - superseded
3. create the new structure
4. move docs into the right layer
5. write `docs/README.md`
6. write the next-session handoff
7. reduce overlap across backlog/progress/phase docs
8. add runbooks for the most expensive integrations first

## Migration Checklist For Existing Projects

- [ ] create `docs/README.md`
- [ ] create `docs/architecture/`
- [ ] create `docs/runbooks/`
- [ ] create `docs/reference/`
- [ ] create `docs/archive/`
- [ ] move transcript and proposal docs into archive
- [ ] define one current handoff doc
- [ ] define one progress doc
- [ ] define one next-steps doc
- [ ] add metadata headers to active docs
- [ ] link `README.md` to docs hub
- [ ] link `AGENTS.md` to docs hub

## Recommended Active Doc Templates

### 1. Docs hub template

```md
# <Project> Documentation Hub

Purpose:

- provide one canonical entry point for humans and future coding sessions

Audience:

- maintainers
- coding agents

Status:

- active

Source of truth scope:

- documentation navigation and read order

Last updated:

- YYYY-MM-DD

Related docs:

- `README.md`
- `AGENTS.md`

## Start Here

1. `AGENTS.md`
2. `docs/next-session-handoff.md`
3. `docs/architecture/system-map.md`
4. `docs/runbooks/local-development.md`
```

### 2. Runbook template

```md
# <Subsystem> Runbook

Purpose:

- explain how to operate and verify <subsystem>

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- operational workflow for <subsystem>

Last updated:

- YYYY-MM-DD

Related docs:

- `docs/architecture/system-map.md`

## Primary Files

- `...`

## Required Env Vars

- `...`

## Verification

- `...`

## Common Failure Modes

- `...`
```

### 3. ADR template

```md
# ADR 000X: <Decision Name>

Status:

- accepted

Date:

- YYYY-MM-DD

## Context

...

## Decision

...

## Consequences

...
```

## What Makes This Enterprise-Grade

This system becomes enterprise-grade when it is:

- role-based
- explicit about source-of-truth ownership
- fast to navigate under pressure
- safe for onboarding new contributors
- safe for future AI execution
- structured around systems and runbooks, not only storytelling

Enterprise-grade does not mean huge.
It means:

- clear
- stable
- discoverable
- non-overlapping
- maintained

## Maintenance Rules

Whenever a substantial implementation slice lands:

1. update the handoff doc
2. update the progress log
3. update the next steps if priorities changed
4. update patch notes
5. update any affected runbook if behavior or env/setup changed

Whenever a doc stops being operationally current:

1. move it into `docs/archive/`
2. keep a reference path from the active docs if it still has historical value

## Recommended Review Questions

Use these to audit another repo's docs:

- Is there one obvious place to start?
- Can I tell which doc is active vs historical?
- Can I find the correct file owner for a feature quickly?
- Can I find the right command and verification path quickly?
- Is the next coding target unambiguous?
- Are the most complex integrations covered by runbooks?
- Are architecture decisions documented separately from status notes?

If the answer is "no" to several of those, the repo needs a documentation operating system, not just more pages.
