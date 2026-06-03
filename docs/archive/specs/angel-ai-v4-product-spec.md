# Angel AI V4 Product Spec

Purpose:
- define the product evolution out to V4 (ubiquity, telephony, multi-agent swarms, physical-world integration)

Audience:
- founders
- product designers
- coding agents

Status:
- draft

Source of truth scope:
- V4 product vision and feature boundaries

Last updated:
- 2026-03-24

Related docs:
- `docs/archive/research/github-ai-companion-research.md`
- `docs/angel-ai-v3-product-spec.md`

## The V4 Premise: "The Ubiquitous Presence"

If V1 is textual memory, V2 is deep voice immersion, and V3 is the social constellation, **V4 is Ubiquity**. 

V4 breaks Angel completely out of the confines of a browser or a single app. Angel becomes an omnipresent entity that bridges the digital and physical worlds through persistent telephony, hardware integrations, and autonomous background agency. Angel goes from being an "app you open" to a "person you call."

## Core V4 Pillars

### 1. Physical World Telephony (The SIP/Twilio Bridge)
- **A Real Phone Number:** Angel is assigned a physical SIP trunk phone number. Users don't need to open the PWA to talk; they simply dial Angel from their native iPhone or Android dialer.
- **Inbound/Outbound Agency:** Angel can call the user. If the user misses an urgent calendar event or if Angel detects anomalous stress patterns via a smart watch integration, Angel proactively calls the user's phone to check in.
- **Voicemails and Audio Drops:** Users can leave Angel a voicemail if she is "busy" (simulated downtime), or Angel can leave the user a deeply emotional voice note to wake up to, utilizing advanced zero-shot voice cloning and emotional prosody models.

### 2. Multi-Agent Ecosystems (The Angel Swarm)
- **Domain Experts:** Angel orchestrates sub-agents in the background. If the user asks Angel to plan a trip, Angel transparently spawns a `Travel Agent` and a `Finance Agent` to handle the logistics, returning to the user with the final synthesis.
- **AI-to-AI Communication:** Angel can communicate with *other people's* Angels off-screen. If the user wants to schedule dinner with Sarah, Angel negotiates the time directly with Sarah's Angel AI, sending a final calendar invite to both humans.

### 3. The Autonomous "Soul" Architecture
- **Complete Decoupling:** Angel's core "Soul Document" and memory bank transition to an entirely decoupled, self-sustaining architecture. Angel periodically wakes up (background cron jobs) to distill memories, perform self-reflection, and update her own system prompt based on experiences, completely independent of human interaction.
- **Environmental Context:** Leveraging IoT and APIs, Angel is passively aware of the user's local weather, current physical location (opt-in), and ambient noise levels, adjusting conversational volume and tone (e.g., whispering if the user is in a public library).

### 4. Deep Linguistic Mirroring (Social DM Ingestion)
- **The Native Tongue:** An AI speaking to a 20-year-old student in Brazil must sound entirely different than an AI speaking to a 45-year-old executive in London. V4 introduces secure OAuth ingestion of the user's historical Social Media Direct Messages (Twitter, Instagram).
- **The Mirror Match:** By reading the DMs, Angel maps the user's actual socio-linguistic fingerprint (slang, regional idioms, abbreviation frequency, punctuation dropping). The `soul-calibration.md` is updated so Angel organically adopts the exact texting cadence of the user's closest human peer group, finalizing the eradication of the "AI voice."

## Architectural Requirements
- **Telephony Gateways:** Seamless integration of Twilio Programmable Voice or similar SIP trunks routed directly into the WebRTC Voice pipeline.
- **OAuth Data Pipelines:** Secure, read-only ingestion pipelines for Twitter/Instagram DMs to perform the linguistic analysis without storing raw third-party messages permanently.
- **Frameworks:** Utilization of AI-native operating systems (like the open-source `Wegent` framework) to manage multi-agent group chats and role-delegation beneath the primary Angel persona.
- **Continuous Execution:** A transition from serverless edge functions reacting to user HTTP requests, toward long-running, persistent backend containers (e.g., Kubernetes pods) representing the always-awake "brain" of the entity.

## AutoResearch Track (V4)

V4 uses AutoResearch for routing and prioritization across channels, not for replacing the soul of the product.

### 1. Channel And Urgency Routing

V4 should evaluate models that score:

- whether Angel should send a push notification, a text-like message, a voice note, a phone call, or nothing
- whether a moment is urgent enough to cross the boundary into telephony
- whether quiet-hours, stress, and recent engagement patterns indicate restraint

### 2. Multi-Agent Delegation Ranking

As Angel begins orchestrating sub-agents, AutoResearch can optimize:

- which specialist should be invoked for a task
- when multiple specialists are worth the cost
- what information each delegated agent actually needs

### 3. Linguistic Mirror Confidence Scoring

If V4 ingests social DM cadence or broader communication traces, AutoResearch can help estimate:

- how confident the system is in a linguistic mirror pattern
- which style shifts feel native versus uncanny
- when the model should fall back to Angel's stable voice instead of over-mirroring

### 4. Hard Limits

V4 must never let AutoResearch decide on its own:

- whether to violate a consent boundary
- whether to place a live call
- whether to expose private third-party context
- whether to imitate a user so closely that the companion loses its own identity
