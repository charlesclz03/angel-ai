# Angel AI Research Loop

Based on: karpathy/autoresearch pointer philosophy

## What It Is

Research agent for Angel AI. Tracks user engagement, features, and improvements.

## Loop

```
1. READ
   └── Code state (what's built)
   └── docs/angel-ai-progress-log.md
   └── docs/angel-ai-next-steps.md
   └── User feedback (if any)

2. RESEARCH
   └── AI companion market trends
   └── Competitor features
   └── User engagement patterns
   └── GitHub: AI companion apps, personality AI

3. UPDATE
   └── strategy.md
   └── feature-priorities.md
   └── engagement-log.md

4. ACT
   └── OpenClaw reply path integration
   └── TWA APK build
   └── Social connector setup
```

## Files

| File | Role |
|------|------|
| `loops/strategy.md` | Current priorities |
| `loops/feature-priorities.md` | Feature backlog ranked |
| `loops/engagement-log.md` | User engagement data |

## Current State (2026-04-08)

- Next.js PWA with Prisma + Supabase
- Authenticated onboarding + persistent chat
- MessageBubble wrapped in memo ✅
- OpenClaw reply path: NOT connected
- TWA APK: NOT built
- Social connectors: OAuth set up but not live

## Top Priority

1. Connect OpenClaw reply path (this is the core product)
2. Real AI responses (currently using dummy/static responses)
3. TWA APK for Android distribution

## Questions to Answer

- [ ] What's the actual retention rate?
- [ ] What do users say in reviews?
- [ ] Is the subscription model working?
- [ ] Voice AI integration (Vapi or similar)?
