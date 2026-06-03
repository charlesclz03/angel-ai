---
description: Intelligent task planning and resource orchestration. Automatically scans available agents, skills, and workflows to build a structured execution plan tailored to your project. Use this for ANY non-trivial task.
---

# /prompt-plan - Intelligent Task Orchestrator

$ARGUMENTS

---

## 🔴 CORE DIRECTIVE

This workflow is the intelligent front door to the project. It uses the `prompt-plan` skill to auto-detect the project tech stack, scan all available `.agent/` resources, and build a structured execution plan BEFORE writing any code.

---

## Task

Execute the `prompt-plan` skill to analyze this request:

```
**CONTEXT FOR PROMPT-PLAN:**
- User Request: $ARGUMENTS
- Mode: PLANNING & ORCHESTRATION
- Output Required: prompt-plan.md
```

### Execution Steps

1. **Read Reference Files**
   - Read `.agent/skills/prompt-plan/SKILL.md`
   - Read `.agent/skills/prompt-plan/tech-stack-detection.md`
   - Read `.agent/skills/prompt-plan/resource-scoring.md`

2. **Phase 1: Request Analysis**
   - Identify intent, domains, and complexity of "$ARGUMENTS"

3. **Phase 2: Tech Stack Detection**
   - Read `package.json` and key config files to determine project type
   - Document the Project Profile

4. **Phase 3: Resource Discovery**
   - Scan `.agent/agents/`
   - Scan `.agent/skills/`
   - Scan `.agent/workflows/`

5. **Phase 4 & 5: Scoring and Plan Assembly**
   - Score discovered resources against the request
   - Filter out resources that don't match the tech stack
   - Write the exact plan template described in `SKILL.md` to `prompt-plan.md`

6. **Phase 6: Present & Chain**
   - Send message to user: "Plan created: prompt-plan.md. Reply **'approved'** to begin auto-execution of Phase 1."
   - *Wait for user approval before invoking the selected resources.*

---

## Expected Output

| Deliverable | Location |
|-------------|----------|
| Execution Plan | `prompt-plan.md` |
| Auto-Execution | Triggered upon user approval |

---

## Naming & Usage Examples

| Request | Result |
|---------|--------|
| `/prompt-plan add secure login flow` | Auto-selects `security-auditor`, `backend-specialist`, `api-patterns` |
| `/prompt-plan redesign the dashboard` | Auto-selects `frontend-specialist`, `frontend-design` |
| `/prompt-plan fix the build pipeline errors` | Auto-selects `devops-engineer`, `systematic-debugging` |

---

> **Note:** The `prompt-plan` skill is the engine. This workflow is the starter motor. Together they ensure every complex task uses the *exact right combination* of agent expertise and skill knowledge, tailored to the specific project framework.
