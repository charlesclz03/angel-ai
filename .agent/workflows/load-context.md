---
description: Load Angel AI session context by reading the current docs stack in the right order and returning a concise execution brief.
---

# /load-context - Load Session Context

$ARGUMENTS

## Task

Use the `load-context` skill at `.agent/skills/load-context/SKILL.md`.

## Goal

Rebuild full Angel AI session context for a new coding pass without mixing active execution docs with archive-only material.

## Required Outcome

Return a short context brief with:

1. current verified product state
2. immediate build target
3. critical constraints and guardrails
4. main code entry points
5. env blockers
6. verification commands
7. docs to update if behavior changes
