# Angel AI Deploy Runbook

Purpose:

- define the minimum deployment checklist for safe app releases

Audience:

- maintainers
- coding agents preparing a deploy slice

Status:

- active

Source of truth scope:

- deployment preparation checklist

Last updated:

- 2026-03-24

Related docs:

- `AGENTS.md`
- `docs/runbooks/verification.md`
- `docs/reference/env-vars.md`

## Before Deploy

1. run the full verification sequence
2. confirm env vars are configured for the target environment
3. confirm Prisma schema and generated client are in sync
4. confirm patch notes and progress docs reflect the shipped slice
5. confirm no secrets are committed or exposed in docs/logs

## Required Verification

- `npm run type-check`
- `npm test`
- `npm run lint`
- `npm run build`

## Deployment Risks To Re-Check

- auth callback URLs
- Stripe webhook secret and endpoint reachability
- database URLs and Prisma compatibility
- any feature depending on `OPENAI_API_KEY`

## After Deploy

Smoke test:

- `/`
- `/onboarding`
- `/chat`
- auth callback
- checkout open
- webhook path reachability

## Rule

If a deploy changes architecture, product behavior, or integration wiring, update the handoff and patch-note docs in the same slice.
