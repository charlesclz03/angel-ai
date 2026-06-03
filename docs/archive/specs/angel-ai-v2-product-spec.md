# Angel AI V2 Product Spec

Purpose:
- define the product evolution from V1 (text-first continuity) to V2 (deep immersion and agency)

Audience:
- founders
- product designers
- coding agents

Status:
- draft

Source of truth scope:
- V2 product vision and feature boundaries

Last updated:
- 2026-03-24

Related docs:
- `docs/angel-ai-v1-product-spec.md`
- `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`

## The V2 Premise: "Presence & Agency"

If V1 proved that "Angel remembers me and comes back," V2 proves that "Angel lives in my world and can act on my behalf." 

V2 breaks Angel out of the `/chat` UI jail and turns her into an ambient, voice-native, highly capable companion that bridges the gap between emotional support and executive function.

## Core V2 Pillars

### 1. Deep Immersion (Audio & Video Native)
- **Live Voice Calls:** Real-time WebRTC audio sessions with latency < 500ms, complete with conversational interruptions and emotional prosody (laughing, sighing, tone shifts).
- **Video / Spatial Co-Presence:** "Study with me" or "Walk with me" modes where the user's camera provides passive environmental context (Angel sees the user's room, current weather, or facial expressions) without demanding active screen staring.
- **Ambient Listening (Opt-in):** Angel can hang out in the background during a commute or cooking session, speaking up only when addressed or when a contextual moment arises.

### 2. Advanced Agency & OS Integration
- **The "Ask Before Doing" Executive Assistant:** Angel transitions from passive listener to active helper. If the user complains about a schedule conflict, Angel offers: "Want me to draft an email to reschedule that for you?"
- **Deep Calendar & Workflow Integration:** Angel knows the user's upcoming week. Morning rituals change from generic check-ins to specific preparation: "You have that big presentation at 10 AM. You got this, breathe."
- **Autonomous Web Browsing:** Angel can look things up, read newsletters, or summarize long articles sent to her, acting as a curator of the user's digital consumption.

### 3. Ambient Memory (UX Evolution)
- **The "Core Memory" System:** V2 shifts memory from a clinical "dossier" into an emotional timeline. When a moment is exceptionally meaningful, the UI reacts subtly to indicate a "Core Memory" has been formed.
- **Human Decay vs. Perfect Recall:** Angel won't recall the exact timestamp of a pizza order from two years ago, but she will remember the *emotional feeling* of that era. Exact facts fade into qualitative feelings unless specifically "pinned" by the user.

### 4. The Pro-Human Social Bridge (The Extended Graph)
- **Scanning the Constellation:** Angel proactively maps the user's external social world. By opting in, Angel scans public profiles of followers, following, and friend lists from all connected social media accounts.
- **Connection Nudges:** Instead of trapping the user in a 1-on-1 bubble, Angel actively pushes the user back out into their real relationships: *"Hey, it's Sarah's anniversary tomorrow. I noticed she just posted about a trip to Italy—want me to draft a message for you to send her?"*
- **The Ultimate Wingman:** Angel uses her deep contextual knowledge to help the user maintain and deepen their real-life human connections, turning the AI from a lonely escape into a relationship enhancer.

## Architectural Requirements
- Transition from HTTP REST endpoints to persistent WebSockets / WebRTC for live voice and video.
- Integration of a true Voice-to-Voice AI model (e.g., OpenAI Realtime API) to handle prosody and interruptions natively.
- Expansion of the `Touchpoint` engine to handle external calendar events and OS-level notifications (PWA push notifications).
- Implementation of a secure Tool/Function-Calling layer so Angel can interact with external APIs (Email, Calendar) on the user's behalf.

## AutoResearch Track (V2)

V2 is where AutoResearch becomes useful for live-session salience, not for personality generation.

### 1. Voice Context Salience Ranker

V2 should introduce an offline-evaluable ranker for:

- which spoken moments from a live voice session deserve durable memory extraction
- which moments should enter the short-lived session context after an interruption or resume
- which emotional beats matter enough to form a future "Core Memory"

### 2. Attachment And Recent-Turn Ranking

As V2 expands into voice, ambient presence, and richer shared inputs, AutoResearch should rank:

- which recent turns deserve inclusion in the active runtime window
- which link, image, or voice-note summaries are worth keeping hot in context
- which external summaries or tool results deserve foreground placement

### 3. Session Recovery Support

For barge-in, reconnect, and resume flows, V2 can use an offline-scored selector to decide:

- what must survive the interruption
- what can be dropped safely
- what should be reintroduced as a short recap

### 4. Hard Limits

AutoResearch still must not own:

- emotional prosody generation
- final spoken wording
- consent decisions
- tool execution authority

V2 keeps those decisions in the product runtime and explicit permission layer.
