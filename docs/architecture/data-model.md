# Angel AI Data Model

Purpose:

- summarize the current production data model without replacing `prisma/schema.prisma`

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- conceptual model guide

Last updated:

- 2026-03-24

Related docs:

- `prisma/schema.prisma`
- `docs/architecture/system-map.md`
- `docs/decisions/0003-memory-governance-model.md`

## Source Of Truth

The actual schema source of truth is:

- `prisma/schema.prisma`

This document exists to make the model faster to navigate conceptually.

## Core Relationship Models

### `CompanionProfile`

Stores user-facing relationship context:

- name and timezone
- tone and check-in preferences
- relationship intent
- interests, media preferences, daily rhythm
- derived `summaryMarkdown`

### `SoulProfile`

Stores Angel-facing identity with this user:

- angel name
- core tone and humor style
- warmth / playfulness / flirt readiness
- `relationshipStage`
- derived `summaryMarkdown`

## Conversation Models

### `Conversation`

One active relationship thread per user at the current stage of the product.

Tracks:

- status
- last message timestamps

### `Message`

Persists every chat turn and delivery event.

Important fields:

- `senderRole`
- `contentText`
- `contentType`
- `paywallState`

### `MessageAttachment`

Persists rich user inputs.

Current attachment types:

- `IMAGE`
- `LINK_PREVIEW`
- `VOICE_AUDIO`

## Memory Models

### `MemoryEntry`

Durable memory extracted from chat and used to regenerate summaries.

Current memory types:

- `PROFILE_FACT`
- `EMOTIONAL_PATTERN`
- `CALLBACK_HOOK`
- `SHARED_REFERENCE`
- `RELATIONSHIP_MILESTONE`

Important governance fields:

- `confidence`
- `isPinned`
- `isHidden`
- `sourceMessageId`
- `sourceContext`

### `OnboardingResponse`

Stores onboarding step saves and also hosts special session-primer artifacts.

Current non-step artifact keys:

- `__relationship_seed`
- `__session_brief`

## Social Context Models

### `ConnectedSocialAccount`

Stores the user's official platform connection state.

Tracks:

- `platform`
- encrypted access and refresh tokens
- granted scopes
- connection status
- provider identity and handle hints
- last successful scan and latest error

### `SocialScanJob`

Queues bounded background import work per platform.

Tracks:

- scan `status`
- claim timestamp
- retry and attempt metadata
- latest failure code/message

### `SocialProfileSnapshot`

Stores normalized profile-level social context.

Tracks:

- platform user id
- handle and display name
- bio and headline
- avatar and profile URL
- normalized metadata only

### `SocialContentSnapshot`

Stores normalized recent posts or videos imported through official APIs.

Tracks:

- external content id
- text, media URL, and permalink
- posted timestamp
- content type
- normalized metadata only

## Continuity Models

### `Touchpoint`

Schedules and tracks proactive or continuity-driven messages.

Current types:

- `EMOTIONAL_CHECKIN`
- `FOLLOWUP`
- `EVENING_MESSAGE`
- `POST_PAYWALL_READ_ONLY`

Current status values:

- `SCHEDULED`
- `SENT`
- `SKIPPED`
- `CANCELED`

## Billing And Auth Models

### `Subscription`

Stores synced Stripe entitlement state and the app-level tier used for gating.

### `Account`, `Session`, `User`, `VerificationToken`

NextAuth and user-account substrate.

## Model Relationships That Matter Most

- `User` -> `CompanionProfile` and `SoulProfile`
- `User` -> active `Conversation`
- `Conversation` -> `Message`
- `Message` -> `MessageAttachment`
- `Message` -> `MemoryEntry` via `sourceMessageId`
- `User` -> `ConnectedSocialAccount`
- `ConnectedSocialAccount` -> `SocialProfileSnapshot`
- `ConnectedSocialAccount` -> `SocialContentSnapshot`
- `ConnectedSocialAccount` -> `SocialScanJob`
- `User` -> `Touchpoint`
- `User` -> `Subscription`

## Current Modeling Rules

- structured records are the source of truth
- markdown is derived
- summary regeneration should always come from structured memory plus profiles
- official social imports should stay normalized and capability-based, not raw-payload storage or scraping
- social-derived memory should be removable by platform and rebuild summaries/session artifacts after deletion
- continuity and rituals should use `Touchpoint`, not ad hoc timers
- billing access should resolve from `Subscription.tier`, not only return URLs
