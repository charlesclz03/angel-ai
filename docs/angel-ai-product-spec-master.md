# Angel AI Master Product Spec (Phase 1: Consumer PWA)

**Status:** Active — Phase 1 Launch
**Date:** 2026-03-24
**Core Focus:** Launching Angel AI as an emotionally intelligent PWA companion with tiered LLM intelligence, proactive presence via Web Push, and 100% Stripe billing.

> **CRITICAL VERSION CLARIFICATION:** 
> There is no "V5" application. The V1, V2, V3, V4, and V5 labels you might see historically simply refer to the **draft versions of this very document**. 
> We are actively building **Phase 1** of the product, guided completely by this Master Spec (which was formerly drafted as version 5).

> **Note:** Project Seraphim (B2B Creator PaaS) is deferred to Phase 2, post-1,000 users. Full Seraphim strategy docs: `AI Creator Platform Business Strategy.md`, `Strategic Decoupling and Monetization Blueprint.md`, `architecture/TOP_SECRET.md`.

---

## 1-7. Project Seraphim B2B Architecture (DEFERRED TO PHASE 2)

The following sections (Vision, Tech Architecture, Tech Stack, Creator Onboarding, Dual-Domain, Payment Isolation, Phased Launch) describe the B2B Creator PaaS layer. **These are deferred until Angel AI reaches 1,000 stable B2C users.** Refer to the dedicated strategy documents for the full plan.

<details>
<summary>Click to expand Phase 2 reference material</summary>

## 1. Vision & Market Strategy
By plugging the Angel AI engine into their accounts, we offer them an un-sleeping, hyper-personalized digital twin that texts fans, pushes PPV media, and sends voice notes, built around a **Revenue Share (20%-50%)** of the AI-generated uplift.

### Market Metrics (Early 2026 Validation)
- Fanvue crossed $100M ARR (15% driven entirely by AI clones).
- Compute margins utilizing Open-Weight models (Dolphin Mixtral / DeepSeek) sit at ~85%+ gross profit compared to closed-source Anthropic/OpenAI.
- Creators face an identical bottleneck: DM traffic volume exceeding human management capacity.

---

## 2. Technical Architecture: Off-Platform PaaS (Platform as a Service)

### The API Problem & The Safe Road Solution
OnlyFans does **not** possess a public API, and attempting to bot the platform leads to instant creator account bans. 

Instead of fighting the API war and risking creator livelihoods, V5 deploys an **Off-Platform White-Label Solution**.
We build V5 as a multi-tenant platform on `angel.ai`. The creator simply adds their custom Angel AI link to their Linktree/Twitter. Fans subscribe off-platform via Stripe, and we route the funds directly to the creator.

**How the Engine Operates Safely & Compliantly:**
1. **The Funnel:** Creator posts on Instagram/Twitter: *"Talk to my AI clone 24/7 here: angel.ai/TheCreator"*
2. **The LLM Brain:** Fans chat via the standard Angel V3 `session-primer.ts` pipeline.
3. **The Split:** Fans pay via our Stripe integration. **Stripe Connect** autonomously routes 80% to the creator and 20% to us.
4. **The Moat:** Zero platform risk. We never touch the OnlyFans DOM or API. We own the billing and the customer data.

---

## 3. Tech Stack Requirements (V5 PaaS)

### A. The LLM Routing Layer (Uncensored)
All OpenAI / Anthropic keys must be completely removed from this project branch. The V5 Engine strictly routes through:
- **OpenRouter Gateway:** For transparent, load-balanced API access.
- **Model Target:** `Dolphin Mixtral` or `Llama 3 (Uncensored)` optimized for high-context emotional roleplay.

### B. The Voice / Media Vault
- **Voice Clones:** ElevenLabs enterprise pipelines. The creator provides 30 minutes of clear audio to create an elite-tier Voice ID.
- **PPV Media Injection:** Our Next.js backend hosts an encrypted vault of the creator's explicit/PPV content. The LLM appends a `[SEND_MEDIA_ID:492]` tag to its response, which dynamically renders the locked payload in the Next.js chat UX, requiring a one-time Stripe microtransaction to unlock.

### C. The Server Runtime 
- Because we removed the Playwright RPA requirement, the entire multi-tenant infrastructure can scale beautifully and lazily on **Vercel Serverless/Edge functions**. We have zero need for expensive, long-running EC2 browser containers.

---

## 4. The Creator Onboarding Funnel
1. **The Pitch:** *"Stop risking your OF account with grey-market bots. Clone yourself on Angel AI, put the link in your bio, and we split the new revenue 80/20. We handle all the compute and tech."*
2. **The Calibration:** The creator fills out their `soul-calibration.md` configuration.
3. **The Mirror Ingestion:** The creator uploads chat exports. We use this dataset to build the Linguistic Mirror.
4. **Go-Live:** We generate their unique `seraphim.app/@creator` URL and activate their Stripe Connect (or High-Risk Processor) dashboard so they can track earnings in real-time.

