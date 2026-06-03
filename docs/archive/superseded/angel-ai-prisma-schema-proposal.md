# Angel AI Prisma Schema Proposal

Purpose:

- preserve the earlier schema-design proposal for historical context

Audience:

- maintainers
- coding agents needing historical rationale

Status:

- superseded

Source of truth scope:

- historical design context only

Last updated:

- 2026-03-24

Related docs:

- `prisma/schema.prisma`
- `docs/architecture/data-model.md`

## Purpose

This document proposes the first Angel-specific extension of the current Prisma schema.

The existing schema already covers:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `UserPreferences`
- `Subscription`

The goal here is to add the product-level models needed for:

- onboarding
- conversation history
- `user.md` and `soul.md`
- proactive touchpoints
- links, images, and voice notes

## Design Principles

- keep auth and billing concerns separate from companion logic
- keep structured relational data in Postgres
- treat `user.md` and `soul.md` as generated artifacts backed by structured records
- support v1 text, links, images, and user-recorded voice notes
- prepare for later TTS and richer companion state without overbuilding now

## Proposed New Models

### `CompanionProfile`

Stores structured information about the human user as understood by Angel AI.

Suggested relation:

- one-to-one with `User`

Suggested fields:

- `id`
- `userId`
- `displayName`
- `preferredName`
- `timezone`
- `birthDate`
- `birthTime`
- `birthPlace`
- `tonePreference`
- `relationshipIntent`
- `checkinPreference`
- `emotionalNeeds`
- `boundaries`
- `interests`
- `mediaPreferences`
- `dailyRhythm`
- `summaryMarkdown`
- `createdAt`
- `updatedAt`

Notes:

- `summaryMarkdown` is the generated `user.md`
- some structured fields may be stored as JSON for v1

### `SoulProfile`

Stores Angel's user-specific identity and relationship stance.

Suggested relation:

- one-to-one with `User`

Suggested fields:

- `id`
- `userId`
- `angelName`
- `coreTone`
- `humorStyle`
- `warmthLevel`
- `playfulnessLevel`
- `flirtReadiness`
- `relationshipStage`
- `sharedInterests`
- `signaturePhrases`
- `voiceStyle`
- `summaryMarkdown`
- `createdAt`
- `updatedAt`

Notes:

- `summaryMarkdown` is the generated `soul.md`
- `voiceStyle` starts nullable and becomes useful later when Angel speaks back

### `Conversation`

Represents the long-running relationship thread between the user and Angel.

Suggested fields:

- `id`
- `userId`
- `status`
- `lastMessageAt`
- `lastUserMessageAt`
- `lastAngelMessageAt`
- `createdAt`
- `updatedAt`

Suggested status values:

- `ACTIVE`
- `ARCHIVED`
- `PAUSED`

### `Message`

Stores each text exchange.

Suggested fields:

- `id`
- `conversationId`
- `senderRole`
- `contentText`
- `contentType`
- `paywallState`
- `memoryRelevanceScore`
- `createdAt`

Suggested sender roles:

- `USER`
- `ANGEL`
- `SYSTEM`

Suggested content types:

- `TEXT`
- `LINK`
- `IMAGE`
- `VOICE_NOTE`

Suggested paywall states:

- `FREE`
- `READ_ONLY`
- `SUBSCRIBER`

### `MessageAttachment`

Stores media connected to a message.

Suggested fields:

- `id`
- `messageId`
- `type`
- `url`
- `mimeType`
- `title`
- `metadata`
- `createdAt`

Suggested attachment types:

- `IMAGE`
- `LINK_PREVIEW`
- `VOICE_AUDIO`

### `MemoryEntry`

Stores extracted or curated memory facts.

Suggested fields:

- `id`
- `userId`
- `sourceMessageId`
- `memoryType`
- `summary`
- `confidence`
- `isPinned`
- `createdAt`
- `updatedAt`

Suggested memory types:

- `PROFILE_FACT`
- `EMOTIONAL_PATTERN`
- `CALLBACK_HOOK`
- `SHARED_REFERENCE`
- `RELATIONSHIP_MILESTONE`

### `OnboardingResponse`

Stores structured answers from the onboarding flow.

Suggested fields:

- `id`
- `userId`
- `stepKey`
- `promptText`
- `responseText`
- `responseJson`
- `createdAt`

This allows:

- replaying onboarding logic
- regenerating summaries
- auditing what Angel actually learned

### `Touchpoint`

Stores proactive outgoing touchpoints.

Suggested fields:

- `id`
- `userId`
- `type`
- `status`
- `scheduledFor`
- `sentAt`
- `sourceContext`
- `createdAt`

Suggested types:

- `EMOTIONAL_CHECKIN`
- `FOLLOWUP`
- `EVENING_MESSAGE`
- `POST_PAYWALL_READ_ONLY`

Suggested statuses:

- `SCHEDULED`
- `SENT`
- `SKIPPED`
- `CANCELED`

## Suggested Enum Layer

If the team prefers stronger typing, these enums are good candidates:

- `RelationshipIntent`
- `RelationshipStage`
- `ContentType`
- `MessageSenderRole`
- `TouchpointType`
- `TouchpointStatus`
- `ConversationStatus`

## Recommended JSON vs String Approach

For v1:

- use `String` for clear single-value fields
- use `Json` for lists and flexible structures like interests, boundaries, media preferences, and signature phrases

This keeps the first schema simpler while preserving room to refine later.

## Relationship to Existing `User` Model

Recommended additions to the current `User` model:

- `companionProfile CompanionProfile?`
- `soulProfile SoulProfile?`
- `conversations Conversation[]`
- `memoryEntries MemoryEntry[]`
- `touchpoints Touchpoint[]`
- `onboardingResponses OnboardingResponse[]`

Keep existing auth and billing relations untouched.

## Migration Strategy

### Phase 1

Add:

- `CompanionProfile`
- `SoulProfile`
- `Conversation`
- `Message`

This is enough to support onboarding, first chat, and next-day continuity.

### Phase 2

Add:

- `MessageAttachment`
- `MemoryEntry`
- `OnboardingResponse`
- `Touchpoint`

This supports richer media, memory curation, and proactive messaging.

### Phase 3

Add later if needed:

- voice generation preferences
- moderation audit tables
- experimentation tables for retention tuning

## Recommendation

Do not put raw `user.md` and `soul.md` files at the center of the schema.

Instead:

- store structured facts in relational models
- generate `summaryMarkdown` views for prompting and product use
- regenerate those summaries when new memory arrives

That gives Angel AI both:

- product poetry
- database sanity
