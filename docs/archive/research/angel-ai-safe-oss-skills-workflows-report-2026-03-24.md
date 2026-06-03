# Angel AI Safe OSS, Skills, Workflows, and Agents Report

Purpose:

- document the safest and most useful external open-source repos, skills, workflows, and agent tooling that could improve Angel AI in its current state

Audience:

- founders
- maintainers
- coding agents planning future implementation work

Status:

- archive

Source of truth scope:

- external research, adoption guidance, and safety filtering

Last updated:

- 2026-03-24

Related docs:

- `docs/archive/research/open-source-repos-to-improve-angel-ai-2026-03-24.md`
- `docs/archive/research/angel-ai-improvement-report-2026-03-24.md`
- `docs/angel-ai-next-session-handoff-2026-03-24.md`

Snapshot date: 2026-03-24

## What This Report Adds

The earlier OSS shortlist focused mostly on product repos Angel AI could borrow from.

This report adds:

- a safety filter for what should be copied directly versus only studied
- safe skills and workflow systems that could help Angel's engineering process
- safe agent-security tooling for prompt injection, MCP hardening, evals, and observability
- concrete adoption rules so Angel does not import unsafe prompt packs or over-privileged agent automation

## Safe Adoption Standard

Before importing any external repo, skill, workflow, or agent tooling into Angel AI, require all of the following:

1. permissive or clearly understood license
2. transparent source code or markdown, not opaque binaries
3. no automatic broad write access to repo, secrets, or production
4. no blind remote installation into `.agent/skills/` or CI
5. manual review of every bundled script
6. narrow permissions and explicit allowlists
7. a clear uninstall path

## Bottom Line

Angel AI should absolutely reuse public OSS, but it should do it in this order:

1. product repos and UI/admin/payment/PWA patterns
2. repo-local vetted skills and workflows
3. evaluation and security tooling
4. only then, cautiously, more autonomous or scheduled agent workflows

Do not start by installing giant third-party skill packs wholesale.

## Part A. Best Product Repos To Reuse

For the full matrix, use:

- `docs/archive/research/open-source-repos-to-improve-angel-ai-2026-03-24.md`

### Highest-value repos right now

