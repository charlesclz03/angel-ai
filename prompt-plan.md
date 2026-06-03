# Prompt Plan: Add secure user login flow

> Generated: 2026-03-14
> Project: master-project
> Complexity: MODERATE

## Request Analysis
- **Intent:** BUILD
- **Domains:** Security, Backend/API, Frontend/UI
- **Estimated Scope:** Auth logic, DB schema changes, Login/Signup components

## Project Context
## Project Profile
- **Type:** Next.js SaaS
- **Framework:** Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma
- **Testing:** Playwright/Vitest

## Selected Resources

### 🟢 Must-Use
| # | Type | Name | Why Selected | Execution Order |
|---|------|------|-------------|-----------------|
| 1 | Agent | `security-auditor` | Required for secure auth implementation | Phase 1 |
| 2 | Agent | `backend-specialist` | Required for Next.js auth routes/DB | Phase 1 |
| 3 | Skill | `api-patterns` | Ensures secure API design (CSRF, timing) | Phase 1 |
| 4 | Agent | `frontend-specialist` | Required for UI forms and session state | Phase 2 |

### 🟡 Recommended
| # | Type | Name | Why Selected |
|---|------|------|-------------|
| 5 | Agent | `database-architect` | Useful if custom user/session tables are needed |
| 6 | Skill | `frontend-design` | Ensures the login UI follows design system |

### 🟠 Available (not included)
- `penetration-tester` — Better suited for post-deploy review than initial build
- `mobile-developer` — Filtered (React Native skill not relevant for Next.js)

## Execution Plan

### Phase 1: Security & Backend Architecture
1. Auto-invoke `security-auditor` to define the secure auth architecture (JWT vs Session, hashing, CSRF protection).
2. Auto-invoke `backend-specialist` + `api-patterns` skill to implement the API routes and Prisma schema updates.

### Phase 2: Frontend Implementation
3. Auto-invoke `frontend-specialist` to build the login, signup, and reset-password UI components using existing Tailwind components.
4. Auto-invoke `frontend-specialist` to implement client-side session state and route protection.

### Phase 3: Verification
5. Auto-invoke `test-engineer` to verify the auth flow (E2E and security edge cases).

## Expected Deliverables
- [ ] Prisma schema updated with User/Session models
- [ ] Authentication API routes created securely
- [ ] Login and Signup UI components built
- [ ] Route protection middleware active
- [ ] Auth tests passing

## Approval
> Review this plan. Reply **"approved"** to auto-execute Phase 1, or request changes.
