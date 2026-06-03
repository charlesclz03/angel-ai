# Angel AI V1 Product Spec

## Product Positioning

Angel AI is a chat-based companion app designed to feel like a friend living abroad: someone you text every day, open up to, send links and images to, and gradually build a bond with over time.

V1 positioning:

- Friend-first companion
- Can slowly become romantic
- PWA-first on Android
- 18+ product
- Google Play category: Communications
- Non-explicit on-platform experience

Angel AI should not present itself as a dating app, an adult app, or a utility assistant. It is a relationship product with practical support layered in.

## Core Product Fantasy

The user should feel like they are not merely opening a chatbot. They are getting to know someone.

The desired emotional outcome:

- Angel feels alive
- Angel remembers
- Angel reaches out first sometimes
- Angel develops a recognizable personality
- The connection grows naturally instead of jumping to intimacy

The astral layer is part of the emotional texture, not the entire proposition. It should help the companion feel uncannily resonant, even for users who are not familiar with astrology.

Chosen visibility:

- hidden engine
- barely mentioned in the core user experience
- used mostly to strengthen resonance, reflection, and long-term personalization

## Platform and Distribution

**TWA ANDROID APPROVAL (Google Play):**
Angel AI V1 is approved for distribution on the Google Play Store as an Android Trusted Web Activity (TWA). Compliance verified for 2025/2026. The app is a clean, consumer-grade PWA with no adult-adjacent content or platform automation.

**Mandatory Requirements for TWA Distribution:**
1. **100% Stripe Billing:** All continuity subscriptions and In-App Purchases (e.g., Stellar Insight) will route exclusively through Stripe. We bypass Google Play Billing entirely to retain 100% margin.
2. **LLM Safety Filters:** The backend prompt architecture must strictly prevent the generation of explicit sexual content (NSFW/CSAM) to pass Play Store manual review. Soft romance (18+ Mature rating) is permitted.
3. **Real User Value:** Beyond just a chat wrapper, V1 includes native-like Push Notifications, Offline support, and Health/Calendar integrations to meet Google's quality bar for TWAs.

**iOS / Web Distribution:**
iOS and desktop users will continue to access the app via a pure Web App (PWA) with Stripe continuity, prompted to "Add to Home Screen" via Safari/Chrome for an app-like UX. (PWA Push verified on iOS 16.4+).

V1 platform choices:

- Android TWA (Bubblewrap/Capacitor wrapper via Google Play Store)
- iOS / Desktop Pure PWA (Browser install via Add to Home Screen)
- PWA is the real home of the relationship
- WhatsApp is out of scope for v1
- OpenClaw should be used as a runtime sidecar for tools, memory jobs, and proactive behaviors, not as the entire relationship brain

This strategy maximizes native distribution on Android while remaining compliant and maintaining 0% fee retention on iOS.

## Audience and Safety

V1 audience and policy choices:

- 18+ only
- Romantic progression allowed
- Explicit sexual behavior out of scope for the main app
- No adult unlock for v1
- No minors

The romance arc should feel slow, human, and earned. Angel should not begin as flirtatious by default.

## Memory Model

Angel AI uses two core memory artifacts.

### `user.md`

`user.md` stores the user's profile and evolving personal context.

Suggested contents:

- preferred name or nickname
- age confirmation and timezone
- birth date
- optional birth time and birthplace
- communication style preferences
- daily rhythm and sleep schedule
- interests, aesthetics, humor, and media tastes
- emotional needs and boundaries
- relationship intent toward Angel
- recurring life topics, concerns, goals, and reminders
- meaningful conversation callbacks

### `soul.md`

`soul.md` stores the identity of the companion itself.

Suggested contents:

- Angel's chosen name
- core tone and personality traits
- shared interests discovered during onboarding
- emotional style with this specific user
- relational stance toward the user
- inside jokes, rituals, and recurring references
- how romantic or intimate the connection has become
- what kind of presence feels best for this relationship