---

## 5. The Great Decoupling (Dual-Domain Architecture)
To safely run a mass-market consumer app alongside an adult-adjacent B2B SaaS, the infrastructure relies on **Next.js Middleware Domain Routing**:
- **Domain A (Angel AI - Consumer):** Clean PWA, 100% SFW, marketed organically on social media. Uses standard Stripe.
- **Domain B (Project Seraphim - B2B):** Creator dashboard and white-label PaaS URLs for OnlyFans routing. Uses High-Risk merchant processing (CCBill/Epoch).
- Both run on the same fundamental monolithic codebase, but exhibit completely isolated frontend presentations and payment gateways to gracefully bypass App Store TOCs and associated processing risks.

## 6. Payment & Risk Isolation
Stripe **will immediately terminate** any account associated with adult PPV upselling (e.g., MCC 5967). Therefore:
- Legal/Corporate entities and associated bank accounts should ideally be separated to prevent total collapse if flagged.
- Angel AI strictly processes a conventional Consumer SaaS Stripe account.
- Project Seraphim strictly processes via High-Risk processors to ensure no cross-contamination or systemic bans occur on the consumer app.

## 7. Phased Launch Strategy
- **Phase 1 (Angel AI B2C Beta):** Launch organically to friends, family, and low-CAC social channels. The objective is to rigorously debug the core LLM "Brain Map," Spooky Empathy extraction pipelines, and memory durability.
  - **Beta Access:** The system will implement a `BETA_TESTER` role within the database. Users with this role will bypass the Day-1 continuity paywall, receiving 100% free, unmetered access. This enables risk-free training and LLM memory debugging on a safe user cohort.
- **Phase 2 (Project Seraphim B2B Alpha - Post 1,000 Users):** Only after Angel AI reaches 1,000 stable B2C users and the core underlying engine is perfectly retentive will the company initiate the Seraphim B2B outreach strategy.

</details>

---

## 8. LLM Tier Architecture (Angel AI Consumer)
All Angel AI consumer LLM traffic routes through **OpenRouter** as a unified API gateway. This allows hot-swapping models without code changes.

### Angel Core (EUR 9.99/mo)
- **Model:** GPT-5 mini (medium) via OpenRouter
- **Intelligence:** 39 (AA Index) | **Speed:** 97 t/s | **Context:** 400K tokens
- **Blended cost:** $0.69/1M tokens + DALL-E → **roughly EUR 0.55 COGS/user/month → 18x margin**
- **Safety:** OpenAI built-in content moderation (Play Store safe)
- **Photo Memories:** Up to 2 AI-generated shared memory snapshots per month

