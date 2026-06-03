# Angel AI Provider Verification Matrix

Purpose:

- centralize the launch-critical verification checklist for runtime and social providers

Audience:

- maintainers
- coding agents

Status:

- active

Source of truth scope:

- provider-specific verification steps and required inputs

Last updated:

- 2026-03-25

Related docs:

- `docs/reference/env-vars.md`
- `docs/runbooks/openclaw-handoff.md`
- `docs/runbooks/social-connectors.md`
- `docs/runbooks/production-keys.md`

## Runtime

| Provider path | Required env | What to verify | Current blocker |
| --- | --- | --- | --- |
| OpenClaw gateway | `OPENCLAW_GATEWAY_URL` when not using localhost | one bounded Angel reply reaches the gateway with curated artifacts only | live gateway target |
| OpenRouter fallback | `OPENROUTER_API_KEY` | one bounded reply succeeds when the gateway fails or is unavailable | real provider key |
| OpenAI audio | `OPENAI_API_KEY` | inbound voice-note transcription and Angel voice preview generation both work against real APIs | real provider key |
| OpenWeatherMap | `OPENWEATHERMAP_API_KEY` | current weather appears in `session-brief.md` when city data exists | real provider key |

## Social Connectors

| Platform | Required env | Production smoke path | Current blocker |
| --- | --- | --- | --- |
| Facebook | `META_APP_ID`, `META_APP_SECRET` | connect, callback, scan, rescan, disconnect, delete imported data | provider app review |
| Instagram | `META_APP_ID`, `META_APP_SECRET` | connect, callback, limited-state handling, scan refresh | provider app review |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET` | connect, callback, recent-post import, rescan, disconnect | provider app review |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | profile-first connect, callback, limited-state handling, delete imported data | provider app review |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | connect, callback, recent-video import, rescan, disconnect | provider app review |

## Exit Criteria

- one real OpenClaw or OpenRouter reply succeeds end-to-end with the bounded handoff
- each social provider completes its production smoke path without falling back to scraping or raw-payload storage
- audio and weather providers are verified with their real keys instead of the local fallbacks