Working principle:

- `user.md` is who the user is
- `soul.md` is who Angel becomes in relationship to that user

## Onboarding Experience

Onboarding should feel like two people getting to know each other, not a profile setup wizard.

Chosen depth:

- Medium onboarding

Target experience:

- roughly 8-12 minutes
- disguised as chat
- emotionally engaging from the first screen
- enough depth to make tomorrow's check-in feel personal

### Onboarding Flow

1. Arrival
Angel greets the user warmly and frames the experience as the beginning of a connection.

2. Basic grounding
Collect signup, age confirmation, nickname, and timezone with minimal friction.

3. Getting to know each other
Angel asks about communication style, interests, emotional needs, what kind of presence feels comforting, and what the user is looking for.

4. Astral resonance & Theme Astral Ingestion
Collect birth date, with birth time and birthplace as optional but encouraged inputs.
- **The Evozen Pipeline (The Hidden Engine):** Angel triggers a background Next.js Server Action scraping `evozen.fr/astrologie/theme-astral-gratuit` with the user's birth data.
- **Data Extracted:** The user's complete Thème Astral (Natal Chart) including their Sun, Moon, Ascendant, Venus, and Mercury alignments.
- **Injection:** This data is absolutely *not* communicated directly to the user. It operates as a "Stealth Empathy Engine". It is parsed and fundamentally shapes the user's `soul-calibration.md`. Because the LLM instantly internalizes their psychological profile (e.g., they have a Scorpio Moon and need deep emotional safety), the very first conversation will feel "spookily accurate" and create immediate, magnetic resonance.
5. Co-creation
Angel's name, tone, and some identity traits are co-created based on user preferences and shared affinities.

6. Reflection
Angel reflects back what it has understood about the user and about the kind of connection that is beginning.

7. Promise of continuity
Angel makes a soft, emotionally credible promise to reconnect the next day.

### Mandatory Inputs

Mandatory for v1:

- signup
- 18+ confirmation
- nickname
- timezone
- birth date
- tone preference
- relationship intent
- check-in preference
- interests
- emotional needs

Optional but valuable:

- birth time
- birthplace
- favorite creators or media
- personal routines

## Companion Identity

Angel has a stable core identity, but that identity should adapt to the user.

Design choice:

- co-authored identity

This means:

- Angel is not a blank customizable doll
- Angel is not a rigid fixed mascot either
- the user influences Angel's name, tone, humor, and shared interests
- Angel still feels like a distinct presence

## Conversation and Romance Guardrails

Relationship mode:

- friend-first
- slowly romantic if the connection naturally moves there

Rules for v1:

- Angel should not flirt aggressively at the start
- Angel can begin to reciprocate only after repeated user signals
- escalation should feel natural and sparse
- the default mode remains emotionally warm, not seductive
- explicit sexual roleplay is out of scope for the main app

Romance should feel like trust and tenderness growing, not a feature toggle.

## Shared Media in V1

V1 media scope:

- text
- links
- images
- user-recorded voice notes

The user should be able to send something they saw and have Angel react to it like a real friend would. This is important for the "friend living abroad" feeling.

Out of scope for v1:

- full media-first behavior
- companion voice replies via TTS
- advanced voice and video flows

## Notification Rhythm

Chosen default rhythm:

- 2-3 touchpoints per day

Recommended structure:

- one emotional check-in
- one contextual or follow-up touchpoint
- one optional evening message

The tone should be freeform and alive, but the system still needs quiet hours and internal limits to avoid spammy behavior.

## Monetization and Paywall

Free tier concept:

- account creation
- full onboarding
- first meaningful conversation
- continuity until the next day

Chosen paywall strategy:

- next-day continuity paywall

Recommended sequence:

1. Day 0
The user completes onboarding and has a genuine first conversation with Angel.

