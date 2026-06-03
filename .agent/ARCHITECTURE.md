# Angel AI Agent Toolkit Architecture

> Reviewed repo-local skills, workflows, and specialist agents for Angel AI development.

---

## Overview

The `.agent/` tree is Angel AI's local development toolkit.

It exists to keep development help:

- repo-local
- reviewable
- safe by default
- easier to maintain than external prompt packs

Current snapshot:

- **24 specialist agents**
- **66 skills**
- **25 workflows**

Use the toolkit to support development of the app, not to bypass normal code review or verification.

---

## Directory Structure

```text
.agent/
  ARCHITECTURE.md
  agents/
  skills/
  workflows/
  rules/
  scripts/
```

---

## Core Principles

- prefer reviewed repo-local helpers before external prompt packs
- keep automation narrow and task-shaped
- prefer read-only analysis before write-capable workflows
- treat skills, workflows, and agents like code dependencies
- review licenses and scripts before importing outside helpers

---

## Angel-Specific Additions

### Skills

| Skill | Purpose |
| --- | --- |
| `admin-dossier-review` | review internal admin, dossier, moderation, and operator-facing flows |
| `changelog-generator` | sync handoff, backlog, progress log, and patch notes |
| `gh-fix-ci` | diagnose and repair CI and GitHub Actions failures |
| `push-notification-audit` | audit push, service workers, installability, and notification UX |
| `security-audit` | review auth, billing, uploads, memory privacy, push, and tool boundaries |
| `support-ticket-triage` | turn user reports into scoped engineering work |
| `load-context` | rebuild the active Angel AI context stack for a fresh session |
| `sync-docs` | keep operational markdown aligned with code and verification |

### Workflows

| Workflow | Purpose |
| --- | --- |
| `/load-context` | rebuild current docs and execution context |
| `/ci-fix` | repair CI failures without weakening checks |
| `/security-audit` | inspect sensitive app surfaces before shipping |
| `/push-smoke-test` | audit push notifications and installability |
| `/admin-audit` | inspect operator/admin and dossier surfaces |
| `/support-triage` | triage user-reported problems into engineering tasks |
| `/sync-docs` | update handoff, progress log, backlog, and patch notes |

### Agents

| Agent | Purpose |
| --- | --- |
| `moderation-reviewer` | review moderation, NSFW boundaries, and policy-sensitive flows |
| `billing-ops-checker` | review Stripe, renewal, entitlement, and billing-support behavior |
| `admin-ops-analyst` | review internal dashboards, support operations, and operator UX |
| `push-delivery-debugger` | debug push delivery, service workers, and installability |

---

## When To Use What

### Use a skill when

- you need a repeatable local instruction set
- the task is bounded and domain-specific
- the helper should live with the repo

### Use a workflow when

- the task follows a repeatable slash-command process
- the output shape should stay consistent
- multiple steps should be grouped into one known path

### Use an agent when

- a specialist mindset helps
- the task benefits from repeated domain framing
- the role should be visible and reusable across sessions

---

## Safe Usage Rules

- do not auto-install external skills into `.agent/`
- do not trust community prompt packs without review
- do not give broad write or deploy authority to helper workflows by default
- keep sensitive user data redacted in reports and logs
- update active docs when the toolkit or workflow expectations change

---

## Recommended Development Flow

1. Start with `docs/README.md` and the current handoff.
2. Use `/load-context` when starting a fresh implementation pass.
3. Use the narrowest matching workflow for the task.
4. Verify locally.
5. Use `/sync-docs` before ending a meaningful slice.

---

## Related Files

- `AGENTS.md`
- `docs/README.md`
- `docs/reference/commands.md`
- `docs/archive/research/angel-ai-safe-oss-skills-workflows-report-2026-03-24.md`
