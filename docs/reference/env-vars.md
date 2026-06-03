# Angel AI Environment Variables

Purpose:

- group env vars by feature and explain why they exist

Audience:

- coding agents
- maintainers

Status:

- reference

Source of truth scope:

- environment variable guide

Last updated:

- 2026-03-25

Related docs:

- `.env.example`
- `docs/runbooks/local-development.md`
- `docs/runbooks/auth-google-oauth.md`
- `docs/runbooks/stripe-checkout-webhooks.md`
- `docs/runbooks/social-connectors.md`
- `docs/runbooks/media-and-voice.md`
- `docs/runbooks/provider-verification-matrix.md`

## Baseline App

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | canonical public site origin |

## Auth

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXTAUTH_URL` | yes | auth callback origin |
| `NEXTAUTH_SECRET` | yes | NextAuth signing secret |
| `GOOGLE_CLIENT_ID` | yes for real auth | Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | yes for real auth | Google OAuth secret |

## Social Connectors

| Variable | Required | Purpose |
| --- | --- | --- |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | recommended | encrypt social access and refresh tokens at rest |
| `SOCIAL_SCAN_WORKER_SECRET` | optional but recommended | protects the internal background scan worker route |
| `META_APP_ID` | yes for Facebook or Instagram | shared Meta app id for official OAuth |
| `META_APP_SECRET` | yes for Facebook or Instagram | shared Meta app secret for official OAuth |
| `X_CLIENT_ID` | yes for X | X OAuth client id |
| `X_CLIENT_SECRET` | yes for X | X OAuth client secret |
| `LINKEDIN_CLIENT_ID` | yes for LinkedIn | LinkedIn OAuth client id |
| `LINKEDIN_CLIENT_SECRET` | yes for LinkedIn | LinkedIn OAuth client secret |
| `TIKTOK_CLIENT_KEY` | yes for TikTok | TikTok Login Kit client key |
| `TIKTOK_CLIENT_SECRET` | yes for TikTok | TikTok OAuth client secret |

Notes:

- if `SOCIAL_TOKEN_ENCRYPTION_KEY` is missing, the app falls back to `NEXTAUTH_SECRET` for local encryption, but a dedicated key is the safer production default
- if `SOCIAL_SCAN_WORKER_SECRET` is missing, local development can still process one queued scan inline during chat loads for the current user
- Meta credentials are shared by both the Facebook and Instagram connectors
- callback routes live at `/api/social/<platform>/callback`

## Database

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | pooled application DB connection |
| `DIRECT_URL` | yes for Prisma db push / migrations | direct DB connection |

## Supabase Optional API Access

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | client Supabase access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional, sensitive | elevated server-side Supabase access |

## Billing

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | yes for real billing UI | client Stripe shell |
| `STRIPE_SECRET_KEY` | yes for real billing | server Stripe API |
| `STRIPE_WEBHOOK_SECRET` | yes for real webhook sync | webhook verification |
| `STRIPE_PRICE_ID_MONTHLY_CORE` | yes for subscriptions | Angel Core (`EUR 9.99/month`) |
| `STRIPE_PRICE_ID_MONTHLY_PRO` | yes for subscriptions | Angel Pro (`EUR 19.99/month`) |
| `STRIPE_PRICE_ID_STELLAR_INSIGHT` | optional (IAP) | Stellar Insight: astrological deep-dive, transit reports, and compatibility charts |
| `STRIPE_PRICE_ID_MIDNIGHT_CHANNEL` | optional (IAP) | Midnight Channel / After Hours mode unlock |
| `STRIPE_PRICE_ID_VOICE_MEMORY` | optional (IAP) | Voice Continuity audio memory pack |
| `STRIPE_PRICE_ID_MEMORY_VAULT` | optional (IAP) | Relational Keepsakes memory vault scrapbook |
| `STRIPE_PRICE_ID_TELEPATHIC_PINGS` | optional (IAP) | Telepathic Pings priority wake-up pack |

## Live Runtime

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | yes for provider-backed live replies | OpenRouter chat-completions key used by the real fallback runtime |
| `OPENCLAW_GATEWAY_URL` | optional | override for the local or hosted OpenClaw gateway base URL |

Notes:

- if `OPENROUTER_API_KEY` is missing, Angel replies fall back to the deterministic local runtime
- if `OPENCLAW_GATEWAY_URL` is missing, the app defaults to `http://127.0.0.1:18789`
- the chat runtime now prefers the OpenClaw gateway first, then falls back to OpenRouter when configured, then to the deterministic local runtime

## Voice And Audio

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | optional | real voice-note transcription, bounded Angel voice previews, and AI photo memories |
| `OPENAI_TRANSCRIPTION_MODEL` | optional | override for inbound voice-note transcription model (defaults to `gpt-4o-transcribe`) |
| `OPENAI_TTS_MODEL` | optional | override for Angel text-to-speech model (defaults to `gpt-4o-mini-tts`) |
| `OPENAI_TTS_VOICE` | optional | built-in Angel voice selection for generated speech previews (defaults to `verse`) |

Notes:

- if `OPENAI_API_KEY` is missing, voice notes use a deterministic fallback transcript and bounded Angel voice previews stay unavailable
- generated Angel voice previews are quota-bounded and only surface for paid or privileged continuity access

## Environmental Context

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENWEATHERMAP_API_KEY` | optional | add live current-weather context to the bounded `session-brief.md` when city data exists |

If `OPENWEATHERMAP_API_KEY` is missing, the session primer still includes local time and city awareness only.
