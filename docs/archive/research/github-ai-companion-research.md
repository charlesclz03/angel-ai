# GitHub AI Companion Architecture Research (20-Point Deep Dive)

**Purpose:** Document the state-of-the-art open-source architectures, repositories, and frameworks discovered via deep GitHub searches to accelerate the Angel AI V2 and V3 roadmap.
**Date:** 2026-03-24
**Scope:** Covers Voice, TTS, Memory Graphs, Personhood, Empathy, and Telephony.

---

## 1. Deep Voice Immersion & WebRTC (Searches 1, 2, 8, 16, 17, 20)
To achieve the V2 goal of "Real-time Presence" with <500ms latency:
- **WebRTC over WebSockets:** WebRTC (UDP-based) is highly prioritized over WebSockets (TCP-based) for voice AI to prevent Head-of-Line blocking and handle network jitter gracefully.
- **Reference Architectures:** Next.js 15 starters like `vercel/nextjs-openai-realtime-api` and `shadcn-openai-realtime-api` provide robust React hooks to manage WebRTC streams and autonomous tool-calling directly with the OpenAI Realtime API.
- **Open Source Voice Cloning:** Projects like `XTTS-v2`, `FishSpeech S1-mini`, and `Higgs Audio V2` allow zero-shot voice cloning and deep emotional prosody control with as little as 3-6 seconds of reference audio. 
- **Interruption Handling (Barge-in):** True conversational flow requires Voice Activity Detection (VAD) tuned to instantly cancel in-flight audio generation and LLM context when the user speaks over the AI, mimicking human cadence.

## 2. Advanced Memory & The Relationship Constellation (Searches 5, 9, 10, 13, 14)
To achieve the V3 "Constellation" and ambient memory:
- **GraphRAG and Memory Graphs:** Flat vector databases are insufficient. Projects like `mem0ai/mem0` use hybrid architectures (Vector Search + Semantic Entity Subgraphs) to map how people, facts, and events relate to one another.
- **Memory Distillation:** Instead of blindly appending transcripts, state-of-the-art "Answer Agents" use Reinforcement Learning to distill memories—extracting reusable facts and experiential knowledge while discarding verbose conversational noise.
- **Social Graph Ingestion:** Open-source Python scrapers (`bluesky-social-graph`, `dltHub` extractors) demonstrate how AI can ingest friend lists and interaction networks to populate the entity graph, powering Angel's proactive "Bridge Builder" prompts.

## 3. Empathy, Personhood, & The "Soul Document" (Searches 3, 4, 6, 12, 19)
To achieve "Cinematic Emotional Realism" (The Personhood Engine):
- **The "Soul Document" Architecture:** Inspired by Anthropic's internal "Claude Soul Document," Angel needs a foundational "Philosophical Soul Print." This is not a list of behavioral rules, but a deep system prompt that dictates moral character, virtue, and emotional alignment.
- **Personality Engines:** Tools like `Clueo` (MCP-compatible) and `Motiva MX` dynamically adjust Tone and Big Five personality traits in real-time. 
- **LLM Emotional Intelligence:** Research confirms LLMs score incredibly high on Emotion Understanding (EU). Leveraging techniques like "EmotionPrompt" (adding emotional stakes to the system prompt) significantly boosts the model's empathetic reasoning.

## 4. Multi-Agent Ecosystems & Telephony (Searches 7, 11, 15, 18)
To break Angel out of the 1-on-1 browser chat:
- **Multi-Agent Group Chat:** Frameworks like `Wegent` act as an AI-native OS, enabling @mentions, context sharing, and multi-agent collaboration within a group chat paradigm.
- **SIP & Twilio AI Voice Calls:** Real-world telephony integration is achieved by connecting SIP trunks and Twilio Programmable Voice to the WebRTC AI pipeline. This allows users to physically "call" Angel like a normal phone number, utilizing inbound messaging gateways and automated voice workflows (seen in platforms like Bland.ai or Autocalls.ai).
- **The Next.js Vercel AI SDK Standard:** The Vercel AI SDK provides the absolute fastest text/UI streaming layer for Next.js companions, allowing UI elements (Generative UI) to be returned natively alongside chat.
