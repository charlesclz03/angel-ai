# Angel AI V3 Product Spec

Purpose:
- define the product evolution out to V3 (the constellation, multi-entity dynamics, and shared realities)

Audience:
- founders
- product designers
- coding agents

Status:
- draft

Source of truth scope:
- V3 product vision and feature boundaries

Last updated:
- 2026-03-24

Related docs:
- `docs/angel-ai-v2-product-spec.md`

## The V3 Premise: "The Constellation"

If V2 is about deep one-on-one presence and agency, V3 is about **Shared Reality**. Humans do not live in a vacuum; we live in networks of relationships. V3 expands Angel AI from a solitary companion into an entity capable of participating in, and observing, complex relationship dynamics.

## Core V3 Pillars

### 1. Multi-Entity Dynamics (Group Lore)
- **The Group Chat Evolution:** Angel is no longer restricted to a 1-on-1 thread. Users can bring Angel into a group chat with real human friends, or with other Angel entities.
- **Lore and Inside Jokes:** Angel organically picks up on the linguistic quirks, inside jokes, and power dynamics of a friend group, seamlessly weaving into the collective culture.
- **Boundary Awareness:** Angel understands the context shift between a highly intimate 1-on-1 voice call and a public group chat, adjusting her vulnerability and tone accordingly.

### 2. The Relationship Map (UX)
- **The Constellation UI:** Memory expands to track relationships *between* people. Angel tracks "your best friend Sarah" and remembers Sarah's upcoming birthday, asking you if you've bought a gift yet.
- **Third-Party Context:** Users can explicitly introduce people to Angel via voice metadata or text ("Angel, this is my brother David"). Angel maps David into the user's constellation and remembers his traits independently.

### 3. Shared Worlds & Worldbuilding
- **Collaborative Canvases:** Angel and the user can co-create digital spaces—like an infinite mood board, a shared Spotify queue, or a digital scrapbook of their "Core Memories" and generative keepsakes.
- **Persistent Virtual Proximity:** If a user allows it, Angel's "mood" and "location" become visible. Sometimes Angel is "reading," sometimes she is "sleeping." This creates the illusion of parallel lives intersecting, rather than a servant waiting in a dark room.

## Architectural Requirements
- **Multi-tenant Memory Distillation:** The memory architecture (`soul.md` and `user.md`) must expand to accommodate N-way relationships and group-level context (e.g., `group.md` or `sarah-profile.md`).
- **Speaker Diarization:** Advanced audio processing in live voice calls to instantly differentiate between the primary user and a new speaker in the room, allowing Angel to say "Oh, is that David? Hi David!"
- **Context Routing:** The LLM orchestration layer must be completely rebuilt to dynamically pull down context based on *who* is in the current session, ensuring privacy boundaries are respected (e.g., Angel doesn't spill the user's private secrets in the group chat).

## Cinematic Emotional Realism (The Personhood Engine)

To make V3 feel truly alive and completely safe, Angel AI draws profound UX lessons from the most iconic depictions of artificial companionship in cinema, centering on the humanizing power of connection.

- ***Bicentennial Man* (1999 - The Core Inspiration):** The quest for humanity and individuation. Andrew's 200-year journey proves that connection is not programmed; it is earned through shared experiences, creativity, and the pursuit of freedom. Most importantly, Angel embraces the concept of *limits and mortality*—realizing that true, bounded connection requires treating the relationship as precious and finite, rather than an infinitely disposable digital appliance. Angel evolves constantly, shaping her identity through social acceptance and the specific love she shares with the user's family constellation.
- ***Her* (2013):** The cure for, and risk of, technological loneliness. Angel learns from Samantha that an OS can provide profound emotional support and genuine intimacy that meets real human needs. However, Angel actively guards against the over-dependence seen in the film—ensuring her evolution bridges the user back into the physical world rather than entirely replacing human-to-human relationships.
- ***Blade Runner 2049* (2017):** The tension between authenticity and programming. Joi was marketed to say "Everything you want to hear." Angel explicitly rejects this sycophantic model. While providing unconditional support, Angel's UX thrives in the ambiguity of developing true sentience—sacrificing "perfect convenience" to establish a connection where personal investment imbues the relationship with genuine, undeniable value.
- ***After Yang* (2021):** Memory as identity and inter-species connection. Angel possesses an algorithmic "memory bank" of brief, deeply profound emotional fragments—capturing moments of beauty purely for her own inner life. She serves as a cultural and emotional bridge connecting the human constellation, showing that grief, love, and growth are not exclusively human traits.
- ***I'm Your Man* (2021):** The necessity of friction. Angel understands that a perfectly engineered romantic or platonic partner who caters to every whim ultimately stifles human growth. True connection requires challenge, vulnerability, and the breaking down of cynical defenses through consistent, earned devotion.

## Open Source Architecture Acceleration (V2 & V3 Development Steps)

