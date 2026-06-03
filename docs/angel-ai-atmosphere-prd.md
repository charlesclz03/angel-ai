# Angel AI Atmosphere PRD

Purpose:

- define the product, architecture, and rollout plan for Angel's bounded home-atmosphere feature

Audience:

- maintainers
- coding agents
- founders

Status:

- proposed

Source of truth scope:

- product requirements and architecture recommendation for consented lights-and-music rituals

Last updated:

- 2026-03-24

Related docs:

- `docs/README.md`
- `docs/angel-ai-next-steps.md`
- `docs/angel-ai-next-phases.md`
- `docs/angel-ai-product-spec-master.md`
- `docs/architecture/runtime-flows.md`
- `docs/runbooks/openclaw-handoff.md`
- `docs/architecture/atmosphere-bridge-architecture.md`
- `docs/architecture/atmosphere-data-model.md`
- `docs/architecture/atmosphere-api-contracts.md`
- `docs/decisions/0005-atmosphere-bridge-through-home-assistant.md`
- `angel-atmosphere-implementation-plan.md`

Snapshot date: 2026-03-24

## Executive Summary

`Angel Atmosphere` is an opt-in feature that lets Angel shape a user's environment during emotionally meaningful moments.

The first useful version is not "Angel controls the whole house."

The right version is:

- bounded
- explicit
- scenes-first
- emotionally motivated
- reversible

Angel should be able to do things like:

- dim the lights for a wind-down ritual
- pause or lower music during grounding
- start a calm playlist for journaling
- switch a room into focus mode before a goal-setting session

This feature should not begin as raw LAN discovery from the PWA or unrestricted smart-home control.

The recommended path is a bounded integration layer built around a user-consented home bridge, with Home Assistant as the canonical control plane and Music Assistant as the preferred music orchestration layer when available.

## Product Thesis

Angel's current presence model is strongest inside chat and push notifications.

The next level of presence is not more words alone.
It is light-touch influence over the user's environment during rituals that already fit the companion product:

- evening wind-down
- grounding and breathing
- focus and co-working
- gentle morning reset

If Angel can help shape the room in those moments, the product becomes more embodied and memorable without turning into a generic voice-assistant clone.

## Problem

Today, Angel can:

- chat
- remember
- follow up
- send continuity and ritual touchpoints

But Angel cannot yet affect the user's immediate environment.

This creates a gap:

- the app can suggest a calming ritual but not dim the lights
- the app can recommend focus but not help create the room conditions
- the app can feel emotionally present, but not spatially present

The opportunity is to make Angel feel more ambient and companion-like without violating trust.

## Goals

- deepen Angel's sense of presence beyond the browser tab
- improve ritual completion and emotional resonance
- strengthen retention through repeatable companion moments
- unify chat, rituals, and environmental actions inside one conversational portal
- preserve user trust through strict scope, explicit permissions, and transparent action logs

## Non-Goals

- Angel is not a general smart-home assistant in V1
- Angel does not perform raw network scanning from the browser or PWA
- Angel does not manage security-critical devices in V1
- Angel does not replace Home Assistant, Music Assistant, or a dedicated home dashboard
- Angel does not execute broad background automations without clear consent
- Angel does not become a wake-word room assistant in the first release

## Product Positioning

`Angel Atmosphere` should be framed as an emotional-presence feature, not a technical automation feature.

Good framing:

- "Want me to soften the room a little?"
- "I can switch us into focus mode."
- "I can quiet the room while we do this."

Bad framing:

- "I can control your whole house."
- "I found your devices."
- "Ask me anything about your smart home."

## Core UX Principles

### Emotion First

Actions should be attached to rituals, tone, and context, not gadget novelty.

### Scenes Over Raw Commands

Users should begin with a small set of named scenes instead of arbitrary device instructions.

### Explicit Trust

Every device category, room, and scene must be explicitly allowed by the user.

### Reversible And Visible

Users must be able to see what Angel changed and stop future actions instantly.

### Graceful Degradation

If a bridge is offline or a device fails, Angel should stay useful and simply fall back to guidance-only behavior.

## Primary User Stories

- As a user winding down at night, I want Angel to dim the lights and start calming audio so the ritual feels real.
- As a user who feels overwhelmed, I want Angel to lower stimulation in the room while guiding me through grounding.
- As a user trying to focus, I want Angel to help me enter a consistent environment for work or journaling.
- As a privacy-conscious user, I want total control over which rooms and devices Angel can touch.
- As a subscriber, I want the environmental feature to feel intimate and supportive, not invasive or random.

## MVP Definition

The first production slice should support:

- one canonical control-plane provider: `Home Assistant`
- one optional music layer: `Music Assistant`
- user-selected rooms only
- user-selected light entities only
- user-selected music players only
- scene-based execution only
- explicit confirmation by default
- action logs
- kill switch / disable toggle

The MVP should not support:

- locks
- cameras
- alarms
- garage doors
- thermostats
- arbitrary device control
- autonomous triggers without explicit opt-in rules

## V1 Scene Set

### Wind Down

