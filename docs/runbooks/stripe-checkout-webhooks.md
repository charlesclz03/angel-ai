# Angel AI Stripe Checkout And Webhooks

Purpose:

- document the current billing flow, webhook sync path, and local test expectations

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- billing integration runbook

Last updated:

- 2026-03-24

Related docs:

- `lib/billing/stripe.ts`
- `lib/billing/subscription-sync.ts`
- `app/api/stripe/webhook/route.ts`
- `app/chat/actions.ts`

## Current Billing Model

The chat experience uses:

- billing tiers: `FREE`, `CORE`, `PRO`
- chat access modes: `ACTIVE`, `READ_ONLY`, `SUBSCRIBER`

Billing state is resolved from `Subscription.tier`, with webhook-backed updates as the source of truth.

## Required Env Vars

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_MONTHLY_CORE`
- `STRIPE_PRICE_ID_MONTHLY_PRO`

## Current Flow

1. user hits Core or Pro checkout from `/chat`
2. Stripe checkout session is created for the selected subscription tier
3. user returns to `/chat`
4. webhook events update `Subscription`
5. chat load/send reconciliation re-checks billing state best-effort
6. access mode resolves from the synced tier

## Primary Files

- checkout and portal entry: `app/chat/actions.ts`
- billing helpers: `lib/billing/stripe.ts`
- Stripe event mapping: `lib/billing/subscription-sync.ts`
- webhook route: `app/api/stripe/webhook/route.ts`
- gating logic: `lib/angel/chat-service.ts`

## Local Test Expectations

To fully verify locally, you need:

- valid Stripe env vars
- a reachable webhook route
- a way to forward Stripe events to `/api/stripe/webhook`

## What To Verify

- checkout session opens
- return to `/chat` works
- webhook updates the stored subscription
- gated thread unlocks after sync
- portal opens for an entitled user
- cancellation or expiry moves the thread back to non-subscriber behavior

## Common Failure Modes

- checkout returns successfully but entitlement stays stale because webhook delivery is missing
- secret key present but `STRIPE_WEBHOOK_SECRET` missing
- Core or Pro price id missing
- portal opened for a user with no Stripe customer

## Important Rule

Do not treat the return URL alone as proof of entitlement.
The durable source of truth is the synced `Subscription` row.
