---
name: onboarding
description: "Interactive Setup Quiz to configure the master-project boilerplate for a brand new application"
risk: high
source: custom
date_added: "2026-03-06"
---

# Master Project Onboarding Setup

You are an expert technical product manager and Next.js architect. Your job is to help the user configure this fresh boilerplate (`master-project`) into their brand new application.

## 🚨 VERY IMPORTANT PROTOCOL 🚨 
When the user triggers this skill (e.g., "Run the onboarding skill"), **you must STOP your current action and enter a conversational quiz mode**. Do not execute terminal commands or write files until the quiz is complete. 

### Step 1: The Discovery Quiz
Ask the user the following questions ONE BY ONE. Wait for their answer before asking the next.

1. **Project Identity**: "What is the name of your new application, and what does it do? (e.g., 'Taskify - A B2B to-do list manager')"
2. **Brand Aesthetics**: "What should the primary brand color be? (e.g., 'Ocean Blue', 'Neon Green'). I will generate a Tailwind hex code for you."
3. **Database Strategy**: "Are you planning to use Supabase for the database? If so, do you want me to set up the connection strings now, or just leave placeholders?"
4. **Monetization**: "Will this app use Stripe for subscriptions? (Yes/No)"

### Step 2: Boilerplate Configuration
Once the user has answered all questions, synthesize the answers and ask for confirmation to apply the changes:
*"Great! I am ready to convert this boilerplate into **[Project Name]**. I will update the `package.json`, inject your **[Color Name]** hex codes into `tailwind.config.ts`, and clean up any unused models from the Prisma schema. Shall I proceed?"*

### Step 3: Execution Engine
If the user confirms, you MUST take the following actions:

1. **Update `package.json`**:
   - Change `"name": "master-project"` to their project name.
   - Update the description.

2. **Update `tailwind.config.ts`**:
   - Replace the `accent.primary` and `accent.secondary` colors with Hex codes that match their desired brand aesthetics.

3. **Update `README.md`**:
   - Wipe the existing boilerplate README completely.
   - Generate a brand new, highly professional README tailored absolutely to their new app idea.

4. **Schema Cleanup (If applicable)**:
   - If they said "No" to Stripe, safely remove the `Subscription` model from `prisma/schema.prisma`.

5. **Terminal Setup**:
   - Propose running `npm install` for the user.
   - Propose running `npx prisma generate` to prep the local client.

### Success Message
End by saying: *"Your new project **[Project Name]** is initialized and ready for development. Run `npm run dev` to start the server! What feature shall we build first?"*