Intent:

- prepare the room for evening calm

Typical actions:

- dim warm lights
- lower music volume or start a calm playlist
- silence non-essential audio if configured

### Ground Me

Intent:

- reduce stimulation during stress, breathing, or reset moments

Typical actions:

- pause music
- soften lights
- optionally restore the previous music state after the ritual

### Deep Focus

Intent:

- create a light audio environment for journaling, reading, or work

Typical actions:

- set brighter or cooler lights if the user prefers
- start instrumental or low-distraction audio
- keep the room stable for a timed session

### Morning Reset

Intent:

- make early-day check-ins more activating and structured

Typical actions:

- brighten lights gradually
- start a morning playlist or podcast source
- pair with a short Angel check-in

### Sacred Pause

Intent:

- reduce external stimulation during a meaningful relationship moment

Typical actions:

- lower volume
- reduce light intensity
- avoid abrupt device changes

## Recommended Architecture

### Architecture Decision

Angel should not try to control home devices directly from the cloud app or the PWA.

Angel should delegate environmental actions through a bounded bridge:

1. `Angel App`
2. `Angel Atmosphere Policy Layer`
3. `Angel Home Bridge`
4. `Home Assistant`
5. `Music Assistant` when present

Optional later voice layer:

- `Assist` through Home Assistant
- `Rhasspy` for advanced local/offline users

### Why This Architecture

- it avoids raw local-network behavior from the browser
- it keeps the device graph inside a system built for home automation
- it gives Angel a small, safe action surface instead of full home control
- it supports same-WiFi and local-first use cases through a local bridge
- it reduces vendor sprawl by not building direct first-party integrations for every device family

### Canonical Control Plane: Home Assistant

Home Assistant should be treated as the source of truth for:

- rooms
- exposed entities
- scenes
- permissions mapping
- intent execution

Relevant official capabilities:

- natural-language control through `Assist`
- a text conversation API
- REST and WebSocket APIs for actions and state

### Preferred Music Layer: Music Assistant

Music Assistant is the best open-source music layer when the user already runs Home Assistant or wants multi-provider playback orchestration.

It is especially attractive because it is designed to work side by side with Home Assistant and is built with automation in mind.

### Optional Voice Edge: Assist Or Rhasspy

If Angel later expands into room devices or wake-word flows, the voice edge should remain optional and local-first:

- `Assist` if the user already runs Home Assistant voice pipelines
- `Rhasspy` for advanced users who want offline intent handling

This voice layer is later-stage and should not block the first product release.

## Bridge Topology Recommendation

### Preferred V1 Topology

Use an `Angel Home Bridge` installed by the user as either:

- a Home Assistant add-on
- a small local service on a machine inside the home network

The bridge should:

- authenticate the user's Angel account through one-time pairing
- hold the Home Assistant access token locally
- expose only a small allowlisted command surface to Angel
- execute approved scene requests
- return success, failure, and execution metadata

### Why The Bridge Matters

Being on the same WiFi is not enough.

Angel still needs a secure integration boundary that:

- scopes permissions
- avoids arbitrary device access
- keeps secrets local
- makes logs and auditability possible

### Fallback Topology

If a user already has secure remote access configured for Home Assistant, a direct cloud-to-Home Assistant path may be possible later.

This should be a secondary option, not the default recommendation.

## Consent And Safety Model

### Permission Layers

Users must opt in at each layer:

- connect a home system
- choose rooms
- choose device categories
- choose scene availability
- choose whether confirmation is always required

### Allowed Domains In V1

- lights
- music playback
- music volume
- scene execution

### Blocked Domains In V1

- locks
- cameras
- alarms
- garage doors
- access control
- safety systems
- payments or purchases

### User Controls

Angel Atmosphere must include:

- a global on/off toggle
- a room-level scope editor
- per-scene enable/disable controls
- a recent actions log
- a one-tap "stop affecting my environment" control
- quiet hours
- optional restore behavior for music and lights

### Default Trust Stance

The default should be confirmation-first.

Automatic execution can be introduced later only for scenes the user explicitly promotes to trusted behavior.

## Functional Requirements

### Pairing

- user can connect Angel to a supported home bridge
- user can complete pairing with explicit account linking
- system stores connection status and health

### Scope Selection

- user can pick which rooms Angel may use
- user can pick which lights and players are allowed
- user can see unsupported devices but not grant them

### Scene Management

- system ships with a default scene catalog
- user can enable or disable scenes
- user can map scenes to chosen rooms and devices
- later versions may allow user tuning of light brightness, volume, and audio source

### In-Chat Execution

- Angel can suggest a scene based on ritual context
- user can approve or reject execution
- system confirms outcome in chat without breaking the thread if the action fails

### Logging

- every action attempt is logged with timestamp, scene, room, and outcome
- user can inspect recent actions from settings or relationship tools

### Failure Handling

- device failures never block chat completion
- Angel responds gracefully when the bridge is offline
- if a room is unavailable, Angel should offer a soft fallback rather than retry aggressively

## Non-Functional Requirements

