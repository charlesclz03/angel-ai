# Whole-App Audit: v0.x & v1 Readiness

## 1. Preflight
- **Repository State**: Operational status active. No local repository changes made during this audit run according to strict workflow rules.

## 2. Automated Local Health
- **Security Scan (`checklist.py`)**: ✅ PASSED
- **Type Checking (`tsc`)**: ❌ FAILED (External `openclaw_repo` internal typings are polluting the local build pipeline).
- **Lint Check (`eslint`)**: ❌ FAILED (Some unused imports in `AngelChat.tsx` and legacy `next lint` CLI invocation).
- **Build (`next build`)**: ❌ **CRITICAL FAIL** 
  - **Reason**: `app/api/push/subscribe/route.ts` is attempting to import an unresolved module `@/auth` instead of `@/lib/auth`.

## 3. Route Inventory
- **Total Pages (`page.tsx`)**: 3
- **Total API Routes (`route.ts`)**: 10
- **Complexity Focus**: The chat interface `AngelChat.tsx` and the core backend orchestrator `chat-service.ts` are exceptionally heavy.

## 4. Type-Safety + Complexity Sweep
- **Escape Hatches**: Minimal `as any` casting present (heavily restricted to `error` object casting).
- **Highest Regression-Risk Zone**: `lib/angel/chat-service.ts`. It manages context formulation, DB transitions, billing tracking, and touchpoints simultaneously. Any change to this file risks rippling bugs across the entire PWA.

## 5. Remediation Plan / "Forever Fix" Backlog

| Priority | Issue | Remediation Steps |
|---|---|---|
| **P0** | **Breaking Server Build** | In `app/api/push/subscribe/route.ts`, replace `import { auth } from '@/auth'` with `import { getServerAuthSession } from '@/lib/auth'`. |
| **P1** | **Global TS Pollution** | Add `"exclude": ["openclaw_repo"]` to the root `tsconfig.json` to isolate compilation. |
| **P2** | **Component Bloat** | Componentize `AngelChat.tsx`. Break out the memory header, touchpoint props, and media upload into specialized, memoized atoms. |
