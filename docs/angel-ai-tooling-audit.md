# Angel AI Tooling Audit

## Scope

This audit does not attempt to literally review all of GitHub.

Instead, it focuses on the highest-signal local and GitHub-discoverable skills, agent ecosystems, and workflow tools that are realistically useful for Angel AI.

The goal is to improve:

- product execution
- coding workflow
- testing and release quality
- future voice and proactive messaging capabilities

## Current Local Strengths

The repository already includes a strong local agent toolbox under `.agent/`:

- specialized agents for frontend, backend, database, mobile, QA, documentation, and planning
- workflow commands for create, enhance, deploy, audit, test, preview, and full-app review
- many implementation skills across Next.js, React, Prisma, Tailwind, mobile design, testing, and product planning

This means Angel AI does not need a large external agent framework to start shipping.

## Newly Installed Skills

Installed into Codex:

- `speech`
- `security-threat-model`
- `playwright`

Why these matter:

- `speech`: directly relevant for the voice-note and future TTS roadmap
- `security-threat-model`: useful once the app stores romantic memory, user metadata, and private media
- `playwright`: useful for PWA regression checks beyond the already available interactive browser tooling

## Official Skills Catalog

Highest-value official catalog source reviewed:

- [openai/skills](https://github.com/openai/skills)

Most relevant additions from that ecosystem for Angel AI:

- `speech`
- `playwright`
- `security-threat-model`
- later: `sentry`
- later: `vercel-deploy`

Not currently worth prioritizing:

- `chatgpt-apps`
- `linear`
- `notion-*`
- `slides`

## External GitHub Ecosystems Reviewed

### 1. Event and Scheduling Workflows

Strongest fit:

- [inngest/inngest](https://github.com/inngest/inngest)

Why it matters:

- Angel AI needs scheduled touchpoints
- delayed follow-ups
- post-paywall read-only continuity
- safe retries for proactive messaging jobs

Recommendation:

- strong candidate for v1 or v1.1 background workflow orchestration

Alternative class:

- [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev)

Recommendation:

- good alternative, but evaluate one of Inngest or Trigger.dev, not both

### 2. Voice and Real-Time Agents

Strongest fit for later:

- [livekit/agents](https://github.com/livekit/agents)

Why it matters:

- future Angel voice replies
- streaming conversational audio
- real-time spoken interaction

Recommendation:

- not needed for first text-plus-voice-note MVP
- high-value for v1.1 or v2 when Angel starts speaking back

### 3. Memory Systems

Relevant benchmark:

- [mem0ai/mem0](https://github.com/mem0ai/mem0)

Why it matters:

- companion products live or die on memory quality

Recommendation:

- use as a benchmark and idea source
- do not replace `user.md` and `soul.md` with a generic memory framework in v1

Angel AI's memory model is part of product differentiation and should stay custom at first.

### 4. Agent Frameworks

Reviewed:

- [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
- [microsoft/autogen](https://github.com/microsoft/autogen)
- [mastra-ai/mastra](https://github.com/mastra-ai/mastra)

Recommendation:

- avoid adopting these as the core runtime for v1

Why:

- Angel AI is currently an application problem, not a general autonomous multi-agent orchestration problem
- these frameworks would add complexity faster than they add product advantage

Possible future use:

- internal experimentation
- research tools
- back-office content or moderation pipelines

### 5. Community Skill Repositories

Interesting but lower-trust source:

- [numman-ali/n-skills](https://github.com/numman-ali/n-skills)

Recommendation:

- browse for inspiration
- do not bulk-install community skills blindly into the environment
- only import specific skills after inspection and clear need

## Recommended Adoption Timeline

### Use Now

- local `.agent` skills and workflows already in repo
- official `speech`, `playwright`, and `security-threat-model` skills
- existing `playwright-interactive` skill
- current Next.js, Prisma, and React skill set

### Use Soon

- evaluate Inngest for touchpoints and async follow-ups
- add Sentry later for production quality and failure visibility
- create local Angel-specific skills for memory writing and romance guardrails

### Use Later

- LiveKit Agents for spoken Angel replies
- Mem0-inspired ideas if custom memory begins to stall
- Trigger.dev only if it fits better than Inngest after evaluation

### Avoid For Now

- heavy multi-agent frameworks as the core app runtime
- generic community skill packs without vetting
- architecture that puts OpenClaw in charge of the entire relationship layer

## Recommended New Local Skills To Author

The best improvement path is not endless external tooling. It is a few custom repo-native skills.

Recommended additions:

### `companion-writing`

Purpose:

- preserve Angel's tone
- keep the friend-first slow-burn voice consistent

### `memory-distillation`

Purpose:

- convert raw conversation into clean `user.md` and `soul.md` updates

### `romance-guardrails`

Purpose:

- keep romantic progression natural, slow, and policy-safe

### `touchpoint-design`

Purpose:

- tune proactive messages, paywall continuity, and first-week retention loops

### `store-policy-check`

Purpose:

- review product changes against Play Store, Apple, and billing constraints before shipping

## Workflow Enhancements To Add Later

Recommended new project workflows:

- `/companion_flow` for onboarding, memory, and paywall iteration
- `/policy_audit` for release readiness around romance, age gating, and billing
- `/retention_experiment` for testing message cadence and conversion moments
- `/voice_pipeline` for voice notes, transcription, and future TTS

## Final Recommendation

Angel AI already has enough local agent power to move fast.

The best external enhancements are selective:

1. use official Codex skills, not random GitHub packs
2. add a workflow engine like Inngest when proactive messaging starts
3. add real-time voice tooling only when spoken Angel replies become real scope
4. keep memory and relationship design custom because that is the product
