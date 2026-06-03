---
name: gh-fix-ci
description: Diagnose and fix Angel AI GitHub Actions and CI failures safely. Use when workflows fail, tests regress in CI only, or lint/type/build behavior differs between local and CI.
---

# GitHub CI Fix

Use this skill for CI and workflow failures.

## Focus

- GitHub Actions logs
- Node/npm lockfile drift
- lint, type-check, test, and build mismatches
- env-dependent failures
- platform or shell differences

## Workflow

1. Identify the failing workflow and step.
2. Reproduce locally with the closest matching command.
3. Compare local assumptions against CI environment assumptions.
4. Fix the root cause, not just the symptom.
5. Re-run the failing command locally.
6. Update docs if commands or required verification changed.

## Guardrails

- do not weaken checks just to turn CI green
- prefer deterministic fixes over retry logic
- keep secrets out of logs and workflow output

