# Billing Architecture & Descriptors

## Stripe Foundations
Angel AI enforces rigid compliance over content consumption. The primary revenue architecture utilizes **Stripe** to process Continuity paywalls.

### Financial Tiers (EUR)
- **Angel Free**: Restricted daily read-only renewal loop.
- **Angel Core**: `EUR 9.99 / month` — Backed by GPT-5-mini via OpenRouter.
- **Angel Pro**: `EUR 19.99 / month` — Backed by Gemini 3.1 Pro via OpenRouter.
- **Microtransactions**: `Chrono+`, `Voice Memory`, `Telepathic Pings` ranging from `2.99` - `5.99`.

### Statement Descriptors
For compliance against high chargeback ratios and maintaining good standing:
- **Statement Descriptor**: `ANGEL AI CLOUD`
- **Short Descriptor**: `ANGEL AI`

> **Note**: Avoid words like "Bot", "AI Chat", or "Girlfriend" in the descriptor. We strictly position as a "Wellness/Continuity Companion" to maintain standard SaaS categorizations over adult/novelty high-risk merchant coding.

---

## Merchant Fallback (Paddle / Lemon Squeezy)
If Stripe enforces stricter policies regarding AI interaction or considers the platform out of policy, the engine is abstracted out from raw webhooks. 
- You MUST immediately swap the `Subscription` logic in `lib/billing/types.ts` to map explicitly to Paddle's API.
- All entitlements are granted during checkout `success` event hooks. The abstraction ensures that replacing Stripe with Lemon Squeezy simply requires rewriting `app/api/stripe/webhook/route.ts` into `/api/merchant/webhook/route.ts` and extracting the `subscription_status = active` payload safely.
