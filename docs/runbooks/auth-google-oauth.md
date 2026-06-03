# Angel AI Auth And Google OAuth

Purpose:

- document the current auth boundary and local Google OAuth setup

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- auth setup and smoke path

Last updated:

- 2026-03-24

Related docs:

- `lib/auth.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `.env.example`

## Current Auth Role

Auth is used to:

- bridge the onboarding pre-auth flow into durable persistence
- protect `/chat`
- associate onboarding, chat, billing, and memory state with a user

## Required Env Vars

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Local Callback

Use:

- `http://localhost:3000/api/auth/callback/google`

Keep `NEXTAUTH_URL` aligned with the exact local origin you are testing.

## Primary Files

- session helpers: `lib/auth.ts`
- route handler: `app/api/auth/[...nextauth]/route.ts`
- onboarding sign-in handoff: `components/organisms/AngelOnboardingFlow.tsx`

## Smoke Path

1. boot the app locally
2. open `/onboarding`
3. progress into the sign-in step
4. authenticate with Google
5. confirm the onboarding flow resumes instead of restarting
6. finish onboarding and confirm `/chat` becomes available

## Common Failure Modes

- callback URL mismatch
- missing `NEXTAUTH_SECRET`
- testing against a different local origin than `NEXTAUTH_URL`
- Google credentials present but DB auth tables not available

## What Auth Does Not Do

- it does not own billing entitlements
- it does not own onboarding state logic
- it does not own continuity gating

Those behaviors live downstream in onboarding, chat, and billing services.
