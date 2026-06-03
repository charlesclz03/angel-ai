# Angel AI Social Connectors

Purpose:

- explain how official social connections, background scans, and social-derived memory work in local and production environments

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- social connector setup and operations

Last updated:

- 2026-03-24

Related docs:

- `docs/reference/env-vars.md`
- `docs/runbooks/local-development.md`
- `docs/runbooks/provider-verification-matrix.md`
- `docs/architecture/system-map.md`
- `docs/architecture/runtime-flows.md`

## Current Boundary

The social context system is:

- optional
- official OAuth and approved APIs only
- profile metadata plus bounded recent content only
- asynchronous after onboarding completion

The social context system is not:

- scraping
- DMs or private-message ingestion
- follower-graph or friends-list ingestion
- comment or like scraping
- a blocker for `/chat`

## Supported Platforms

| Platform | Current official scope |
| --- | --- |
| `instagram` | official Meta OAuth plus Instagram Business or Creator account data when available |
| `facebook` | official Meta OAuth plus profile and post access when approved scopes allow it |
| `x` | OAuth 2.0 user-context flow plus profile and recent posts |
| `linkedin` | profile-first import; posts remain capability-based and may be limited |
| `tiktok` | Login Kit plus recent videos through official TikTok APIs |

## Required Environment Variables

| Variable | Why it exists |
| --- | --- |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | encrypts provider tokens at rest |
| `SOCIAL_SCAN_WORKER_SECRET` | protects the internal scan worker route |
| `META_APP_ID` / `META_APP_SECRET` | shared Facebook and Instagram OAuth credentials |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | X OAuth credentials |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth credentials |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok OAuth credentials |

Notes:

- if `SOCIAL_TOKEN_ENCRYPTION_KEY` is missing, the app falls back to `NEXTAUTH_SECRET`, but a dedicated key is the intended production setup
- if `SOCIAL_SCAN_WORKER_SECRET` is missing, local development can still process one queued social scan inline during chat loads
- `NEXTAUTH_URL` or `NEXT_PUBLIC_SITE_URL` must be correct so callback URLs and worker kicks resolve cleanly

## Local Callback URLs

Register these exact local URLs in the provider consoles when testing on `http://localhost:3000`:

- `http://localhost:3000/api/social/facebook/callback`
- `http://localhost:3000/api/social/instagram/callback`
- `http://localhost:3000/api/social/x/callback`
- `http://localhost:3000/api/social/linkedin/callback`
- `http://localhost:3000/api/social/tiktok/callback`

## User-Facing Flow

1. the user reaches the optional `social-context` stage at the end of onboarding
2. Angel shows what each connector can import before OAuth starts
3. `startSocialConnect(platform)` writes state cookies and redirects to the provider
4. the callback route exchanges the code, stores encrypted tokens, and links the account
5. onboarding still completes immediately and routes to `/chat`
6. background scan state appears in onboarding and chat as `NOT_CONNECTED`, `CONNECTED`, `SCANNING`, `READY`, `LIMITED`, or `FAILED`

## Background Scan Flow

1. `ConnectedSocialAccount` stores the linked provider state
2. `enqueueInitialSocialScans(userId)` creates `SocialScanJob` rows
3. `kickSocialScanWorker()` calls `/api/internal/social-scan` when the worker secret is configured
4. the worker claims queued jobs, marks the account `SCANNING`, and calls the platform adapter
5. normalized snapshots are upserted into `SocialProfileSnapshot` and `SocialContentSnapshot`
6. social-derived memory is rebuilt for that platform
7. summaries plus `relationship_seed.md` and `session-brief.md` are refreshed
8. the platform status resolves to `READY`, `LIMITED`, or `FAILED`

## Local Development Behavior

If `SOCIAL_SCAN_WORKER_SECRET` is configured:

- scans are kicked through the protected worker route

If `SOCIAL_SCAN_WORKER_SECRET` is missing:

- `loadChatStateForUser()` may inline-process one queued scan for the current user
- this keeps local development usable without standing up a separate worker trigger

## Admin And User Controls

The UI exposes three post-connect actions:

- `Rescan`
- `Delete imported data`
- `Disconnect`

Behavior:

- `Rescan` keeps the connection and queues a fresh import
- `Delete imported data` removes snapshots and social-derived memory, but keeps the connection so it can be rescanned later
- `Disconnect` removes the connection, jobs, snapshots, and social-derived memory for that platform

Both deletion paths refresh summaries and session-primer artifacts immediately.

## Capability-Based Limitations

These are expected, not bugs:

- Instagram may become `LIMITED` when the connected Meta login does not expose an official Business or Creator account
- Facebook post access depends on approved scopes and account capabilities
- LinkedIn currently supports profile-first import; post import depends on product approval

The implementation must degrade to `LIMITED` for unsupported official cases instead of scraping around them.

## Storage Rules

- tokens are stored encrypted
- normalized snapshots are stored long term
- raw provider payloads are not kept as durable storage
- social-derived memory includes `sourceContext.origin = social_scan`, `platform`, `permalink`, and `postedAt` when available

## First Files To Open

- `app/social/actions.ts`
- `app/api/social/[platform]/callback/route.ts`
- `app/api/internal/social-scan/route.ts`
- `lib/social/service.ts`
- `lib/social/connectors.ts`
- `lib/social/memory.ts`
- `components/organisms/AngelOnboardingFlow.tsx`
- `components/organisms/AngelChat.tsx`