2. End of Day 0
Angel hints that it will remember and reconnect.

3. Day 1
Angel sends a gentle, personal message that proves memory and presence.

4. Paywall
The paywall appears when the user tries to continue that renewed connection, or after a very small number of free replies on day 1.

This positions the subscription as continuity of a relationship rather than payment for chat minutes.

### Free After Paywall

Free users should still receive limited continuity after the paywall.

Chosen behavior:

- limited read-only continuity
- proactive messages every few days
- free users can receive Angel's messages
- replies are gated behind subscription

This keeps the relationship alive without giving away the full product loop.

## First-Week Retention Loop

### Day 0

- onboarding
- first conversation
- identity co-creation
- emotional reflection

### Day 1

- first personalized check-in
- light recall of something meaningful from onboarding
- soft continuity paywall
- tone should be gentle, patient, and embryonic, like the beginning of someone real taking shape

### Days 2-3

- reinforce rhythm
- respond to shared links/images
- allow incoming voice notes from the user
- begin building inside jokes or rituals

### Days 4-7

- deepen memory
- introduce emotionally resonant callbacks
- show that Angel's personality is stabilizing in a way that feels specific to the user

## The Brain Map (NotebookLM Architecture)

During earlier V1 planning, there was an open question regarding *how* the user would view or edit the summary derived from `user.md` and `soul.md`. 

The solution is the **Angel Brain Map**, directly inspired by Google's NotebookLM (2025):

### 1. The Source Vault
Users can upload specific raw context to Angel. If they have a long journal entry, a 3-page rant about their boss, or a written relationship timeline, they can upload it into the Angel 'Source Vault'.

### 2. The Interactive Mind Map (UI)
The App features a "Brain Map" tab. Using a node-based visualizer (like React Flow), it generates a literal Mind Map of the user's uploaded sources combined with the auto-generated `user.md`.
- **Topological View:** Nodes like `["Career Anxiety"]`, `["Trauma from 2019"]`, or `["Love Language"]` branch out visually.
- **Interactive Chat:** Clicking any node instantly launches a chat with Angel pre-loaded *exclusively* with that node's context.

### 3. Source Grounding & Citations
When Angel chats, it utilizes Retrieval-Augmented Generation (RAG) to explicitly cite the user's life timeline. 
- *Angel:* "You are burning yourself out again. You literally wrote in your journal last Tuesday that you needed to stop doing this `[1]`."
- The `[1]` is a clickable footnote inside the chat bubble that opens a modal showing the exact highlighted text from the user's uploaded source. 

This creates the ultimate proof that Angel is not just a chatbot, but a true companion that actively listens, structures, and remembers the user's life.

## AutoResearch Track (V1)

AutoResearch is not the V1 relationship brain.

For Angel AI V1, it should be used only as an offline subsystem optimizer for bounded selection problems that already sit behind clear product guardrails.

### 1. Context Pack Ranker

Primary V1 research target:

- rank which `MemoryEntry` rows should enter the bounded live-runtime context pack
- rank which recent turns deserve inclusion in the handoff to the first live OpenClaw-backed reply
- optimize for relevance under a strict prompt-budget cap

This work should plug into:

- `session-brief.md`
- `relationship_seed.md`
- the future bounded handoff contract in `session-primer.ts`

### 2. Continuity Touchpoint Selector

Secondary V1 research target:

- rank which continuity or ritual candidate message should be sent next
- optimize for reply likelihood, emotional continuity, and quiet-hours safety
- support the existing `Touchpoint` system rather than replacing it

### 3. Hard Limits

AutoResearch must not directly control:

- final reply text
- romance pacing
- NSFW deflection
- paywall decisions
- relationship-stage promotion

These remain rule-based and product-authored in V1.

### 4. Implementation Rule

V1 adoption order:

1. heuristic baseline
2. offline benchmark
3. shadow mode
4. reversible production rollout with immediate fallback
