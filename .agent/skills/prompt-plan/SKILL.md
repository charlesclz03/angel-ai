---
name: prompt-plan
description: "Meta-orchestrator that scans all available agents, skills, and workflows, detects the project's tech stack, scores resource relevance, and produces a structured execution plan. Use for any complex or multi-domain request."
version: 1.0.0
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Prompt Plan — Intelligent Resource Orchestrator

> **Purpose:** Given any natural-language request, analyze the project context, scan all available `.agent/` resources, select the best combination of agents, skills, and workflows, and produce a structured plan for execution.

---

## 🔴 MANDATORY: Read Reference Files

| File | When to Read |
|------|-------------|
| [tech-stack-detection.md](tech-stack-detection.md) | 🔴 **ALWAYS** — Read first to understand project context |
| [resource-scoring.md](resource-scoring.md) | 🔴 **ALWAYS** — Read to score resources against the request |

---

## Phase 1: Request Analysis

**Decompose the user's prompt into structured dimensions:**

### 1.1 Intent Classification

| Intent | Signal Words | Example |
|--------|-------------|---------|
| **BUILD** | "create", "add", "implement", "build" | "Add dark mode to the app" |
| **FIX** | "fix", "bug", "broken", "error", "debug" | "Login returns 500 error" |
| **IMPROVE** | "improve", "optimize", "enhance", "refactor" | "Improve UI performance" |
| **AUDIT** | "review", "audit", "check", "analyze" | "Security audit the auth flow" |
| **PLAN** | "plan", "design", "architect", "strategy" | "Plan the database schema" |
| **LEARN** | "how", "explain", "what is", "why" | "How does the auth work?" |

### 1.2 Domain Detection

Identify ALL domains the request touches:

```
□ Frontend/UI    □ Backend/API    □ Database
□ Security       □ Testing        □ DevOps/Deploy
□ Mobile         □ Performance    □ SEO
□ Documentation  □ Architecture   □ Styling/CSS
□ i18n           □ Accessibility  □ State Management
```

### 1.3 Complexity Assessment

| Level | Criteria | Action |
|-------|----------|--------|
| **SIMPLE** | 1 domain, 1-2 files, clear scope | Direct execution, minimal plan |
| **MODERATE** | 2 domains, 3-5 files, clear requirements | Structured plan, 2-3 resources |
| **COMPLEX** | 3+ domains, many files, architectural decisions | Full plan, 4+ resources, user approval |
| **EPIC** | Cross-cutting, multi-phase, unclear scope | Phased plan, ask clarifying questions first |

---

## Phase 2: Project Context Detection

**Auto-detect the project's tech stack to filter irrelevant resources.**

> 📖 Read [tech-stack-detection.md](tech-stack-detection.md) for full detection heuristics.

### Quick Detection Checklist

```
1. Read package.json → framework, dependencies, scripts
2. Check for config files → tsconfig.json, tailwind.config, prisma/, etc.
3. Scan directory structure → app/, src/, components/, api/
4. Determine project type → Next.js SaaS, React Native, Python API, etc.
5. Build exclusion list → which skills/agents are irrelevant
```

### Project Profile Output

```markdown
## Project Profile
- **Type:** [Next.js SaaS / React Native / Python API / etc.]
- **Framework:** [Next.js 14 / Vite / Express / etc.]
- **Language:** [TypeScript / JavaScript / Python]
- **Styling:** [Tailwind CSS / CSS Modules / Styled Components]
- **Database:** [Prisma + PostgreSQL / Supabase / MongoDB]
- **Auth:** [NextAuth / Clerk / Custom]
- **Testing:** [Vitest + Playwright / Jest / None]
- **Deploy:** [Vercel / Docker / AWS]
```

---

## Phase 3: Resource Discovery

**Scan the project's `.agent/` directory to build a live inventory.**

### 3.1 Scan Protocol

```bash
# 1. Discover all agents
ls .agent/agents/*.md → extract name + description from frontmatter

# 2. Discover all skills  
ls .agent/skills/*/SKILL.md → extract name + description from frontmatter

# 3. Discover all workflows
ls .agent/workflows/*.md → extract description from frontmatter
```

### 3.2 Build Resource Catalog

For each resource, extract:

| Field | Source |
|-------|--------|
| **Name** | Filename or frontmatter `name` |
| **Type** | Agent / Skill / Workflow |
| **Description** | Frontmatter `description` field |
| **Domain** | Inferred from description keywords |

---

## Phase 4: Relevance Scoring

**Score each discovered resource against the request.**

