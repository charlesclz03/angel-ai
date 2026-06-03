# Angel AI - Agent Instructions

## One-Minute Bootstrap
1. Read `docs/README.md` for the canonical documentation hub.
2. Read `docs/angel-ai-progress-log.md` to understand what has already been shipped.
3. Read `docs/angel-ai-next-session-handoff-2026-03-24.md` before substantial implementation work.
4. Read `.agent/ARCHITECTURE.md` if the task may benefit from repo-local skills, workflows, or specialist agents.
5. Keep changes small, verify locally, then update the handoff, progress log, next steps, and patch notes when behavior changes.

## Documentation Start Here
- Canonical docs hub: `docs/README.md`
- Current execution brief: `docs/angel-ai-next-session-handoff-2026-03-24.md`
- Shipped history: `docs/angel-ai-progress-log.md`
- Immediate backlog: `docs/angel-ai-next-steps.md`
- System map: `docs/architecture/system-map.md`
- Local setup and verification: `docs/runbooks/local-development.md`, `docs/runbooks/verification.md`

## Project Facts
- Product: `Angel AI`, a PWA-first companion app with continuity, memory, rituals, and OpenClaw handoff architecture.
- Stack: Next.js 15, TypeScript, Tailwind CSS, Prisma, Supabase, NextAuth, Stripe, PWA support.
- Key dirs: `app/`, `components/`, `lib/angel/`, `lib/billing/`, `prisma/`, `docs/`, `.agent/`.

## Workflow Index
- `/load-context`: rebuild the Angel AI docs stack for a fresh coding pass.
- `/bug_fix`: reproduce, fix root cause, verify, then update the operational docs.
- `/ci-fix`: reproduce and repair GitHub Actions or local CI failures without weakening checks.
- `/deploy`: run deployment checks and keep docs and patch notes aligned.
- `/database_migration`: change `prisma/schema.prisma` safely and document model-impacting changes.
- `/new_component`: extend UI while preserving the Angel product voice and continuity model.
- `/admin-audit`: inspect internal operator, dossier, moderation, and admin-facing surfaces.
- `/security-audit`: review auth, billing, uploads, memory privacy, push, and tool boundaries.
- `/push-smoke-test`: audit push notifications, service workers, installability, and notification UX.
- `/support-triage`: turn user-reported problems into scoped engineering work.
- `/sync-docs`: update the handoff, progress log, next steps, patch notes, and any impacted runbooks/reference docs after a substantial slice lands.
- `/audit`: inspect feature integrity and docs drift.
- `/whole_app_audit`: run app-wide checks and report gaps in implementation or docs governance.

## Repo-Local Development Toolkit
- Prefer reviewed repo-local skills, workflows, and agents under `.agent/` before importing third-party prompt packs.
- Use `.agent/ARCHITECTURE.md` as the map for available helper roles and commands.
- Keep new helper automation narrow, reviewable, and safe by default.

## Safety (Non-Negotiable)
- Never commit or paste secrets, cookies, or service-role keys.
- Treat user memory, relationship dossiers, and uploaded media as sensitive personal data.
- Redact secrets and private user content from logs, screenshots, bug reports, and PRs.
- Do not auto-install external skills, agents, or workflows into `.agent/` without manual review of licenses and scripts.
