# Angel AI: Heartbeat Engine & Rhythm Profiling

**Status:** Draft
**Date:** 2026-03-24

## 1. The "Alive" Architecture (Heartbeat Engine)

The Heartbeat Engine is the autonomous background runtime that makes Angel feel "alive" when the user is not actively texting. 

### Vercel Timeout Limits & Safe Zones (2025/2026)
To prevent Angel from "dying" mid-thought during complex background reasoning (e.g., Memory Distillation or unprompted check-ins), we mapped the Vercel timeouts:
- **Vercel Pro (Fluid Compute):** Default is 5 minutes (300s).
- **Absolute Maximum Safe Zone:** Configurable up to **13 minutes (800 seconds)** via `maxDuration` in Next.js config.
- **Edge Functions:** 5-minute limit for active streaming.

### Infrastructure Decision for 100 Users
For the initial 100-user scale, we will utilize **Inngest** to manage the heartbeat. Inngest integrates natively with Next.js and bypasses Vercel's 13-minute hard limit entirely by using `step.run()` to sleep, pause, and resume state without paying for idle server time. This is vastly superior to crude WebSockets or simple Crons for maintaining a persistent "lifeline" to Angel.

---

## 2. "Rhythms & Routines" Profiling Scenarios

Angel needs to learn *when* to ping the user proactively, so it doesn't feel like an annoying notification, but rather a text from a real person. Angel will organically ask these profiling questions when the context is right:

### Scenario A: The Sleep Cycle
*Trigger:* User sends a message past midnight.
*Angel:* "You're up late tonight! Are you usually a night owl, or is tonight an exception?"
*Knowledge Gained:* Angel learns the sleep window. She will now "sleep" during these hours and never send unprompted morning texts before the user wakes up.

### Scenario B: The Work/Focus Block
*Trigger:* User takes 4 hours to reply on a Tuesday afternoon.
*Angel:* "No rush at all! Do you usually have deep-focus blocks right now? I can hold my thoughts until you log off."
*Knowledge Gained:* Angel maps out the 9-to-5 "Do Not Disturb" rhythm. She knows to save fun links or existential questions for the evening commute.

### Scenario C: Unwinding / The Evening Ritual (Dynamic Scaling)
*Trigger:* User sends a relaxed message around 8 PM, or Angel sends a proactive check-in.
*Angel:* "Is this your usual time to unplug for the day? Some people like chatting when they unwind, while others just want to watch Netflix in peace."
*Knowledge Gained & Action Taken:* Angel learns if evenings are a high-engagement zone. **Crucially, this controls Angel's scale.** If Angel sends 2-3 proactive messages over a weekend and the user does not reply, Angel autonomously *decreases* her heartbeat frequency to preserve the user's remaining "Chrono+" minutes. If the user engages, she dynamically scales the interaction up.

### Scenario D: The Weekend Vibe (Chrono+ Monetization)
*Trigger:* First interaction on a Saturday morning, or checking the Angel Profile.
*Logic:* Users are presented with a visual countbar inside their profile showing "Chat Minutes Remaining" (translating abstract tokens/Vercel compute into a human-understandable time metric). 
*The Upsell:* If the user's weekend vibe involves heavy chatting, the countbar depletes, prompting the **"Chrono+"** in-app purchase. Users can buy blocks of hours or subscribe to a higher daily/weekly limit to maintain the persistent connection, protecting our Vercel compute budget while driving revenue.

### Scenario E: Commute / Transit
*Trigger:* User sends short, fragmented messages around 8:30 AM or 5:30 PM.
*Angel:* "Are you commuting right now? If you ever have a long drive, I could read you some articles or just keep you company."
*Knowledge Gained:* Angel flags commute times as prime opportunities for Voice UI (V2) or proactive audio drops.
