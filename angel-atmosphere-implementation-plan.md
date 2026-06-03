# Angel Atmosphere Implementation Plan

## Goal
Land a bounded first implementation of Angel Atmosphere that can pair with a Home Assistant-backed bridge, run `WIND_DOWN` and `GROUND_ME`, and log outcomes without disturbing the current OpenClaw-first roadmap.

## Tasks
- [ ] Add schema enums and models for connections, pairing sessions, room scopes, scene preferences, and executions. -> Verify: `prisma/schema.prisma` reflects the proposal in `docs/architecture/atmosphere-data-model.md`.
- [ ] Build cloud-side pairing and settings services under `lib/atmosphere/` with authenticated app endpoints. -> Verify: API shapes match `docs/architecture/atmosphere-api-contracts.md`.
- [ ] Add settings UI for connection state, room scope selection, scene preferences, and action history. -> Verify: a signed-in user can view and edit Atmosphere settings locally.
- [ ] Build the first bridge prototype with pairing, heartbeat, command claim, and result reporting. -> Verify: the bridge can pair and report healthy status to the app.
- [ ] Implement scene policy and execution creation for `WIND_DOWN` and `GROUND_ME`. -> Verify: a chat or settings action creates a queued execution row with bounded payload.
- [ ] Implement Home Assistant action translation and optional Music Assistant playback handling inside the bridge. -> Verify: a claimed execution can dim lights or pause/start music in a test environment.
- [ ] Add action-result rendering and graceful fallback copy in chat/settings. -> Verify: success, partial success, and offline failure all produce understandable UI states.
- [ ] Add focused tests for pairing, command claim, execution state transitions, and permission failures. -> Verify: targeted tests pass and cover the core Atmosphere flow.
- [ ] Run full verification only when code lands; until then keep docs and implementation synced. -> Verify: `npm run type-check`, `npm test`, `npm run lint`, and `npm run build` pass after the feature slice is implemented.

## Done When
- [ ] The implementation matches the PRD, architecture, schema, and API docs.
- [ ] The first two scenes work only through bounded room/device scopes.
- [ ] No Home Assistant tokens are stored in Angel Cloud.
- [ ] The feature still sits behind the current OpenClaw and presence-hardening priorities.

## Notes
- Start with a Home Assistant add-on or Docker bridge, not direct vendor integrations.
- Do not add wake word, arbitrary service calls, or security-critical device categories in the first slice.
