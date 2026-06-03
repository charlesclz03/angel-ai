# Angel Atmosphere API Contracts

Purpose:

- define the proposed API boundaries for Angel Atmosphere before implementation

Audience:

- coding agents
- maintainers

Status:

- proposed

Source of truth scope:

- API design recommendation for the cloud app and local bridge

Last updated:

- 2026-03-24

Related docs:

- `docs/angel-ai-atmosphere-prd.md`
- `docs/architecture/atmosphere-bridge-architecture.md`
- `docs/architecture/atmosphere-data-model.md`
- `docs/reference/commands.md`

## API Style Decision

### Chosen Style

Use `REST` for the bridge-facing boundary.

Reasons:

- the bridge is a separate process with a simple command-and-result lifecycle
- REST is easy to debug during local development
- the resource model is naturally queue- and session-oriented
- it keeps the first implementation legible for both cloud and bridge workers

### Internal App Surface

For the user-facing app itself, Angel can continue to use:

- server actions where that already matches the repo
- route handlers where bridge or background communication needs explicit HTTP endpoints

### Versioning

Use URI versioning from day one:

- `/api/atmosphere/v1/...`
- `/api/internal/atmosphere/v1/...`

This keeps the bridge upgrade path clear.

## Consumers

### Consumer 1. Authenticated Angel app

Needs:

- create pairing sessions
- save room scopes and scene preferences
- request scene execution
- read connection state and logs

Auth:

- NextAuth user session

### Consumer 2. Local Angel Home Bridge

Needs:

- complete pairing
- send heartbeat
- refresh capabilities
- claim pending executions
- report execution results

Auth:

- bridge-scoped bearer token issued after pairing

## Response Envelope

