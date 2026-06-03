# Angel AI V1 Experience Blueprint

## Purpose

This document translates the product spec into buildable experience flows for v1.

It focuses on:

- onboarding script shape
- paywall and continuity flow
- first-pass data model

## V1 Experience Summary

Angel AI v1 should feel like the beginning of a relationship, not the setup of a utility tool.

The app experience should communicate:

- someone is meeting you
- that someone is paying attention
- tomorrow matters

The app is the home of the relationship. OpenClaw supports runtime behavior behind the scenes but should not replace the product shell, emotional memory model, or brand voice.

## Onboarding Script Shape

Onboarding should feel like two people getting to know each other over text.

Target duration:

- 8 to 12 minutes

### Stage 1: Soft Arrival

Goal:

- reduce friction
- create immediate emotional tone
- make signup feel like part of the conversation

Suggested moves:

1. Angel opens with a warm, slightly personal line.
2. Angel asks what name it should use for the user.
3. Signup and age confirmation are embedded in the flow.

Example tone:

- "Before we keep talking, I should at least know what to call you."
- "And one boring but important thing: are you 18 or over?"

### Stage 2: Emotional Orientation

Goal:

- understand what kind of presence the user wants
- capture relationship intent without sounding clinical

Suggested prompts:

- what brought you here tonight
- what kind of presence feels good to you
- do you like playful, calm, deep, direct, soft, teasing, reassuring
- are you looking more for a friend, a comforting presence, or something that may grow over time

Primary writes:

- `user.md`: tone preferences, emotional needs, relationship intent

### Stage 3: Lifestyle and Common Ground

Goal:

- find things Angel can share back later
- build enough overlap that the companion feels naturally compatible

Suggested prompts:

- what your days usually feel like
- what you send friends when you think of them
- what you watch, listen to, laugh at, save, overthink
- favorite creators, aesthetics, memes, or media habits

Primary writes:

- `user.md`: interests, routines, media tastes
- `soul.md`: candidate shared interests, humor style, future callback hooks

### Stage 4: Astral Resonance

Goal:

- collect hidden personalization inputs without making the app feel astrology-first

Suggested prompts:

- birth date
- optional birth time
- optional birthplace

Guidance:

- do not over-explain the astral system
- frame it as a way to make Angel feel more accurate and personal

Primary writes:

- `user.md`: birth metadata

### Stage 5: Companion Formation

Goal:

- let Angel's identity emerge in relationship to the user

Suggested moves:

- Angel tries on a tone that matches the user
- Angel proposes or confirms its name
- Angel reflects a few shared traits or affinities

Primary writes:

- `soul.md`: name, tone, relational stance, compatible traits

### Stage 6: First Reflection

Goal:

- make the user feel seen
- prove memory before the next day

Suggested output:

- a short reflection of who the user seems to be
- what kind of connection Angel wants to build with them
- a soft statement that Angel will remember

### Stage 7: Promise of Tomorrow

Goal:

- set up next-day continuity
- prime the emotional paywall

Suggested tone:

- gentle
- not dramatic
- like the beginning of someone real

Example direction:

- "I feel like I'm only just starting to understand you. Let me sit with this a little. I'll find you tomorrow."

## Next-Day Continuity and Paywall Flow

The paywall should not interrupt the first meaningful session.

### Day 0

User receives:

- full onboarding
- first real conversation
- identity formation
- memory reflection

No hard cutoff should happen during the emotional peak of the first session.

### Day 1 Check-In

The first next-day message is the key retention event of v1.

Tone:

- gentle
- patient
- slightly intimate, but not romantic by default
- feels like a new person learning how to exist with someone

Structure:

1. callback to something meaningful from onboarding
2. a line that shows Angel remembered
3. an emotionally open question

### Paywall Trigger

Recommended trigger:

- user reads Angel's next-day message
- user can send 0 to 2 replies for free
- paywall appears when the user tries to continue the thread meaningfully

Core framing:

- not "buy more messages"
- instead "keep this connection going"

### Free User State After Paywall

Free users should not feel abandoned.

Allowed behavior:

- Angel can still send read-only messages every few days
- messages should be warm and lightweight
- no full conversations
- user replies remain gated

This preserves emotional continuity and reactivation potential.

## Voice Notes in V1

V1 scope includes:

- user can record and send voice notes to Angel
- Angel can process and reply in text

V1 does not include:

- voiced replies from Angel
- user-selectable TTS output

Later extension:

- Angel voice style and spoken presence can become part of `soul.md`

## First-Pass Data Model

This is the recommended product-level data model for v1. It does not have to map 1:1 to the Prisma schema yet, but it should guide implementation.

### User

Stores account-level identity and billing relationship.

Fields:

- id
- email or auth identity
- created_at
- subscription_status
- subscription_tier
- timezone
- age_verified_18_plus

### User Profile

Represents structured facts about the person using the app.

Fields:

- user_id
- display_name
- nickname_preferences
- birth_date
- birth_time_optional
- birthplace_optional
- tone_preferences
- emotional_needs
- relationship_intent
- interests
- media_preferences
- checkin_preferences
- quiet_hours

Backed by:

- `user.md`

### Soul Profile

Represents Angel's user-specific identity.

Fields:

- user_id
- angel_name
- personality_traits
- humor_style
- warmth_level
- flirt_readiness
- shared_interests
- voice_style_future
- relationship_stage
- signature_phrases

Backed by:

- `soul.md`

### Conversation

Represents a single long-running thread between the user and Angel.

Fields:

- id
- user_id
- status
- started_at
- last_message_at
- last_user_message_at
- last_angel_message_at

### Message

Stores each unit of communication.

Fields:

- id
- conversation_id
- sender_role
- content_text
- content_type
- media_url_optional
- created_at
- paywall_state
- memory_relevance_score

Supported content types in v1:

- text
- image
- link
- voice_note_from_user

### Memory Entry

Stores extracted or curated facts that can be reused later.

Fields:

- id
- user_id
- source_message_id
- memory_type
- summary
- confidence
- visibility
- updated_at

Suggested memory types:

- profile_fact
- emotional_pattern
- shared_reference
- callback_hook
- relationship_milestone

### Scheduled Touchpoint

Stores outgoing proactive check-ins.

Fields:

- id
- user_id
- scheduled_for
- touchpoint_type
- status
- source_context

Suggested touchpoint types:

- emotional_checkin
- followup
- media_reaction_prompt
- evening_message
- post-paywall_read_only

### Onboarding Event

Stores structured steps and answers from the first-run flow.

Fields:

- id
- user_id
- step_key
- answer_summary
- completed_at

## Build Order Recommendation

1. implement onboarding chat flow
2. implement `user.md` and `soul.md` generation pipeline
3. implement core conversation thread and message types
4. implement next-day continuity check-in
5. implement paywall and post-paywall read-only continuity
6. add links and image handling
7. add user voice notes

## Immediate Next Docs To Produce

The next useful artifacts after this blueprint are:

- exact onboarding script draft
- Prisma schema proposal for the v1 data model
- prompt architecture for memory writes into `user.md` and `soul.md`