> 📖 Read [resource-scoring.md](resource-scoring.md) for the full scoring matrix.

### Scoring Dimensions (1-5 each)

| Dimension | Question |
|-----------|----------|
| **Domain Match** | Does this resource's domain match the request domains? |
| **Tech Fit** | Is this resource relevant to the detected tech stack? |
| **Intent Alignment** | Does this resource serve the detected intent (BUILD/FIX/IMPROVE/etc.)? |
| **Impact** | How much value does this resource add to the plan? |

### Score Calculation

```
Relevance = (Domain Match × 2) + Tech Fit + Intent Alignment + Impact
```

**Range:** `0 → 25`

### Selection Thresholds

| Score | Tier | Action |
|-------|------|--------|
| **20-25** | 🟢 **Must-Use** | Include in plan, execute first |
| **14-19** | 🟡 **Recommended** | Include if complexity warrants |
| **8-13** | 🟠 **Optional** | Mention as available, don't include by default |
| **0-7** | 🔴 **Exclude** | Not relevant, omit from plan |

---

## Phase 5: Plan Assembly

**Compose the `prompt-plan.md` output file.**

### Plan Template

```markdown
# Prompt Plan: [Request Summary]

> Generated: [timestamp]
> Project: [project name] ([project type])
> Complexity: [SIMPLE / MODERATE / COMPLEX / EPIC]

## Request Analysis
- **Intent:** [BUILD / FIX / IMPROVE / AUDIT / PLAN]
- **Domains:** [list of detected domains]
- **Estimated Scope:** [files/components affected]

## Project Context
[Auto-detected project profile from Phase 2]

## Selected Resources

### 🟢 Must-Use
| # | Type | Name | Why Selected | Execution Order |
|---|------|------|-------------|-----------------|
| 1 | Agent | [name] | [reason] | Phase 1 |
| 2 | Skill | [name] | [reason] | Phase 1 |
| 3 | Workflow | [name] | [reason] | Phase 2 |

### 🟡 Recommended
| # | Type | Name | Why Selected |
|---|------|------|-------------|
| 4 | Skill | [name] | [reason] |

### 🟠 Available (not included)
- [name] — [why it's available but not selected]

## Execution Plan

### Phase 1: [Discovery / Analysis]
1. [Step with specific agent/skill]
2. [Step with specific agent/skill]

### Phase 2: [Implementation]
3. [Step with specific agent/skill/workflow]
4. [Step with specific agent/skill/workflow]

### Phase 3: [Verification]
5. [Step with specific agent/skill]

## Expected Deliverables
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

## Approval
> Review this plan. Reply **"approved"** to auto-execute, or request changes.
```

### Plan File Location

Save to: `prompt-plan.md` (project root)

---

## Phase 6: Execution Chaining

**After user approves the plan, auto-invoke the selected resources in order.**

### Execution Protocol

```
1. Read the approved prompt-plan.md
2. For each Phase in the Execution Plan:
   a. Invoke the specified agents/skills/workflows in order
   b. Pass full context to each invocation:
      - Original user request
      - Project profile
      - Previous phase results
   c. Track progress against the deliverables checklist
3. After all phases complete:
   a. Run verification (if test-engineer was selected)
   b. Update prompt-plan.md with completion status
   c. Present summary to user
```

### Context Passing Template

```
**CONTEXT FOR [Agent/Skill Name]:**
- Original Request: [user's original prompt]
- Project Type: [from project profile]
- Your Task: [specific task from execution plan]
- Previous Work: [summary of what other agents/skills did]
- Constraints: [any constraints from the plan]
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Select every agent/skill | Score and filter to top 3-6 |
| Ignore project tech stack | Auto-detect and exclude irrelevant resources |
| Skip user approval for complex plans | Always present plan before executing |
| Execute without context passing | Pass full context to every invocation |
| Include game-development in a SaaS project | Filter by tech stack fit |

---

## Integration with Existing Resources

| Existing Resource | Relationship |
|-------------------|-------------|
| `orchestrator` agent | Prompt-plan may invoke orchestrator for Phase 2 execution |
| `intelligent-routing` skill | Prompt-plan supersedes routing for planned workflows |
| `/plan` workflow | Prompt-plan replaces `/plan` for resource-aware planning |
| `/orchestrate` workflow | Prompt-plan may chain into `/orchestrate` for multi-agent execution |

---

> **Remember:** This skill's purpose is to be the *intelligent front door* — it ensures every complex request gets the right combination of resources, in the right order, with full project context.
