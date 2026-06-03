# Resource Scoring Matrix

> Reference file for the `prompt-plan` skill. Provides the scoring system for matching available resources to user requests.

---

## Scoring Formula

```
Relevance = (Domain Match × 2) + Tech Fit + Intent Alignment + Impact
```

**Max score:** 25 &nbsp;|&nbsp; **Selection threshold:** ≥ 14

---

## Domain → Agent Mapping

| Domain | Primary Agent | Secondary Agent |
|--------|--------------|-----------------|
| **Frontend/UI** | `frontend-specialist` | `performance-optimizer` |
| **Backend/API** | `backend-specialist` | `database-architect` |
| **Database** | `database-architect` | `backend-specialist` |
| **Security** | `security-auditor` | `penetration-tester` |
| **Testing** | `test-engineer` | `qa-automation-engineer` |
| **DevOps** | `devops-engineer` | — |
| **Mobile** | `mobile-developer` | — |
| **Performance** | `performance-optimizer` | `frontend-specialist` |
| **SEO** | `seo-specialist` | `frontend-specialist` |
| **Documentation** | `documentation-writer` | — |
| **Architecture** | `project-planner` | `explorer-agent` |
| **Debugging** | `debugger` | `explorer-agent` |
| **Planning** | `project-planner` | `product-manager` |
| **Discovery** | `explorer-agent` | `code-archaeologist` |

---

## Domain → Skill Mapping

| Domain | Must-Use Skills | Recommended Skills |
|--------|----------------|-------------------|
| **Frontend/UI** | `frontend-design`, `tailwind-patterns` | `web-design-guidelines`, `clean-code` |
| **Backend/API** | `api-patterns`, `nodejs-best-practices` | `clean-code`, `architecture` |
| **Database** | `database-design` | `architecture` |
| **Security** | `vulnerability-scanner`, `red-team-tactics` | `api-patterns` |
| **Testing** | `testing-patterns`, `tdd-workflow` | `webapp-testing` |
| **DevOps** | `deployment-procedures`, `server-management` | `powershell-windows` or `bash-linux` |
| **Performance** | `performance-profiling` | `frontend-design` |
| **SEO** | `seo-fundamentals` | `web-design-guidelines` |
| **Mobile** | `mobile-design` | `frontend-design` |
| **Architecture** | `architecture`, `plan-writing` | `clean-code` |
| **i18n** | `i18n-localization` | — |
| **Code Quality** | `clean-code`, `code-review-checklist`, `lint-and-validate` | `testing-patterns` |
| **Brainstorming** | `brainstorming` | `plan-writing` |

---

## Domain → Workflow Mapping

| Domain | Primary Workflow | Alternative |
|--------|-----------------|-------------|
| **Build New** | `/create` | `/plan` → `/create` |
| **Fix/Debug** | `/debug` | — |
| **Improve/Enhance** | `/enhance` | `/ui-ux-pro-max` (if UI) |
| **Audit/Review** | `/test` | `/status` |
| **Plan/Design** | `/plan` | `/brainstorm` |
| **Deploy** | `/deploy` | — |
| **Full Project** | `/orchestrate` | `/plan` → `/orchestrate` |
| **UI Overhaul** | `/ui-ux-pro-max` | `/enhance` |
| **Status Check** | `/status` | — |
| **Preview** | `/preview` | — |

---

## Intent → Resource Priority

| Intent | High Priority Resources | Execution Order |
|--------|------------------------|-----------------|
| **BUILD** | `project-planner` → domain agents → `test-engineer` | Plan → Implement → Test |
| **FIX** | `debugger` → `explorer-agent` → domain agent → `test-engineer` | Discover → Diagnose → Fix → Verify |
| **IMPROVE** | `explorer-agent` → domain agents → `performance-optimizer` → `test-engineer` | Analyze → Improve → Optimize → Verify |
| **AUDIT** | `explorer-agent` → domain agents → `security-auditor` | Discover → Audit → Report |
| **PLAN** | `project-planner` → `explorer-agent` | Plan → Validate |
| **LEARN** | `explorer-agent` → `documentation-writer` | Discover → Explain |

---

## Complexity → Resource Count

| Complexity | Agents | Skills | Workflows |
|-----------|--------|--------|-----------|
| **SIMPLE** | 1 | 1-2 | 0-1 |
| **MODERATE** | 2-3 | 2-4 | 1 |
| **COMPLEX** | 3-5 | 3-6 | 1-2 |
| **EPIC** | 5+ | 5+ | 2-3 (chained) |

---

## Combined Scoring Worksheet

Use this worksheet to score each candidate resource:

```
Resource: [name]
Type: [Agent / Skill / Workflow]

Domain Match (0-5):    ___  × 2 = ___
  5 = exact domain match
  3 = related domain
  1 = tangentially related
  0 = unrelated

Tech Fit (0-5):        ___
  5 = built for this tech stack
  3 = generally applicable
  1 = partially applicable
  0 = wrong tech stack

Intent Alignment (0-5): ___
  5 = designed for this intent
  3 = useful for this intent
  1 = marginally useful
  0 = wrong intent

Impact (0-5):           ___
  5 = critical for success
  3 = significantly helpful
  1 = nice to have
  0 = no impact

TOTAL:                  ___ / 25
```

---

## Selection Tiers

| Score | Tier | Plan Section | Action |
|-------|------|-------------|--------|
| **20-25** | 🟢 Must-Use | Selected Resources → Must-Use | Always include |
| **14-19** | 🟡 Recommended | Selected Resources → Recommended | Include for MODERATE+ complexity |
| **8-13** | 🟠 Optional | Available (not included) | Mention but don't include |
| **0-7** | 🔴 Exclude | Omit entirely | Don't mention |

---

## Cross-Domain Boost Rules

**When multiple domains are detected, boost resources that bridge them:**

| Domain Combo | Boosted Resource | Boost |
|-------------|-----------------|-------|
| Frontend + Backend | `architecture` skill | +3 |
| Frontend + Testing | `webapp-testing` skill | +3 |
| Security + Backend | `api-patterns` skill | +3 |
| Any + Testing | `test-engineer` agent | +2 |
| Any 3+ domains | `orchestrator` agent | +5 |
| Any + Performance | `performance-profiling` skill | +2 |

---

> **Principle:** The goal is *precision over recall* — select fewer, higher-impact resources over a sprawling list. A plan with 4 well-chosen resources is better than one with 12 loosely related ones.