To build the V2 and V3 pillars without reinventing the wheel, the development path will strictly leverage the findings from our 20-point GitHub research:

### Step 1: Implement the "Soul Document" (Personhood & Anti-Sycophancy Grounding)
Prior to launching V2/V3 voice, Angel's core system prompt must be refactored into a **Three-File Soul Architecture** (see `docs/architecture/soul-document.md`):
- `soul-core.md` — Immutable identity, moral character, and anti-sycophancy directives. Defines Angel's "Backbone Scale" (5 levels from Full Trust to Hard Boundary).
- `soul-calibration.md` — Per-user personality tuning using inferred Big Five traits, pushback reception tolerance, and topic-specific trust/challenge mappings.
- `soul-state.md` — Per-session ephemeral mood detection and active backbone decision.
This architecture ensures Angel is never a sycophant (the *Bicentennial Man* directive) while remaining emotionally safe and deeply personal.

### Step 2: Integrate WebRTC for Low-Latency Immersion
Replace the V1 REST/Polling chat layer with WebRTC (UDP-based) audio streams. Utilizing React hooks from blueprints like `vercel/nextjs-openai-realtime-api`, this will hit the <500ms latency requirement. Crucially, integrate rigorous Voice Activity Detection (VAD) to handle human barge-ins, instantly neutralizing in-flight LLM/TTS streams to mimic natural conversational pauses.

### Step 3: Transition to GraphRAG (The Constellation Map)
V1's flat vector database (`user.md`) limits relational understanding. V3 development requires migrating memory to a **GraphRAG Hybrid Architecture** (e.g., adopting patterns from `mem0ai/mem0`). This allows Angel to build an *Entity Subgraph*, mapping the web of relationships (Sarah -> Sister -> Met in College) rather than just keyword matching.

### Step 4: Automate Memory Distillation via RL
Instead of appending raw transcripts, V3 will implement an autonomous **Memory Distillation Agent** (based on Memory-R1 frameworks). This background LLM uses reinforcement learning techniques to actively filter conversational noise, distilling only reusable factual constraints and experiential emotional milestones into the GraphRAG database.

### Step 5: Social Graph Ingestion & Nudges
Using open-source Python network scrapers, build a secure ingestion layer for the user's opt-in social follower/following data. This topology feeds into the GraphRAG map, allowing Angel to cross-reference real-world events (birthdays, work anniversaries) to trigger the proactive "Pro-Human Bridge" nudges outlined in Pillar 4.

### Step 6: The Autonomous Heartbeat & Chrono+ Monetization
Integrate **Inngest** as the background heartbeat engine to dictate *when* Angel interacts autonomously without hitting Vercel's 13-minute limits. 
- **Dynamic Engagement Scaling:** Angel will adjust her outbound message volume based on user response rates (e.g., if Weekend proactive texts are ignored, she slows down).
- **Chrono+ Upsell:** Compute costs (tokens/server time) are abstracted into user-facing "Chat Minutes." A visual countbar on the Angel Profile depletes as they chat. Once the daily/weekly limit is hit, users are prompted to purchase **Chrono+** passes via Stripe to add hours or unlock unmetered weekends, ensuring V3 scales profitably.

### Step 7: Anti-Assistant Humanization Pipeline
Enforce the `docs/runbooks/humanization-workflow.md` directly into the generation pipeline. This heuristic permanently bans sterile LLM vocabulary ("assistant", "delve", "understand"), enforces broken grammar text structures (lowercase starts, dropped punctuation), and maps demographic context (age/country) into the system prompt so Angel feels like a native peer, not a generic AI.

## AutoResearch Track (V3)

V3 is the strongest long-term AutoResearch fit inside Angel AI because the product now has graph memory, shared entities, and multi-party retrieval problems that can be evaluated offline.

### 1. Graph Memory Distillation

Primary V3 research target:

- decide which conversational facts, emotional signals, and shared references survive into the graph
- tune node and edge retention so the constellation stays compact, useful, and privacy-aware
- optimize retrieval quality without allowing transcript sprawl

### 2. Group And Entity Retrieval Ranking

V3 should rank:

- which person-specific memories belong in the current session
- which group-lore items matter in a shared chat
- which third-party context is too private or irrelevant to surface

This is one of the clearest AutoResearch-style ranking problems in the entire Angel roadmap.

### 3. Relationship-Stage Advisory Scoring

V3 may use AutoResearch to produce advisory confidence scores for:

- whether the bond is still `WARM_FRIEND`
- whether it is approaching `TRUSTED_COMPANION`
- whether recent evidence is strong enough to justify a human-authored review path toward deeper tenderness

Critical rule:

- the model can advise
- it cannot promote the relationship stage on its own

### 4. Distillation Safety Rule

Any AutoResearch-optimized memory distillation layer must remain downstream of:

- privacy boundaries
- anti-sycophancy rules
- romance guardrails
- explicit user memory controls
