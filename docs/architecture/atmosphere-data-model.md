# Angel Atmosphere Data Model Proposal

Purpose:

- define the proposed schema additions for the Atmosphere feature before any Prisma migration is written

Audience:

- coding agents
- maintainers

Status:

- proposed

Source of truth scope:

- schema proposal only; `prisma/schema.prisma` remains the actual source of truth

Last updated:

- 2026-03-24

Related docs:

- `prisma/schema.prisma`
- `docs/architecture/data-model.md`
- `docs/angel-ai-atmosphere-prd.md`
- `docs/architecture/atmosphere-bridge-architecture.md`
- `docs/architecture/atmosphere-api-contracts.md`

## Modeling Principles

- keep structured records as the source of truth
- do not store Home Assistant tokens in Angel Cloud
- prefer one active connection per user in V1
- use small enums for bounded scenes and statuses
- keep vendor-specific payloads out of core logic where possible
- treat logs and execution rows as first-class product data, not debug leftovers

## Proposed Enums

### `HomeAutomationProvider`

V1 values:

- `HOME_ASSISTANT`

Future-safe values:

- `MUSIC_ASSISTANT`
- `CUSTOM_BRIDGE`

### `HomeAutomationConnectionStatus`

Values:

- `PAIRING`
- `PAIRED`
- `OFFLINE`
- `REVOKED`
- `FAILED`

### `HomeBridgeType`

Values:

- `HA_ADDON`
- `DOCKER`
- `LOCAL_SERVICE`

### `AtmosphereSceneKey`

Values:

- `WIND_DOWN`
- `GROUND_ME`
- `DEEP_FOCUS`
- `MORNING_RESET`
- `SACRED_PAUSE`

### `AtmosphereConfirmationMode`

Values:

- `ALWAYS_REQUIRED`
- `TRUSTED_SCENES`
- `MANUAL_ONLY`

### `AtmosphereExecutionStatus`

Values:

- `QUEUED`
- `CLAIMED`
- `SUCCEEDED`
- `PARTIAL`
- `FAILED`
- `CANCELED`

### `AtmosphereTriggerSource`

Values:

- `USER_CHAT`
- `ANGEL_SUGGESTION`
- `RITUAL`
- `TOUCHPOINT`
- `SETTINGS_TEST`

## Proposed Models

### `HomeAutomationConnection`

Purpose:

- the single high-level connection row between a user and a paired bridge

Suggested fields:

- `id`
- `userId`
- `provider`
- `bridgeType`
- `status`
- `displayName`
- `bridgeInstanceId`
- `bridgeLabel`
- `pairedAt`
- `lastHeartbeatAt`
- `lastCapabilityRefreshAt`
- `lastErrorCode`
- `lastErrorMessage`
- `capabilitiesJson`
- `createdAt`
- `updatedAt`

Relationships:

- `User -> HomeAutomationConnection` as one-to-many in the schema, with product rule "one active connection in V1"
- `HomeAutomationConnection -> AtmosphereRoomScope[]`
- `HomeAutomationConnection -> AtmosphereScenePreference[]`
- `HomeAutomationConnection -> AtmosphereExecution[]`

Indexes:

- `@@index([userId, status])`
- `@@index([status, lastHeartbeatAt])`
- `@@unique([provider, bridgeInstanceId])`

### `BridgePairingSession`

Purpose:

- hold short-lived pairing state before the bridge becomes trusted

Suggested fields:

- `id`
- `userId`
- `connectionId` nullable until paired
- `pairingCodeHash`
- `expiresAt`
- `consumedAt`
- `bridgeType`
- `requestedCapabilities`
- `createdAt`

Indexes:

- `@@index([userId, expiresAt])`
- `@@index([expiresAt])`

Retention rule:

- short TTL cleanup job

### `AtmosphereRoomScope`

Purpose:

- represent which rooms and entity sets Angel may affect

Suggested fields:

- `id`
- `connectionId`
- `userId`
- `roomKey`
- `roomLabel`
- `isEnabled`
- `allowedLightEntityIds` as `Json`
- `allowedPlayerEntityIds` as `Json`
- `metadata`
- `createdAt`
- `updatedAt`

