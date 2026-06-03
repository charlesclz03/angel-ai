# Angel Atmosphere Bridge Architecture

Purpose:

- define the planned technical boundary for Angel's home-atmosphere feature

Audience:

- coding agents
- maintainers
- founders

Status:

- proposed

Source of truth scope:

- architecture recommendation for pairing, command execution, and trust boundaries

Last updated:

- 2026-03-24

Related docs:

- `docs/angel-ai-atmosphere-prd.md`
- `docs/architecture/system-map.md`
- `docs/architecture/data-model.md`
- `docs/architecture/atmosphere-data-model.md`
- `docs/architecture/atmosphere-api-contracts.md`
- `docs/decisions/0005-atmosphere-bridge-through-home-assistant.md`

## Executive Decision

Angel Atmosphere should use:

- `Home Assistant` as the canonical home-automation control plane
- `Music Assistant` as the preferred music orchestration layer when available
- a user-installed `Angel Home Bridge` as the execution boundary
- outbound bridge-to-cloud communication instead of direct cloud-to-LAN control

This keeps Angel's cloud app focused on:

- intent
- relationship context
- scene policy
- logging

It keeps the local bridge focused on:

- pairing
- Home Assistant access
- command translation
- device execution

## Why This Architecture

### Constraints

- the main Angel app is a cloud-hosted Next.js app, not a local-first LAN controller
- a PWA should not rely on raw network scanning or broad local device access
- most home networks do not permit inbound cloud requests to a local service without extra setup
- the feature must preserve privacy and minimize secret sprawl

### Result

The most practical architecture is:

1. Angel Cloud decides that a scene should run
2. Angel Cloud stores a bounded action request
3. the local bridge polls or holds an outbound session to claim pending actions
4. the bridge executes against Home Assistant
5. the bridge reports result metadata back to Angel Cloud

## Component Map

### Angel Cloud

Responsibilities:

- user auth
- subscription gating
- scene policy
- relationship-aware prompting
- action logging
- pairing state
- settings UI

Primary future files:

- `app/chat/actions.ts`
- `app/settings/**`
- `app/api/atmosphere/**`
- `lib/angel/relationship-service.ts`
- `lib/angel/chat-service.ts`
- `lib/atmosphere/**`

### Angel Home Bridge

Responsibilities:

- local pairing
- Home Assistant token storage
- capability discovery
- room/entity filtering
- action execution
- result reporting

Deployment modes:

- preferred: Home Assistant add-on
- fallback: Docker container or lightweight local service

### Home Assistant

Responsibilities:

- expose rooms, entities, and scenes
- execute service calls
- provide normalized device state
- act as the canonical source of home topology

### Music Assistant

Responsibilities:

- optional advanced music routing and playback orchestration
- playlist/provider abstraction
- player-level actions where Home Assistant alone is too thin

## Architectural Pattern

### Pattern Chosen

Use a `policy + command queue + local executor` pattern.

Why:

- it is simpler than a fully live agentic bridge
- it avoids inbound connectivity assumptions
- it gives strong observability
- it supports retries and bounded failure handling

### Simpler Alternatives Considered

#### Option A: direct browser-to-LAN calls

Rejected because:

- depends on same-network browser access
- introduces CORS and discovery complexity
- weakens trust boundaries
- fails when the user is away from home

#### Option B: cloud stores Home Assistant tokens and calls remote HA directly

Rejected as the default because:

- increases cloud-side secret risk
- couples Angel directly to HA network exposure details
- feels heavier than necessary for early companion scenes

#### Option C: bridge polls Angel Cloud for scene actions

Chosen because:

- works from any client device
- keeps home secrets local
- fits a queue/logging model
- keeps the first implementation deterministic

## End-To-End Flows

### Flow A. Pairing

1. user starts pairing in Angel settings
2. Angel Cloud creates a short-lived pairing session and one-time code
3. user opens the local bridge or Home Assistant add-on
4. user enters the pairing code
5. bridge exchanges the code for a bridge-scoped credential
6. bridge stores the Home Assistant token locally
7. bridge reports capabilities and room/entity snapshots
8. Angel Cloud marks the connection `PAIRED`

### Flow B. Scene Execution

1. user or Angel initiates a scene from chat or rituals UI
2. Angel Cloud validates subscription, permissions, quiet hours, and scene policy
3. Angel Cloud creates a pending execution row and command envelope
4. bridge claims the command
5. bridge translates the scene into Home Assistant and optional Music Assistant calls
6. bridge reports success or failure
7. Angel Cloud updates the action log and surfaces the outcome in chat/settings

### Flow C. Capability Refresh

1. bridge periodically reports health and last-seen capabilities
2. Angel Cloud refreshes connection status and timestamps
3. stale or missing bridges degrade to `OFFLINE`
4. Angel falls back to guidance-only behavior when necessary

## Security Boundary

### Secrets

Store locally only:

- Home Assistant access token
- Music Assistant local credentials if needed

Store in Angel Cloud only:

- bridge public metadata
- pairing state
- bridge-scoped credential hash or encrypted token
- room/entity allowlists
- action logs

### Access Surface

The bridge must expose only bounded scene execution abilities.

Not allowed in V1:

- arbitrary service-call passthrough
- unrestricted entity access
- camera or lock control
- shell execution from Angel Cloud

### Recommended Trust Controls

- one-time pairing code
- bridge credential rotation
- heartbeat expiry
- explicit revocation
- allowlist-only entity execution
- confirmation-first scene policy

## Command Design

Angel Cloud should never send:

- "turn on light.kitchen_main to 42%"
- "call this Home Assistant service with arbitrary JSON"

Angel Cloud should send:

- `WIND_DOWN in bedroom`
- `GROUND_ME in living_room`

The bridge owns the translation layer from scene request to vendor-specific commands.

## Failure Model

### Bridge Offline

Cloud behavior:

- mark the action as `FAILED`
- show a soft explanatory message in chat
- suggest a manual ritual fallback

### Partial Device Failure

Bridge behavior:

- continue best-effort execution
- report per-domain results in the final payload

Cloud behavior:

- show a partial-success message
- keep the ritual coherent rather than technical

### Stale Capability Map

Cloud should refuse execution if:

- the chosen room is no longer available
- the selected scene references no allowed entities

## Observability

Track:

- last heartbeat
- last successful execution
- execution latency
- claim latency
- failure category
- scene success by room
- disable and revocation events

## Recommended File Boundaries

### Angel App

Likely new files:

- `lib/atmosphere/service.ts`
- `lib/atmosphere/policy.ts`
- `lib/atmosphere/pairing.ts`
- `lib/atmosphere/types.ts`
- `app/api/atmosphere/**`
- `components/organisms/settings/AtmosphereSettings.tsx`

### Bridge

Likely modules:

- pairing
- heartbeat
- capability discovery
- action claim loop
- Home Assistant adapter
- Music Assistant adapter
- result reporter

## Open Questions

- should the first bridge be a Home Assistant add-on only, or support Docker from day one?
- should room/entity snapshots live as structured rows or a compact JSON projection plus selected structured preferences?
- should `GROUND_ME` restore previous player state by default or only if the user opts in?
- when should trusted scenes be allowed to auto-run without confirmation?

## Recommendation

Build the first slice as:

- Home Assistant add-on first
- polling or long-poll bridge claim loop
- two scenes only: `WIND_DOWN`, `GROUND_ME`
- no wake word
- no direct vendor integrations
- no raw command passthrough

This is the smallest architecture that preserves the companion thesis without creating a fragile smart-home side project.
