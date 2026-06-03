# Deployment Guide for [Project Name]

This guide outlines how to deploy the application. The project is built with **Next.js**, making **Vercel** the recommended deployment platform.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (installed with Node.js)
- A **GitHub** account
- A **Vercel** account 

## ✅ Pre-Deployment Checklist (Critical)

Before pushing to production, verify:
1.  **Build Pass:** Run `npm run build` locally. Must pass with Exit Code 0.
2.  **Lint Pass:** Run `npm run lint`.
3.  **Environment Variables:** Ensure all variables from `.env.example` are set in production.
4.  **Database Migration:** Supabase/Prisma migrations are deployed.

---

## Option 1: Deploy to Vercel (Recommended & Easiest)

1.  **Deploy to Production via CLI:**
    ```bash
    npx vercel --prod
    ```

2.  **Follow the Prompts:**
    - Accept default settings (just press Enter).
    - Vercel will upload `.env.local` to the cloud if approved.

### Using Git Integration (Best for CI/CD)

1.  **Push your code to GitHub**.
2.  **Import Project in Vercel:**
    - Go to [Vercel Dashboard](https://vercel.com/dashboard).
    - Import your Git repository.
    - Click **"Deploy"**.

3.  **Environment Variables Required:**
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_APP_URL` 
    - `STRIPE_SECRET_KEY`

---

## Verification

After deployment, verify the following:
1.  **Navigation:** Click through all links to ensure routing works.
2.  **Auth (Supabase):** Try logging in and registering.
3.  **Payments (Stripe):** Run a test transaction using Stripe test cards.
4.  **Security:** Verify CSP headers are present in the browser network tab.
