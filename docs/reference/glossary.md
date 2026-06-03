# Angel AI Glossary

Purpose:

- keep the product and architecture vocabulary consistent

Audience:

- coding agents
- maintainers

Status:

- reference

Source of truth scope:

- domain terminology

Last updated:

- 2026-03-24

Related docs:

- `docs/architecture/data-model.md`
- `docs/decisions/0001-session-primer-over-raw-markdown.md`

## Terms

### Companion profile

The user-side relational profile.
Backed by `CompanionProfile`.

### Soul profile

The Angel-side identity with this user.
Backed by `SoulProfile`.

### Continuity

The product idea that the relationship should continue across days, not reset each session.

### Continuity paywall

The day-one renewal gate that turns the thread read-only after the free continuation window closes.

### Session primer

The curated live-runtime context pack.
Today this is represented by `relationship_seed.md` and `session-brief.md`.

### `user.md`

The derived companion summary markdown built from structured profile and memory.

### `soul.md`

The derived Angel-with-this-user summary markdown.

### Relationship stage

The explicit pacing state for the bond:

- `NEW_CONNECTION`
- `WARM_FRIEND`
- `TRUSTED_COMPANION`
- `TENDER_AMBIGUITY`
- `SOFT_ROMANCE`

### Bridge prompt

A proactive follow-up that points back toward the user's real life, such as an interview, meeting, or social action.

### Ritual

A named, repeatable proactive presence pattern such as morning check-in or evening wind-down.
