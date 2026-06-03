# Production Keys & Social Scopes

## Vercel Environment Variables Needed
Before launching V1, the following environment variables MUST be set in Vercel to unlock real social snapshots, storage, and payment webhooks.

### Core LLM Routing
- `OPENROUTER_API_KEY`: API key for the OpenRouter gateway.
  - Used in: `lib/angel/openrouter-runtime.ts`
  - Required for: Angel Core (GPT-5 mini) and Angel Pro (Gemini 3.1 Pro) API calls.
- `OPENAI_API_KEY`: Enables higher-quality voice-note transcription, bounded Angel voice previews, and AI photo memories.
- `OPENWEATHERMAP_API_KEY`: Optional weather provider key for live environmental context inside the bounded `session-brief.md`.

### App Integrations
- `SOCIAL_TOKEN_ENCRYPTION_KEY`: 32-byte hex string used to encrypt OAuth refresh tokens statically in the Prisma database.
- `SOCIAL_SCAN_WORKER_SECRET`: Internal bearer token protecting the Vercel internal cron scan webhooks.

---

## Social Connector App Reviews
When applying for production scopes across platforms, guarantee you provide the accurate **Callback URIs**:
`https://[YOUR_DOMAIN].com/api/auth/callback/[provider]` 
(Specifically replacing `[YOUR_DOMAIN]` with your production PWA domain).

### 1. Facebook & Instagram (Meta for Developers)
- **App ID Env**: `META_APP_ID`, `META_APP_SECRET`
- **Required Scopes (Read-Only)**: `instagram_basic`, `instagram_manage_insights` (if applicable for creators), `pages_show_list`.
- **Review Notes**: Explain that Angel AI strictly maps historical public metrics (not messaging DMs) exclusively to create offline reflective journals for end consumers.

### 2. X (Twitter Developer Platform)
- **App ID Env**: `X_CLIENT_ID`, `X_CLIENT_SECRET`
- **Required Scopes (Read-Only)**: `tweet.read`, `users.read`, `offline.access`
- **Review Notes**: We only consume public-facing timelines. No write permissions are collected.

### 3. LinkedIn (Developers)
- **App ID Env**: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- **Required Scopes (Read-Only)**: `r_liteprofile`, `r_emailaddress`, `r_organization_social` (optional)

### 4. TikTok (Developers)
- **App ID Env**: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- **Required Scopes (Read-Only)**: `user.info.basic`, `video.list`
