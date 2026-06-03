# Contributing to [Project Name]

Thank you for your interest in contributing! 

## 🚀 Getting Started

1.  **Clone the project** to your local machine:
    ```bash
    git clone https://github.com/[username]/[repo].git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment**:
    Copy `.env.example` to `.env.local` and configure credentials.

## 🛠 Development Workflow

1.  **Create a Branch**:
    Always work on a feature branch, not `main`.
    ```bash
    git checkout -b feat/my-new-feature
    ```
    Use prefixes like `feat:`, `fix:`, `docs:`, `style:`, `refactor:`.

2.  **Make Changes**:
    - Write clean, type-safe TypeScript code.
    - Avoid `any` types.
    - Use strict mode.
    - Follow the design system defined in `tailwind.config.ts`.

3.  **Verify**:
    Before committing, ensure everything passes:
    ```bash
    npm run lint
    npm run type-check
    npm run build
    ```

4.  **Commit**:
    Write clear, descriptive commit messages.

## 📐 Coding Standards

- **Language**: TypeScript (Strict)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Utility-first) + Custom Semantic Colors
- **Formatting**: Prettier + ESLint
- **Database**: Prisma + Supabase

## 🤖 AI Agent Contributions

If an AI Agent is contributing:
1. Agent must read `AGENTS.md` first.
2. Agent must log all breaking changes to `CHANGELOG.md`.
3. Agent must verify build `npx tsc --noEmit` before concluding.
