---
description: Diagnose and fix a GitHub Actions or CI failure by reproducing it locally, identifying the root cause, and validating the repair.
---

# /ci-fix - Fix CI Failures

$ARGUMENTS

## Task

Use the `gh-fix-ci` skill at `.agent/skills/gh-fix-ci/SKILL.md`.

## Goal

Turn a failing CI signal into a locally verified fix without weakening the repo's quality bar.

## Required Outcome

Return:

1. failing workflow or command
2. root cause
3. fix applied
4. local verification run
5. docs updated if commands or workflow expectations changed

