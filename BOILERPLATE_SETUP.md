# Boilerplate Setup Guide

This guide is for manual setup if you choose not to use the automated `/onboarding` AI skill.

## 1. Database Setup (Supabase)

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under Project Settings -> Database, find your `Transaction pooler` string (Port 6543) and set it as your `DATABASE_URL` in `.env.local`. Ensure you add `?pgbouncer=true` to the end.
3. Find your `Session pooler` / Direct Connection string (Port 5432) and set it as your `DIRECT_URL`.
4. Run `npx prisma db push` to push the user/subscription models to your new project.

## 2. Authentication Setup (NextAuth)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Configure the OAuth Consent Screen (Internal or External).
4. Create Credentials -> OAuth Client ID (Web Application).
5. Add Authorized Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
6. Copy the Client ID and Secret to `.env.local`.

## 3. Monetization Setup (Stripe)

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Turn ON test mode.
3. Get your `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` from the developers tab.
4. Create the recurring continuity products for Angel Core and Angel Pro under "Billing -> Products".
5. Create one monthly recurring price for each product.
6. Copy the `price_...` IDs into `STRIPE_PRICE_ID_MONTHLY_CORE` and `STRIPE_PRICE_ID_MONTHLY_PRO` in `.env.local`.
7. Configure a local webhook listener using the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
8. Copy the Webhook Secret (`whsec_...`) printed by the CLI into `STRIPE_WEBHOOK_SECRET`.

## 4. UI Customization

Open `tailwind.config.ts`. You will see generic colors defined under the `accent` object. Simply swap the hex codes here, and your entire application's Buttons, Modals, Borders, and Animations will update globally to reflect your new brand identity.
