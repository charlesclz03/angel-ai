# ADR 0005: Atmosphere Bridge Through Home Assistant

Status:

- accepted for planning

Date:

- 2026-03-24

## Context

Angel Atmosphere needs a way to affect lights and music during rituals without turning the main product into a brittle smart-home controller.

We need an approach that:

- respects the PWA/cloud architecture
- works without raw browser LAN discovery
- keeps home credentials local where possible
- stays bounded to emotionally motivated scenes

## Decision

- `Home Assistant` is the canonical home-automation control plane for V1
- `Music Assistant` is the preferred optional music layer when available
- Angel will use a user-installed local bridge rather than direct browser-to-device control
- the bridge will initiate outbound communication to Angel Cloud to claim work
- Angel Cloud will send bounded scene requests, not arbitrary device commands
- V1 scenes are limited to lights and music

## Consequences

### Positive

- the cloud app stays simple and secure
- local home secrets do not need to live in Angel Cloud
- the feature works even when the user is not physically on the same WiFi
- logs, retries, and failure handling become more manageable

### Negative

- requires a bridge install step
- introduces one extra moving part
- scene execution is slightly more complex than direct cloud API calls

## Rejected Alternatives

### Direct browser-to-LAN control

Rejected because it depends too heavily on local-network conditions and weakens the trust boundary.

### Cloud stores Home Assistant tokens and calls HA directly

Rejected as the default because it centralizes more sensitive home credentials than necessary.

### Direct vendor integrations first

Rejected because it creates avoidable complexity before the emotional UX has even been validated.

## Follow-On Docs

- `docs/angel-ai-atmosphere-prd.md`
- `docs/architecture/atmosphere-bridge-architecture.md`
- `docs/architecture/atmosphere-data-model.md`
- `docs/architecture/atmosphere-api-contracts.md`