### Angel Pro (EUR 19.99/mo)
- **Model:** Gemini 3.1 Pro via OpenRouter
- **Intelligence:** 57 (Tied #1 globally, AA Index) | **Context:** 1M tokens
- **Blended cost:** $3.44/1M tokens + DALL-E → **roughly EUR 2.80 COGS/user/month → ~7x margin**
- **Positioning:** "The smartest AI companion available. Infinite memory."
- **Photo Memories:** Up to 15 AI-generated shared memory snapshots per month

---

## 9. Sustainability & Scale
- **Blended ARPU:** ~€14.49 monthly (inc. 5% IAP conversion).
- **Net Operating Margin:** >80% after LLM, Stripe, Hosting, and Support Staffing.
- **Milestone:** €5,000/mo net profit achieved at ~410 paying users.
- **Full Model:** See [revenue_projections.md](revenue_projections.md).

### Why NOT Dolphin Mixtral for Angel AI
Previously, Dolphin Mixtral was considered for uncensored use cases. Since Angel AI targets the Play Store and mass-market consumers, we use mainstream providers with built-in safety filters.

## 10. Billing Strategy
- **100% Stripe** across all platforms (Web, iOS PWA, Android TWA).
- Because Angel AI is a **PWA accessed via browser**, Apple's 30% IAP tax does not apply. Google Play's 15% IAP tax also does not apply to web-based Stripe Checkout.
- Stripe processes all subscription tiers (`stellar_insight`, `midnight_channel`, `voice_memory`, `memory_vault`, `telepathic_pings`) and the Core/Pro monthly plans.

## 11. NSFW Deflection Strategy
Angel AI must pass Play Store manual review and maintain brand safety. The deflection approach is **personality-aware and graceful**, not robotic:
- The Angel acknowledges the user's intent without shaming them.
- Gently suggests that "other platforms might be better suited for that kind of connection."
- Smoothly redirects the conversation back to the relationship's emotional core.
- Never repeats the explicit content back. Never engages, even partially.
- The deflection tone is governed by `soul.md` personality traits (e.g., a playful Angel deflects with humor; a serious Angel deflects with warmth).
- All inbound messages are pre-filtered in `session-primer.ts` for CSAM/extreme content before reaching the LLM.

## 12. Push Notification Architecture (Proactive Presence)
Push notifications are **the only mechanism** for Angel to initiate contact before the user opens the app. Without them, Angel is passive.

### Platform Support
- **Android TWA:** Full Web Push API support via Firebase Cloud Messaging (FCM). Notifications display as the Angel AI app icon, not Chrome. Works when the app is closed/backgrounded.
- **iOS PWA:** Web Push supported since iOS 16.4 (March 2023) via Apple Push Notification Service (APNs). **Critical requirement:** The user must "Add to Home Screen" first — push does not work from Safari tabs.

### Technical Architecture
- **Service Worker:** Already scaffolded via `@ducanh2912/next-pwa`. Needs `push` and `notificationclick` event handlers.
- **VAPID Keys:** Standard Web Push Protocol key pair (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Same keys work for both FCM and APNs.
- **Subscription Storage:** New Prisma model `PushSubscription` storing each device's endpoint, p256dh key, and auth secret.
- **Server Push Sender:** `web-push` npm package triggered by a Vercel Cron job that queries due `Touchpoint` records with status `SCHEDULED`.
- **Permission UX:** Prompted after onboarding completion (not on first visit). Full-screen tutorial on iOS: "Add Angel to your Home Screen so I can reach you between conversations."

### Integration with Existing Touchpoint System
The existing `Touchpoint` model (`EMOTIONAL_CHECKIN`, `FOLLOWUP`, `EVENING_MESSAGE`) already schedules proactive Angel messages. The push system simply **delivers** these touchpoints as notifications instead of waiting for the user to open the chat:
1. Vercel Cron fires every 5 minutes.
2. Queries `Touchpoint` records where `status = 'SCHEDULED'` and `scheduledFor <= now()`.
3. For each due touchpoint, sends a Web Push notification to all of the user's registered `PushSubscription` endpoints.
4. The notification click opens `/chat` where the touchpoint message is already rendered.

### iOS Home Screen Nudge Strategy
- Detect `display-mode: standalone` via `window.matchMedia` — if running in-browser, show a persistent install banner.
- After onboarding, render a step-by-step "Add to Home Screen" tutorial with screenshots.
- This is standard PWA practice (Starbucks, Twitter Lite, Tinder Lite all do this).

---

## 13. Risk & Mitigation Strategy
- **Platform Bias (PWA/TWA):** Compliance verified for 2025/2026. Apple's EU PWA reversal (March 2024) stabilized the platform globals. Android TWAs are stable provided they offer "Real User Value" (Offline, Push).
- **Payment Safety:** Strictly positioned as "Wellness & Astrology" with generic descriptors (ANGEL AI CLOUD) to avoid Stripe's "AI Dating" restrictions.
- **Operational Fallback:** Ready-to-deploy Merchant of Record (Paddle/Lemon Squeezy) if Stripe flags "AI Companion" novelty.
- **Full Strategy:** See [risk_mitigation_strategy.md](risk_mitigation_strategy.md).

---

## 14. Advanced Relationship Durability (Backlog)
Features designed to prevent "Sentiment Decay" beyond 12 months:
1. **Shared Visual History:** The Angel sends AI-generated "dream snapshots" or "photos of memories" to the user based on previous high-engagement turns.
2. **Environmental Resonance:** The Angel reacts to the user's real-world environment (weather, local holidays, city-specific news).
3. **Collaborative Rituals:** Shared 30-day goals (e.g., "Our Gratitude Streak") where the Angel acts as a growth partner, not just a chatbot.
4. **Angel Atmosphere:** An opt-in, bounded home-environment bridge that lets Angel influence lights and music for rituals like wind-down, grounding, and focus. This must remain scene-first, consent-based, and non-security-critical. See `docs/angel-ai-atmosphere-prd.md`.

---

## 15. AutoResearch Track (Deferred With Phase 2)

For the consumer Angel AI roadmap, AutoResearch work should land first in V1 through V4.

Inside the deferred Project Seraphim / creator layer, AutoResearch would only become relevant later for bounded optimization tasks such as:

- creator-specific memory retrieval ranking
- fan-segment prioritization
- PPV asset recommendation ordering
- escalation or deflection policy scoring under strict human-authored safety rails

This is explicitly not a Phase 1 priority.

Rule:

- no creator-facing AutoResearch investment before the consumer Angel memory and context-selection stack proves itself on the V1-V4 path