Why JSON arrays are acceptable here:

- entity ids are dynamic provider identifiers
- they are scoped, user-managed lists rather than relational business entities
- over-normalizing them early would create more migration burden than value

Indexes:

- `@@unique([connectionId, roomKey])`
- `@@index([userId, isEnabled])`

### `AtmosphereScenePreference`

Purpose:

- store per-scene user policy and defaults

Suggested fields:

- `id`
- `connectionId`
- `userId`
- `sceneKey`
- `isEnabled`
- `confirmationMode`
- `preferredRoomKey`
- `restorePreviousState`
- `preferredBrightnessPercent`
- `preferredVolumePercent`
- `preferredMediaRef`
- `quietHoursPolicy` as `Json`
- `createdAt`
- `updatedAt`

Indexes:

- `@@unique([connectionId, sceneKey])`
- `@@index([userId, sceneKey])`

### `AtmosphereExecution`

Purpose:

- durable command and outcome log for every attempted atmosphere action

Suggested fields:

- `id`
- `userId`
- `connectionId`
- `sceneKey`
- `roomKey`
- `status`
- `triggerSource`
- `requestSummary`
- `requestPayload`
- `resultPayload`
- `requestedAt`
- `claimedAt`
- `completedAt`
- `failureCode`
- `failureMessage`
- `triggerMessageId` nullable
- `triggerTouchpointId` nullable
- `restoreOfExecutionId` nullable

Relationships:

- optional relation to `Message`
- optional relation to `Touchpoint`
- optional self-reference for restore behavior later

Indexes:

- `@@index([userId, requestedAt])`
- `@@index([connectionId, status, requestedAt])`
- `@@index([sceneKey, status, requestedAt])`
- `@@index([triggerMessageId])`
- `@@index([triggerTouchpointId])`

## Proposed Prisma Relationship Additions

### Extend `User`

Add:

- `homeAutomationConnections HomeAutomationConnection[]`
- `bridgePairingSessions BridgePairingSession[]`
- `atmosphereRoomScopes AtmosphereRoomScope[]`
- `atmosphereScenePreferences AtmosphereScenePreference[]`
- `atmosphereExecutions AtmosphereExecution[]`

### Extend `Message`

Optional add:

- `atmosphereExecutions AtmosphereExecution[]`

### Extend `Touchpoint`

Optional add:

- `atmosphereExecutions AtmosphereExecution[]`

## Why No Separate Device Table In V1

A full normalized device registry was considered, but deferred.

Reasons:

- Home Assistant already owns device/entity truth
- Angel only needs bounded allowlists, not universal home topology modeling
- a local bridge can refresh snapshots without forcing heavy relational churn

If V2 needs richer analytics on exact devices, a device registry can be introduced later.

## Query Patterns To Optimize For

### Chat-time checks

- does the user have an active paired connection?
- is the selected scene enabled?
- does the chosen room exist and remain enabled?

### Settings UI

- load connection summary
- load room scopes
- load scene preferences
- list recent executions

### Bridge loop

- claim queued executions for a connection
- update heartbeat and capability refresh timestamps

## Migration Strategy

### Migration 1. Core tables and enums

Add:

- enums
- `HomeAutomationConnection`
- `BridgePairingSession`
- `AtmosphereRoomScope`
- `AtmosphereScenePreference`
- `AtmosphereExecution`

### Migration 2. Optional message and touchpoint relations

Add only after the app actually needs linked execution history.

### Migration 3. Cleanup and tightening

After alpha usage:

- tighten nullability
- prune unused fields
- add any missing indexes from real query behavior

## Trade-Off Summary

### Chosen trade-off

Use structured rows for:

- connection state
- room scope
- scene preferences
- execution logging

Use JSON for:

- provider capability snapshots
- dynamic allowlisted entity id arrays
- low-level request/result payloads

This gives us enough structure for product logic without pretending the home graph is static.

## Recommendation

Start with the schema above and keep V1 intentionally small.

The best way to avoid future schema regret is to keep Angel modeling:

- scenes
- permissions
- executions

and let Home Assistant continue modeling the raw device graph.
