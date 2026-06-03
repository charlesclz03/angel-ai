# Angel AI Open-Source Repo Shortlist

Purpose:

- capture a practical shortlist of free public repos that could be imported, adapted, or mined to improve Angel AI in its current state

Audience:

- founders
- maintainers
- coding agents planning the next implementation slices

Status:

- archive

Source of truth scope:

- external OSS research and implementation inspiration

Last updated:

- 2026-03-24

Related docs:

- `docs/README.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`
- `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`
- `docs/archive/research/angel-ai-safe-oss-skills-workflows-report-2026-03-24.md`

Snapshot date: 2026-03-24

## How To Read This

This is not literally every public repo on GitHub.

It is a curated shortlist of the highest-signal free public repos I found via GitHub pages surfaced through live web research on 2026-03-24, filtered for Angel AI's current stack and roadmap:

- Next.js
- TypeScript
- Tailwind
- Prisma / Supabase
- Stripe
- PWA / push
- admin operations
- safety, security, and performance

## Adoption Rule

Use these buckets:

- `Direct copy/import`
  Best fit for MIT or Apache repos with code that can be copied or adapted into Angel safely.
- `Pattern mining only`
  Good reference architecture, but not ideal to drop in wholesale.
- `Review license first`
  Public and free to inspect, but confirm the exact license before copying source directly.
- `Open-core caution`
  Public repos with enterprise/commercial carve-outs. Mine only the clearly open parts.

## Best Immediate Targets

If Angel AI only borrows from a few repos next, start here:

