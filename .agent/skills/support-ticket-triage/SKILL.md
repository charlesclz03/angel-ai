---
name: support-ticket-triage
description: Triage Angel AI bugs, billing complaints, onboarding blockers, and push/media/runtime support issues into actionable engineering work. Use when reviewing support issues or preparing fixes from user-reported problems.
---

# Support Ticket Triage

Use this skill when translating user-reported problems into engineering action.

## Focus

- reproduce user-visible failures
- separate billing, auth, onboarding, runtime, and push issues
- identify the narrowest likely subsystem
- convert vague reports into concrete next actions

## Workflow

1. Extract the user-facing symptom.
2. Identify likely subsystem ownership.
3. Check whether the issue is configuration, regression, or unsupported behavior.
4. Write a concise engineering summary with likely files and verification steps.
5. Update handoff/backlog docs if it changes priorities.

## Guardrails

- redact private user content
- distinguish evidence from inference
- do not close issues as "user error" without proof

