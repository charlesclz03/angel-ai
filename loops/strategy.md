# Angel AI Strategy — Updated 2026-04-08

## Mission

AI companion app that feels like a thoughtful friend. Continuity + memory + proactive check-ins.

## What's Built

- Next.js PWA with Prisma + Supabase
- Authenticated onboarding with persistence
- Persistent chat thread with rich attachments
- Voice note transcription
- AI photo memories
- Ritual system
- Social connectors (OAuth set up)
- MessageBubble wrapped in memo ✅ (2026-04-06)

## What's Missing

| Feature | Priority | Why |
|---------|----------|-----|
| OpenClaw reply path | 🔴 | Core product — AI doesn't actually reply yet |
| Real AI responses | 🔴 | Currently using static/dummy responses |
| TWA APK | 🔴 | Distribution — can't publish without APK |
| Vapi/voice AI | 🟡 | Differentiation — voice conversations |
| Real social connector feeds | 🟡 | Content source |
| Push notifications | 🟡 | Retention |

## OpenClaw 4.5 Stack

```
video_generate
├── AI photo memories as video format
└── Rituals with video elements

music_generate
├── Ambient music for rituals
└── Mood-setting audio

Claude CLI MCP bridge
└── Better OpenClaw reply integration
```

## Subscription Model

- Free: basic companion
- Angel Core €9.99/mo: full features
- Angel Pro €19.99/mo: everything + voice + priority

## Top Priority

1. Connect OpenClaw reply path
2. Real AI responses (not dummy)
3. TWA APK build
