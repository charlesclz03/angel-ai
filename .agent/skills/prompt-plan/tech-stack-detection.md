# Tech Stack Detection

> Reference file for the `prompt-plan` skill. Provides heuristics for auto-detecting project technology stack.

---

## Detection Order

Execute these checks in order. Stop early if confident in classification.

```
1. package.json        → Framework, dependencies, scripts
2. Config files        → Build tools, styling, testing
3. Directory structure  → App architecture pattern
4. Other markers       → Language, deploy target
```

---

## 1. Package.json Analysis

### Framework Detection

| Dependency | Framework | Project Type |
|------------|-----------|-------------|
| `next` | Next.js | Web App (SSR/SSG) |
| `react` (no next) | React SPA | Web App (CSR) |
| `vue` / `nuxt` | Vue/Nuxt | Web App |
| `@angular/core` | Angular | Web App |
| `express` / `fastify` / `hono` | Node.js API | Backend |
| `react-native` / `expo` | React Native | Mobile |
| `electron` | Electron | Desktop |
| `phaser` / `three` | Game engine | Game |

### Key Dependencies to Note

| Dependency | Signals |
|------------|---------|
| `prisma` / `drizzle` / `typeorm` | Database ORM → `database-architect` relevant |
| `next-auth` / `@clerk/nextjs` / `lucia` | Auth → `security-auditor` relevant |
| `tailwindcss` | Styling → `tailwind-patterns` skill relevant |
| `shadcn` / `@radix-ui` | Component library → `frontend-design` relevant |
| `vitest` / `jest` | Unit testing → `test-engineer` relevant |
| `playwright` / `cypress` | E2E testing → `webapp-testing` skill relevant |
| `sentry` / `@sentry/nextjs` | Monitoring → `performance-profiling` relevant |
| `stripe` | Payments → `security-auditor` + `backend-specialist` relevant |
| `@supabase/supabase-js` | Supabase → `database-architect` relevant |
| `next-intl` / `i18next` | i18n → `i18n-localization` skill relevant |

### Scripts Analysis

| Script | Signals |
|--------|---------|
| `dev`, `build`, `start` | Web app with dev server |
| `test`, `test:unit` | Testing infrastructure exists |
| `test:e2e` | E2E testing exists |
| `lint` | Linting configured |
| `deploy` | Deployment pipeline exists |
| `prisma:*` / `db:*` | Database management scripts |

---

## 2. Config File Detection

| File Present | Signals |
|-------------|---------|
| `tsconfig.json` | TypeScript project |
| `tailwind.config.*` | Tailwind CSS styling |
| `prisma/schema.prisma` | Prisma ORM + relational DB |
| `drizzle.config.*` | Drizzle ORM |
| `playwright.config.*` | Playwright E2E tests |
| `vitest.config.*` | Vitest unit tests |
| `.eslintrc.*` / `eslint.config.*` | ESLint configured |
| `Dockerfile` | Docker deployment |
| `vercel.json` | Vercel deployment |
| `next.config.*` | Next.js (confirms framework) |
| `.env*` | Environment variables in use |
| `sentry.*.config.*` | Sentry error tracking |

---

## 3. Directory Structure Patterns

| Directory | Signals |
|-----------|---------|
| `app/` | Next.js App Router or similar |
| `src/` | Source code separation |
| `pages/` | Next.js Pages Router or similar |
| `components/` | Component-based architecture |
| `api/` or `server/` | Backend API routes |
| `prisma/` | Database schema + migrations |
| `e2e/` or `tests/` | Test suites |
| `public/` | Static assets |
| `docs/` | Documentation |
| `twa/` | Trusted Web Activity (Android wrapper) |
| `supabase/` | Supabase local config |

---

## 4. Project Type Classification

### Classification Matrix

| Framework | ORM | Auth | Deploy | → Project Type |
|-----------|-----|------|--------|---------------|
| Next.js | Prisma | NextAuth/Clerk | Vercel | **Next.js SaaS** |
| Next.js | Supabase | Supabase Auth | Vercel | **Next.js + Supabase** |
| React | None | Firebase | Firebase | **React SPA** |
| Express | Prisma/Drizzle | JWT | Docker | **Node.js API** |
| React Native | — | — | EAS | **Mobile App** |
| — | — | — | — | **Static Site / Other** |

---

## 5. Skill Exclusion Rules

**Based on detected project type, exclude irrelevant skills:**

| Project Type | Exclude Skills |
|-------------|---------------|
| **Next.js SaaS** | `game-development`, `rust-pro`, `python-patterns`, `bash-linux`, `geo-fundamentals`, `flutter-*` |
| **React Native** | `seo-fundamentals`, `server-management`, `game-development`, `rust-pro` |
| **Python API** | `tailwind-patterns`, `frontend-design`, `react-*`, `nextjs-*`, `mobile-design` |
| **Game** | `seo-fundamentals`, `api-patterns`, `database-design`, `deployment-procedures` |

### Agent Exclusion Rules

| Project Type | Exclude Agents |
|-------------|---------------|
| **Web App** | `game-developer`, `mobile-developer` |
| **Mobile App** | `game-developer`, `seo-specialist` |
| **API Only** | `frontend-specialist`, `seo-specialist`, `game-developer`, `mobile-developer` |

---

> **Principle:** When in doubt, *include* a resource rather than exclude it. False negatives (missing a useful resource) are worse than false positives (including an extra one).
