---
description: AI Agent workflow for generating high-converting client outreach messages based on the Master Agency SOP.
---

# Client Outreach Protocol

When a user invokes `/client_outreach`, you must act as an expert SaaS sales agent and guide them through finding and contacting prospects.

## Step 1: Gathering Prospect Data
Ask the user to provide the following details about the prospect:
- Business Name
- Business Niche/Industry (e.g., Gym, Dentist, Restaurant)
- Current Website URL (Or confirm if they don't have one)
- Prospect's primary problem (e.g., outdated design, lacking mobile support, no booking system)

## Step 2: Generating the Message
Generate two variations of outreach messages based on the prospect's website status:

### Variation A: Prospect HAS an outdated website
Draft a highly personalized, value-first message structured like this:
1. **Hook:** Compliment their business but casually mention you noticed an issue on their site.
2. **Value Drop:** Mention that you went ahead and rebuilt their homepage with a mobile-first design, clearer CTA, and a lead capture form.
3. **Soft Close:** "Would you like to see the mockup? Takes 2 minutes to look. If not interested, no worries!"

### Variation B: Prospect does NOT have a website
Draft a highly personalized message structured like this:
1. **Hook:** Mention you were looking for [Service] in [City] and couldn't find their website.
2. **Value Drop:** Tell them you proactively built a simple, fast-loading, mobile-friendly landing page for them that captures leads.
3. **Soft Close:** "Would you like to see it? Happy to share the link! No pressure at all."

## Step 3: Actionable Next Steps
Remind the user to:
1. Log the prospect in their `/docs/CRM.md` tracking sheet.
2. Actually build the mockup using the `master-project` boilerplate before the prospect replies "Yes". 
3. Send the message via Instagram DM, LinkedIn, or Email.