Use one response shape everywhere:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Error shape:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "ATMOSPHERE_CONNECTION_OFFLINE",
    "message": "Home bridge is offline."
  }
}
```

## Public Authenticated App Endpoints

### `POST /api/atmosphere/v1/pairing-sessions`

Purpose:

- create a one-time pairing session for a user

Auth:

- required user session

Request:

```json
{
  "bridgeType": "HA_ADDON"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "pairingSessionId": "ps_123",
    "pairingCode": "481-229",
    "expiresAt": "2026-03-24T22:00:00.000Z"
  },
  "error": null
}
```

### `GET /api/atmosphere/v1/connection`

Purpose:

- load the current user's paired connection summary and health state

### `PUT /api/atmosphere/v1/room-scopes`

Purpose:

- replace the current room and entity allowlists for the user

Request:

```json
{
  "rooms": [
    {
      "roomKey": "bedroom",
      "roomLabel": "Bedroom",
      "isEnabled": true,
      "allowedLightEntityIds": ["light.bedside_left", "light.bedside_right"],
      "allowedPlayerEntityIds": ["media_player.bedroom_sonos"]
    }
  ]
}
```

### `PUT /api/atmosphere/v1/scene-preferences`

Purpose:

- save per-scene policy and defaults

Request:

```json
{
  "scenes": [
    {
      "sceneKey": "WIND_DOWN",
      "isEnabled": true,
      "confirmationMode": "ALWAYS_REQUIRED",
      "preferredRoomKey": "bedroom",
      "restorePreviousState": false,
      "preferredBrightnessPercent": 24,
      "preferredVolumePercent": 18
    }
  ]
}
```

### `POST /api/atmosphere/v1/executions`

Purpose:

- request a new scene execution

Auth:

- required user session

Request:

```json
{
  "sceneKey": "GROUND_ME",
  "roomKey": "living_room",
  "triggerSource": "USER_CHAT",
  "triggerMessageId": "msg_123",
  "confirmationAccepted": true
}
```

Server validation:

- active subscription or allowed beta access
- paired connection exists
- quiet hours policy permits request
- room is enabled
- scene is enabled
- confirmation requirements are satisfied

Response:

```json
{
  "ok": true,
  "data": {
    "executionId": "ax_123",
    "status": "QUEUED"
  },
  "error": null
}
```

### `GET /api/atmosphere/v1/executions`

Purpose:

- list recent executions for settings and audit UI

Suggested query params:

- `limit`
- `status`
- `sceneKey`

## Internal Bridge Endpoints

These are not user-session endpoints.

They should live under:

- `/api/internal/atmosphere/v1/...`

### `POST /api/internal/atmosphere/v1/pair`

Purpose:

- exchange a one-time pairing code for bridge credentials

Request:

```json
{
  "pairingCode": "481-229",
  "bridgeType": "HA_ADDON",
  "bridgeInstanceId": "ha-addon-01",
  "bridgeLabel": "Charles Home Assistant",
  "capabilities": {
    "supportsLights": true,
    "supportsMusic": true,
    "supportsStateRestore": true
  }
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "connectionId": "hc_123",
    "bridgeToken": "bt_...",
    "pollIntervalSeconds": 5
  },
  "error": null
}
```

### `POST /api/internal/atmosphere/v1/heartbeat`

Purpose:

- keep connection health fresh and optionally refresh capabilities

Auth:

- bridge bearer token

Request:

```json
{
  "connectionId": "hc_123",
  "capabilities": {
    "supportsLights": true,
    "supportsMusic": true
  },
  "roomSnapshots": [
    {
      "roomKey": "bedroom",
      "roomLabel": "Bedroom",
      "lightEntityIds": ["light.bedside_left"],
      "playerEntityIds": ["media_player.bedroom_sonos"]
    }
  ]
}
```

### `POST /api/internal/atmosphere/v1/executions/claim`

Purpose:

- let the bridge claim the oldest pending execution for its connection

Auth:

- bridge bearer token

Request:

```json
{
  "connectionId": "hc_123"
}
```

Success response when work exists:

```json
{
  "ok": true,
  "data": {
    "execution": {
      "executionId": "ax_123",
      "sceneKey": "WIND_DOWN",
      "roomKey": "bedroom",
      "requestPayload": {
        "preferredBrightnessPercent": 24,
        "preferredVolumePercent": 18,
        "preferredMediaRef": null,
        "restorePreviousState": false
      }
    }
  },
  "error": null
}
```

Success response when idle:

```json
{
  "ok": true,
  "data": {
    "execution": null
  },
  "error": null
}
```

### `POST /api/internal/atmosphere/v1/executions/{executionId}/result`

Purpose:

- report final outcome back to Angel Cloud

Auth:

- bridge bearer token

Request:

```json
{
  "status": "SUCCEEDED",
  "resultPayload": {
    "lightsChanged": 2,
    "musicAction": "paused",
    "restorableStateStored": true
  },
  "failureCode": null,
  "failureMessage": null
}
```

Partial failure example:

```json
{
  "status": "PARTIAL",
  "resultPayload": {
    "lightsChanged": 2,
    "musicAction": "failed"
  },
  "failureCode": "PLAYER_UNAVAILABLE",
  "failureMessage": "Bedroom player was offline."
}
```

## Authentication Design

### User-facing app routes

Use:

- existing NextAuth session checks

### Bridge routes

Use:

- opaque bridge bearer token
- rotate on re-pairing
- hash or encrypt at rest in cloud storage

Do not use:

- the Home Assistant token as the bridge credential

## Rate Limiting

Apply:

- moderate per-user rate limit on `POST /executions`
- stricter per-bridge rate limit on pairing attempts
- heartbeat tolerance without aggressive blocking

Guardrail examples:

- scene execution burst limit per minute
- pairing attempts per hour

## Error Codes

Suggested initial set:

- `ATMOSPHERE_NOT_ENABLED`
- `ATMOSPHERE_CONNECTION_MISSING`
- `ATMOSPHERE_CONNECTION_OFFLINE`
- `ATMOSPHERE_SCENE_DISABLED`
- `ATMOSPHERE_ROOM_NOT_ALLOWED`
- `ATMOSPHERE_CONFIRMATION_REQUIRED`
- `ATMOSPHERE_QUIET_HOURS_BLOCKED`
- `ATMOSPHERE_EXECUTION_CLAIM_CONFLICT`
- `ATMOSPHERE_BRIDGE_UNAUTHORIZED`

## Why Not GraphQL Or tRPC Here

### GraphQL

Not needed because:

- the bridge does not need arbitrary graph traversal
- operations are simple and command-oriented

### tRPC

Not ideal for the bridge boundary because:

- the bridge is a separate executable/service
- REST is easier to inspect and implement outside the Next.js runtime

## Documentation And Testing Guidance

Before implementation:

- keep this contract synced with the data model doc
- keep scene request shapes bounded

After implementation:

- add contract tests for pairing, claim, and result-reporting
- verify auth rejection paths
- verify idle claim responses

## Recommendation

Use:

- server actions or thin route handlers for the in-app user flows
- versioned REST route handlers for all bridge-facing traffic

That is the simplest API surface that fits Angel's current architecture and the local-bridge constraint.