1. [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
   For an internal admin surface, notifications center patterns, billing/settings IA, and a cleaner dashboard information architecture.
2. [premieroctet/next-admin](https://github.com/premieroctet/next-admin)
   For a real Prisma-backed internal admin over users, memory rows, touchpoints, subscriptions, and moderation/support operations.
3. [KolbySisk/next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter)
   For cleaner Stripe webhook, pricing, and subscription-management patterns aligned with Supabase.
4. [bcanfield/nextjs-pwa-webpush-template](https://github.com/bcanfield/nextjs-pwa-webpush-template)
   For install prompt, VAPID, service-worker push flow, generated icons, and Apple splash handling.
5. [upstash/ratelimit-js](https://github.com/upstash/ratelimit-js)
   For route protection around chat sends, auth, webhooks, uploads, and push endpoints.
6. [nibtime/next-safe-middleware](https://github.com/nibtime/next-safe-middleware)
   For strict CSP and reporting.
7. [pompelmi/pompelmi](https://github.com/pompelmi/pompelmi)
   For safer image, audio, and file-upload scanning.
8. [Umami](https://github.com/umami-software/umami)
   For privacy-friendly product analytics without making Angel feel surveillance-heavy.

## Repo Matrix

### 1. UI, Design, and UX

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Direct copy/import | MIT | Angel already lives in the shadcn/Tailwind world. This stays the baseline for accessible primitives and registry patterns. | accessible primitives, table/form/dialog patterns, registry workflow |
| [PageAI-Pro/page-ui](https://github.com/PageAI-Pro/page-ui) | Direct copy/import | MIT | Angel still needs stronger landing and marketing surfaces that feel more premium than default SaaS blocks. | hero/CTA/testimonial/FAQ sections, landing-page spacing, conversion-oriented layouts |
| [ibelick/motion-primitives](https://github.com/ibelick/motion-primitives) | Direct copy/import | MIT | Angel's UI should feel intimate and alive, but not noisy. This is good for subtle premium motion. | staggered reveals, animated text, hover transitions, calm motion wrappers |
| [shadcnstudio/shadcn-studio](https://github.com/shadcnstudio/shadcn-studio) | Direct copy/import | MIT | Useful for accelerating themed variants and blocks without drifting into generic AI SaaS styling. | theme ideas, block variants, component combinations |
| [seraui/seraui](https://github.com/seraui/seraui) | Direct copy/import | MIT | Good source of decorative but still practical interaction patterns. | animated decorative components, richer UI accents |
| [shadcnstore/shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template) | Direct copy/import | MIT | Strong source for a more coherent landing page + dashboard pairing. | dashboard shell, settings layouts, marketing/admin visual consistency |
| [TailAdmin/free-nextjs-admin-dashboard](https://github.com/TailAdmin/free-nextjs-admin-dashboard) | Direct copy/import | MIT | Useful if Angel wants more standard operational/admin pages quickly. | charts, tables, admin cards, support-facing layout patterns |

### 2. Admin Dashboard, Operations, and Internal Tools

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [premieroctet/next-admin](https://github.com/premieroctet/next-admin) | Direct copy/import | MIT | This is the strongest match for a Prisma-native Angel operations panel. | CRUD over Prisma models, relationship-aware forms, admin routing |
| [marmelab/shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit) | Direct copy/import | MIT | Good for admin UX patterns if a fully generated Prisma admin feels too blunt. | admin shell, tables, filters, bulk actions, resource abstractions |
| [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) | Direct copy/import | MIT | Great for a human operator console over users, threads, memory, touchpoints, notifications, and billing state. | notifications center, workspace IA, settings pages, charts, command palette |
| [nemanjam/nextjs-prisma-boilerplate](https://github.com/nemanjam/nextjs-prisma-boilerplate) | Pattern mining only | Public repo; verify exact license before code copy | Less stylistically aligned, but strong for CI, testing, and deployment structure around a Prisma stack. | CI/CD shape, Docker setup, test matrix, repo hygiene |

### 3. Payments, Billing, Email, and SaaS Flow

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [KolbySisk/next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter) | Direct copy/import | MIT | Best direct fit for Angel's current Stripe + Supabase architecture. | Stripe fixtures, webhook flow, subscription pages, billing management |
| [ShenSeanChen/launch-mvp-stripe-nextjs-supabase](https://github.com/ShenSeanChen/launch-mvp-stripe-nextjs-supabase) | Review license first | Public repo; verify before copying source | Good source for Stripe + Supabase + Resend workflow wiring and email automation ideas. | email automations, billing emails, Supabase triggers, MCP config ideas |
| [vercel/nextjs-subscription-payments](https://github.com/vercel/nextjs-subscription-payments) | Pattern mining only | Public archived template | Still useful as a reference, but it is archived and should not be the main base. | older subscription flow conventions, Supabase/Vercel handoff patterns |
| [resend/react-email](https://github.com/resend/react-email) | Direct copy/import | MIT | Angel will likely need better billing, onboarding, and lifecycle emails. | composable email templates, transactional email UI, dark-mode-safe email patterns |

### 4. Auth, User Management, and Data Access

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [prisma/nextjs-auth-starter](https://github.com/prisma/nextjs-auth-starter) | Pattern mining only | Public repo from Prisma | Good for tightening Auth.js + Prisma conventions in a clean small example. | auth structure, CRUD examples, Prisma auth separation |
| [allenarduino/nextjs-prisma-auth-boilerplate](https://github.com/allenarduino/nextjs-prisma-auth-boilerplate) | Direct copy/import | MIT | Useful if Angel expands beyond Google OAuth into richer account-recovery or email verification flows. | password reset, email verification, protected-route patterns, auth dashboard UI |
| [Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template) | Review license first | Public repo; surfaced license not confirmed in this pass | Strong source for user management, file storage, RLS, MFA, and secure file storage policies. | RLS policies, MFA ideas, file storage policy layout, legal/compliance pages |

### 5. PWA, Push, and Installability

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [bcanfield/nextjs-pwa-webpush-template](https://github.com/bcanfield/nextjs-pwa-webpush-template) | Review license first | Public repo; verify before copying source | Very high fit for Angel's next PWA push slice. | `worker/index.ts`, VAPID flow, install prompt, icon generation, Apple splash handling |
| [AjayKanniyappan/nextjs-pwa-template](https://github.com/AjayKanniyappan/nextjs-pwa-template) | Review license first | Public repo; verify before copying source | Broader PWA starter worth mining if Angel wants extra install/offline polish. | offline pages, app-shell patterns, commit hooks, PWA structure |

### 6. Security, Abuse Resistance, and Safer Uploads

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [upstash/ratelimit-js](https://github.com/upstash/ratelimit-js) | Direct copy/import | MIT | Angel needs protection on chat sends, upload endpoints, auth, and webhook abuse surfaces. | sliding-window limiter wrappers, serverless-safe rate limiting |
| [nibtime/next-safe-middleware](https://github.com/nibtime/next-safe-middleware) | Direct copy/import | MIT | Excellent fit for strict CSP, CSP reporting, and defense-in-depth. | CSP middleware, nonce flow, reporting endpoint patterns |
| [pompelmi/pompelmi](https://github.com/pompelmi/pompelmi) | Direct copy/import | MIT | Angel handles media and should treat uploads as hostile by default. | file scanning pipeline, Next upload adapter, quarantine flow ideas |
| [Infisical/infisical](https://github.com/Infisical/infisical) | Open-core caution | MIT except enterprise directories | Useful for secrets-management patterns and secret scanning discipline. | secret scanning process, env hygiene, self-hosted secrets patterns |

### 7. Files, Media, and Rich Input

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [transloadit/uppy](https://github.com/transloadit/uppy) | Direct copy/import | MIT | Best mature OSS uploader for future durable media flow. | drag-drop UX, resumable upload patterns, metadata editing, accessibility |

### 8. Background Jobs, Touchpoints, and Notification Infrastructure

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Direct copy/import | Apache-2.0 | Strong fit once Angel's touchpoints, push sends, and memory jobs outgrow best-effort background work. | durable tasks, retries, cron, run tracing, human-in-the-loop review points |
| [novuhq/novu](https://github.com/novuhq/novu) | Open-core caution | MIT core with enterprise carve-outs | Very useful for understanding notification inbox, preferences, multi-channel orchestration, and digest logic. | inbox UX, preferences model, digest ideas, workflow model |

### 9. Analytics, Performance, and Product Insight

| Repo | Bucket | License | Why It Fits Angel AI | Best Things To Copy |
|---|---|---|---|---|
| [umami-software/umami](https://github.com/umami-software/umami) | Direct copy/import | MIT | Clean, privacy-minded analytics for a product that should avoid creepy growth mechanics. | event naming, privacy posture, lightweight analytics infrastructure |
| [PostHog/posthog](https://github.com/PostHog/posthog) | Open-core caution | MIT expat except `ee` | Valuable for feature flags, session replay, experiments, and rich product telemetry if Angel matures into heavier ops. | feature flag architecture, experiment workflow, instrumentation ideas |

## What Each Repo Solves For Angel Right Now

### Highest-value direct adoptions

- internal admin dashboard:
  - `next-admin`
  - `next-shadcn-dashboard-starter`
  - `shadcn-admin-kit`
- Stripe and billing hardening:
  - `next-supabase-stripe-starter`
  - `react-email`
- PWA push and install UX:
  - `nextjs-pwa-webpush-template`
- security hardening:
  - `upstash/ratelimit-js`
  - `next-safe-middleware`
  - `pompelmi`
- product analytics:
  - `umami`

### Best UI/style mining

- `page-ui`
- `motion-primitives`
- `shadcn-studio`
- `shadcn-dashboard-landing-template`

### Best longer-term infrastructure references

- `trigger.dev`
- `novu`
- `posthog`
- `infisical`

## Suggested Adoption Order

1. Add internal admin over users, conversations, memory, touchpoints, subscriptions, and social scan state.
   Preferred sources: `next-admin` plus visual patterns from `next-shadcn-dashboard-starter`.
2. Implement web push with real install UX and generated PWA assets.
   Preferred source: `nextjs-pwa-webpush-template`.
3. Harden public endpoints and upload surfaces.
   Preferred sources: `upstash/ratelimit-js`, `next-safe-middleware`, `pompelmi`.
4. Tighten Stripe and lifecycle email flows.
   Preferred sources: `next-supabase-stripe-starter`, `react-email`.
5. Improve admin/marketing UX quality.
   Preferred sources: `page-ui`, `motion-primitives`, `shadcn-studio`.
6. Add privacy-friendly analytics.
   Preferred source: `umami`.
7. Only after that, consider heavier orchestration or notification infrastructure.
   Preferred references: `trigger.dev`, `novu`, `posthog`.

## What I Would Not Do Yet

- do not replace the current Angel product shell with a generic admin template wholesale
- do not import open-core repos blindly without checking which directories are actually under permissive terms
- do not adopt a full notification platform before Angel's own push and touchpoint model is stable
- do not switch auth stacks unless a concrete product requirement forces it

## Best Next Action

The best practical next move is a focused import plan, not another broad research pass:

1. build an internal `admin/` area using `next-admin` or `next-shadcn-dashboard-starter`
2. lift the push/install flow from `nextjs-pwa-webpush-template`
3. add `upstash/ratelimit-js`, `next-safe-middleware`, and `pompelmi`
4. tighten billing and lifecycle email UX using `next-supabase-stripe-starter` and `react-email`

## Source Notes

This list was assembled from live GitHub repository pages surfaced through web search on 2026-03-24.
Where a repo's exact license was not clearly surfaced in the captured page, it is marked `Review license first`.