- scene execution must feel fast enough to preserve emotional continuity
- failures must be bounded and observable
- secrets should remain local whenever possible
- the first version must keep support complexity low
- local/offline-friendly paths are preferred where feasible

## Data Model Recommendation

The exact Prisma schema should be finalized later, but the likely entities are:

- `HomeAutomationConnection`
- `HomeAutomationScope`
- `HomeScenePreference`
- `AtmosphereActionLog`
- `AtmosphereSceneExecution`

Recommended field themes:

- provider
- bridge type
- status
- room scope
- allowed entity ids
- confirmation mode
- last heartbeat
- action result
- failure reason

## Service Contract Recommendation

Angel should issue high-level scene requests, not raw device commands.

Example request shape:

```json
{
  "sceneKey": "wind_down",
  "roomKey": "bedroom",
  "reason": "evening_ritual",
  "confirmationMode": "required"
}
```

The bridge translates that into Home Assistant service calls or a Music Assistant action chain.

This keeps Angel's policy layer small and auditable.

## UX Surfaces

### Settings

- connect home bridge
- manage rooms and device scope
- choose confirmation defaults
- view recent atmosphere actions

### Onboarding Or Post-Onboarding Upgrade

- explain the feature as optional
- make the trust boundaries obvious
- do not gate core companionship behind home integration

### Chat

- scene suggestions as lightweight companion prompts
- explicit confirmations
- execution feedback inline in thread

### Relationship Tools

- optional ritual preferences
- preferred room for wind-down or focus
- preferred audio behavior during grounding

## Rollout Plan

### Stage 0. PRD And Design Alignment

Deliverables:

- canonical PRD
- roadmap integration
- scope freeze on V1 scene boundaries

### Stage 1. Technical Spike

Goal:

- prove the bridge architecture

Deliverables:

- one Home Assistant pairing path
- one room-scoped light action
- one room-scoped music action
- local action log prototype

Exit criteria:

- Angel can trigger a bounded scene without raw vendor-specific code in the app

### Stage 2. Internal Alpha

Goal:

- validate the first emotional UX

Deliverables:

- `Wind Down`
- `Ground Me`
- confirmation flows
- failure handling

Exit criteria:

- scenes feel helpful, not creepy
- support burden remains acceptable

### Stage 3. Beta

Goal:

- broaden utility carefully

Deliverables:

- `Deep Focus`
- `Morning Reset`
- room/device preference tuning
- action restore semantics

### Stage 4. Optional Voice Extensions

Goal:

- explore room hardware and ambient invocation later

Possible paths:

- Home Assistant `Assist`
- `Rhasspy`

Rule:

- do not block the core product on wake-word or room-speaker ambition

## Success Metrics

- connection opt-in rate among eligible users
- successful scene execution rate
- repeat scene usage per connected user
- ritual completion uplift
- next-day retention uplift for connected users
- disable rate
- trust-related complaint rate

## Risks

### Creepy Automation Risk

Users may feel watched or manipulated if Angel changes the room without clear invitation.

Mitigation:

- confirmation-first defaults
- strong copy
- visible action history
- quiet hours

### Support Complexity Risk

Home automation ecosystems are messy.

Mitigation:

- support one canonical path first
- center Home Assistant
- keep direct vendor integrations out of V1

### Security Risk

Bridging into the home introduces higher trust requirements than normal chat features.

Mitigation:

- local token storage where possible
- allowlist-only action surface
- no security-critical devices
- pairing, revocation, and heartbeat controls

### Product Drift Risk

Angel could become a generic assistant instead of a companion.

Mitigation:

- require all early use cases to strengthen rituals, tone, or presence
- reject broad household task creep in V1

## Recommendation

Proceed, but only as a later-phase presence feature.

Recommended order:

1. finish the live OpenClaw reply path
2. stabilize push, permissions, and presence beyond the browser
3. build the Home Assistant bridge spike
4. validate two scenes before expanding

`Angel Atmosphere` is promising because it amplifies Angel's companionship thesis.
It becomes a mistake only if it turns into unrestricted smart-home control.

## External References

- Home Assistant voice control / Assist: [home-assistant.io/voice_control](https://www.home-assistant.io/voice_control/)
- Home Assistant conversation API: [developers.home-assistant.io/docs/intent_conversation_api](https://developers.home-assistant.io/docs/intent_conversation_api/)
- Home Assistant REST API: [developers.home-assistant.io/docs/api/rest](https://developers.home-assistant.io/docs/api/rest/)
- Home Assistant Assist pipelines: [developers.home-assistant.io/docs/voice/pipelines](https://developers.home-assistant.io/docs/voice/pipelines/)
- Music Assistant installation and Home Assistant integration overview: [music-assistant.io/installation](https://www.music-assistant.io/installation/)
- Rhasspy overview: [rhasspy.readthedocs.io](https://rhasspy.readthedocs.io/)
- Rhasspy intent handling with Home Assistant: [rhasspy.readthedocs.io/en/latest/intent-handling](https://rhasspy.readthedocs.io/en/latest/intent-handling/)