| Area | Repo | Safety Bucket | Why It Matters |
|---|---|---|---|
| Admin dashboard | [premieroctet/next-admin](https://github.com/premieroctet/next-admin) | Direct copy/import | MIT, Prisma-native admin that fits Angel's data model and internal ops needs. |
| Admin UX | [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) | Direct copy/import | MIT, strong admin shell, notifications center, settings IA, and operator-facing patterns. |
| Billing | [KolbySisk/next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter) | Direct copy/import | MIT, strongest direct Stripe + Supabase pattern match for Angel's current stack. |
| Push / PWA | [bcanfield/nextjs-pwa-webpush-template](https://github.com/bcanfield/nextjs-pwa-webpush-template) | Review license first | Very high implementation fit for VAPID, install prompts, icons, splash screens, and push flow. |
| Security | [upstash/ratelimit-js](https://github.com/upstash/ratelimit-js) | Direct copy/import | MIT, easy win for endpoint abuse resistance. |
| Security | [nibtime/next-safe-middleware](https://github.com/nibtime/next-safe-middleware) | Direct copy/import | MIT, strict CSP and reporting for Next.js. |
| Upload safety | [pompelmi/pompelmi](https://github.com/pompelmi/pompelmi) | Direct copy/import | MIT, good fit for attachment and media scanning. |
| Email | [resend/react-email](https://github.com/resend/react-email) | Direct copy/import | MIT, useful for billing and lifecycle email UX. |
| Analytics | [umami-software/umami](https://github.com/umami-software/umami) | Direct copy/import | MIT, privacy-friendly analytics that fits Angel's tone better than surveillance-heavy stacks. |
| Background jobs | [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Direct copy/import | Apache-2.0, durable background tasks for touchpoints, push sends, summary regeneration, and audits. |

### Strong UI mining sources

| Repo | Safety Bucket | Why It Matters |
|---|---|---|
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Direct copy/import | Baseline accessible primitives and patterns. |
| [PageAI-Pro/page-ui](https://github.com/PageAI-Pro/page-ui) | Direct copy/import | Better marketing and conversion surface ideas. |
| [ibelick/motion-primitives](https://github.com/ibelick/motion-primitives) | Direct copy/import | Calm premium motion patterns. |
| [shadcnstudio/shadcn-studio](https://github.com/shadcnstudio/shadcn-studio) | Direct copy/import | Good themed block inspiration. |
| [shadcnstore/shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template) | Direct copy/import | MIT, coherent dashboard + landing pairing. |

## Part B. Safe Skills, Workflows, and Agent Systems

### Safest official or infrastructure-level options

#### 1. GitHub Agentic Workflows

Source:

- [GitHub Agentic Workflows](https://github.github.com/gh-aw/)
- [Security architecture article](https://github.blog/ai-and-ml/generative-ai/under-the-hood-security-architecture-of-github-agentic-workflows/)

Why it stands out:

- GitHub says workflows run with "safe outputs and sandboxed execution" and "read-only permissions by default." It also describes tool allowlisting, network isolation, and explicit write approval paths.
- GitHub's workflow markdown scanner rejects suspicious hidden content, obfuscated links, dangerous HTML, and prompt-injection style patterns.

Best Angel use cases:

- daily read-only repo status report
- docs consistency checks
- CI failure diagnosis
- issue triage
- patch-note reminders

Safety verdict:

- `Safe for read-only or tightly scoped automation`

Important caveat:

- GitHub explicitly says it is in early development and should be used with caution and human supervision.

#### 2. Anthropic official skills repository

Source:

- [anthropics/skills](https://github.com/anthropics/skills)

Why it stands out:

- Official example repository for the skills pattern.
- Anthropic states many skills are open source under Apache 2.0, but some document skills are only source-available.
- Anthropic also explicitly says to test skills thoroughly before relying on them for critical tasks.

Best Angel use cases:

- pattern mining for skill structure
- examples for document, testing, MCP, and workflow skills
- inspiration for more polished repo-local skills

Safety verdict:

- `Safe for pattern mining and selective vendoring`

Important caveat:

- Do not install every skill blindly.
- Respect mixed licensing inside the repo.

#### 3. OpenSkills

Source:

- [numman-ali/openskills](https://github.com/numman-ali/openskills)

Why it stands out:

- Apache 2.0
- built specifically to load SKILL.md style skills across multiple coding agents
- supports `.agent/skills/` in universal mode, which matches Angel's local workflow layout well

Best Angel use cases:

- sharing vetted repo-local skills across multiple agents and tools
- generating or syncing skill metadata into `AGENTS.md`
- standardizing skill loading if the team uses more than one coding agent

Safety verdict:

- `Safe as infrastructure, not as a blind package manager`

Important caveat:

- fine to use the loader
- not fine to auto-install unreviewed third-party skills from random GitHub repos

#### 4. agents-md

Source:

- [ivawzh/agents-md](https://github.com/ivawzh/agents-md)

Why it stands out:

- MIT
- solves a real problem Angel may hit soon: a single root `AGENTS.md` eventually becoming too large or stale
- composes agent instructions from fragment files with deterministic output

Best Angel use cases:

- splitting agent instructions by subsystem
- keeping docs and agent context in sync
- generating multi-directory `AGENTS.md` files later if the repo grows

Safety verdict:

- `Safe and useful if Angel's instruction surface grows`

Important caveat:

- not urgent right now
- current hand-maintained `AGENTS.md` is still workable

### Good community catalogs, but not safe to ingest wholesale

#### 5. awesome-llm-skills

Source:

- [Prat011/awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills)

Why it matters:

- Apache 2.0 curated directory of skills/resources spanning Claude Code, Codex, Gemini CLI, and other agents

Safety verdict:

- `Discovery/catalog only`

Why not direct install:

- it is an index, not a trust guarantee
- individual skills may use different licenses and quality levels

#### 6. awesome-codex-skills

Source:

- [ComposioHQ/awesome-codex-skills](https://github.com/ComposioHQ/awesome-codex-skills)

Why it matters:

- useful catalog for Codex-style skills and workflows
- especially relevant for GitHub, changelog, CI, and testing patterns

Safety verdict:

- `Discovery/catalog only`

Why not direct install:

- the captured page did not surface one simple repo-level license
- skill quality and permissions should be reviewed per skill

#### 7. Claude Command Suite

Source:

- [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite)

Why it matters:

- large library of commands, skills, agents, and structured workflows
- especially interesting for code review, release prep, security audit, test generation, and architectural analysis

Safety verdict:

- `Pattern mining only`

Why not direct install:

- broad surface area
- external agent imports
- license should be verified before copying code or command packs directly

#### 8. claude-code-tools

Source:

- [pchalasani/claude-code-tools](https://github.com/pchalasani/claude-code-tools)

Why it matters:

- MIT
- practical hooks, skills, and agents
- strong productivity ideas for session management and tooling

Safety verdict:

- `Safe for selective pattern mining`

Why not install blindly:

- it is a marketplace/plugin-style package with more surface area than Angel currently needs
- Angel should prefer narrow repo-local skills over broad external toolchains

## Part C. Safe Agent Security and Evaluation Stack

### Best safety tooling for Angel

| Tool | License | What It Solves | Safety Bucket |
|---|---|---|---|
| [StackOneHQ/defender](https://github.com/StackOneHQ/defender) | Apache-2.0 | prompt injection defense for agents calling tools via MCP, CLI, or function calling | Direct copy/import |
| [slowmist/MCP-Security-Checklist](https://github.com/slowmist/MCP-Security-Checklist) | MIT | review checklist for MCP tool ecosystems and prompt/tool safety | Direct copy/import |
| [riseandignite/mcp-shield](https://github.com/riseandignite/mcp-shield) | MIT | scanner for MCP server security regressions | Direct copy/import |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | MIT | evals, red teaming, vulnerability scanning, CI integration | Direct copy/import |
| [ethz-spylab/agentdojo](https://github.com/ethz-spylab/agentdojo) | MIT | benchmark environment for evaluating agent prompt injection defenses | Pattern mining only |
| [guardrails-ai/guardrails](https://github.com/guardrails-ai/guardrails) | Apache-2.0 | response/output guardrails and structured policy enforcement | Pattern mining only |
| [NVIDIA-NeMo/Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) | view license in repo; Apache materials are present | programmable conversational guardrails | Pattern mining only |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | verify exact repo license before vendoring | observability, prompt management, eval datasets, traces | Pattern mining only |

### What Angel should actually adopt from this group

#### Immediate

- `promptfoo`
  Use for evals and red-team cases around tone drift, NSFW boundary handling, memory leakage, and prompt injection through attachments or social content.
- `slowmist/MCP-Security-Checklist`
  Use as a checklist before any external tool or MCP adoption.
- `mcp-shield`
  Use to scan any MCP servers before trusting them.
- `StackOne Defender`
  Very relevant once Angel starts calling more tools or ingesting more untrusted third-party content in agent loops.

#### Later

- `Langfuse`
  Good once Angel wants durable prompt/version/eval tracing.
- `Guardrails AI` or `NeMo Guardrails`
  Useful if simple prompt engineering is no longer enough to enforce policy.
- `AgentDojo`
  Good for deeper security research and evaluation, not first implementation.

## Part D. What Angel AI Should And Should Not Install

### Safe to vendor repo-locally

- small markdown-only skills after manual review
- review and CI-fix skills with no external side effects
- changelog and docs-sync helpers
- webapp-testing and security-checklist style skills
- admin-ops review skills that only analyze local code/docs

### Safe to use as external references, not direct installs

- giant skill marketplaces
- community command suites with many scripts
- plugin packs that auto-update
- tools that mutate `AGENTS.md` or sync remote skills automatically without review

### Not safe for Angel by default

- any third-party skill that executes shell scripts or network actions without inspection
- any workflow that can comment, open PRs, merge, deploy, or write issues automatically on day one
- any agent/tooling setup with broad GitHub token scopes
- any remote-updating skill registry in CI

## Part E. Recommended Angel-Specific Skill and Workflow Additions

These are the safest high-value additions to build or vendor into Angel's own `.agent/` tree:

### Skills to add or import selectively

- `gh-fix-ci`
  For failing GitHub Actions diagnosis.
- `changelog-generator`
  For patch notes and release notes support.
- `webapp-testing`
  For targeted UI and route verification.
- `support-ticket-triage`
  For future user-support/admin workflows.
- `security-audit`
  Repo-local variant focused on auth, Stripe, uploads, push, and memory privacy.
- `push-notification-audit`
  To verify VAPID, service worker, manifest, and install flow.
- `admin-dossier-review`
  To audit relationship dossiers, memory controls, and moderation surfaces.

### Workflows to add later

- `/ci-fix`
- `/security-audit`
- `/support-triage`
- `/daily-status`
- `/push-smoke-test`
- `/admin-audit`

### Agents to add later

- `moderation-reviewer`
- `billing-ops-checker`
- `admin-ops-analyst`
- `push-delivery-debugger`

These should be repo-local and heavily scoped, not downloaded live from random repos during execution.

## Recommended Adoption Order

1. Keep using repo-local skills such as `load-context` and `sync-docs`.
2. Add a small number of reviewed repo-local skills inspired by the safe sources above.
3. Add `promptfoo`-based evaluation coverage.
4. Add endpoint and tool safety hardening with `next-safe-middleware`, `upstash/ratelimit-js`, and MCP review tooling.
5. Only then consider GitHub Agentic Workflows for read-only or low-risk scheduled automations.

## Final Recommendation

The safest external workflow strategy for Angel AI is:

- borrow code from permissive product repos
- borrow structure from official skills/workflow repos
- vendor only small reviewed pieces locally
- treat skills and workflows exactly like code dependencies
- prefer read-only analysis agents over write-capable automation

That gives Angel the upside of the agent/tooling ecosystem without turning the repo into an unvetted prompt supply chain.

## Sources

- [GitHub Agentic Workflows](https://github.github.com/gh-aw/)
- [GitHub Agentic Workflows markdown reference](https://github.github.com/gh-aw/reference/markdown/)
- [GitHub security architecture article for Agentic Workflows](https://github.blog/ai-and-ml/generative-ai/under-the-hood-security-architecture-of-github-agentic-workflows/)
- [anthropics/skills](https://github.com/anthropics/skills)
- [numman-ali/openskills](https://github.com/numman-ali/openskills)
- [ivawzh/agents-md](https://github.com/ivawzh/agents-md)
- [Prat011/awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills)
- [ComposioHQ/awesome-codex-skills](https://github.com/ComposioHQ/awesome-codex-skills)
- [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite)
- [pchalasani/claude-code-tools](https://github.com/pchalasani/claude-code-tools)
- [StackOneHQ/defender](https://github.com/StackOneHQ/defender)
- [slowmist/MCP-Security-Checklist](https://github.com/slowmist/MCP-Security-Checklist)
- [riseandignite/mcp-shield](https://github.com/riseandignite/mcp-shield)
- [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)
- [ethz-spylab/agentdojo](https://github.com/ethz-spylab/agentdojo)
- [guardrails-ai/guardrails](https://github.com/guardrails-ai/guardrails)
- [NVIDIA-NeMo/Guardrails](https://github.com/NVIDIA-NeMo/Guardrails)
- [langfuse/langfuse](https://github.com/langfuse/langfuse)
- [premieroctet/next-admin](https://github.com/premieroctet/next-admin)
- [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- [upstash/ratelimit-js](https://github.com/upstash/ratelimit-js)
- [nibtime/next-safe-middleware](https://github.com/nibtime/next-safe-middleware)
- [umami-software/umami](https://github.com/umami-software/umami)
- [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev)
