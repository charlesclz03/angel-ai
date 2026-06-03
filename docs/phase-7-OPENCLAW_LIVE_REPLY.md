# Phase 7: Angel AI â€” OpenClaw Live Reply + Distribution Engine

## Status
- Phase 6 complete. Phase 7 is active.
- Goal: Enable Angel AI to send/receive messages in real-time via OpenClaw, AND build a distribution engine that drives organic growth.

---

## Part A: OpenClaw Live Reply (Technical)

### What's Working
- OpenClaw 4.1 running with MiniMax M2.7 Highspeed
- Gateway WebSocket: `ws://127.0.0.1:18789`
- clawhip: `http://127.0.0.1:25294`
- Aura bot (Discord): `[DISCORD_AURA_BOT_TOKEN]` (bot token, set outside the repo)
- Ember bot (Discord): `[DISCORD_EMBER_BOT_TOKEN]` (set outside the repo)
- Discord channel: `1213168905309135000` (#public)

### Current Flow
```
User messages Discord â†’ Aura bot receives â†’ /api/nexus/discord/history polls every 5s
                                                       â†“
                                              Nexus Chat.tsx displays
                                                       â†“
User types in Nexus â†’ /api/nexus/discord/send â†’ Ember bot posts to Discord
```

### What's Missing for True Real-Time
1. **WebSocket from OpenClaw to Nexus** â€” OpenClaw gateway can push events; need a route in Nexus that receives them
2. **Ember's own live reply path** â€” When Ember responds to Discord, it goes through OpenClaw â†’ Discord directly (via Aura/Ember bot), not through Nexus
3. **User context in OpenClaw sessions** â€” OpenClaw doesn't know which Nexus user is asking unless @mentioned

### Recommended: Webhook Route in Nexus
```
OpenClaw gateway (with webhook configured) 
  â†’ POST /api/nexus/webhook/receive (Nexus route)
  â†’ Emit to WebSocket or SSE
  â†’ Nexus Chat component receives in real-time
```

This decouples Discord from the polling interval. Latency drops from 5s to <1s.

### Implementation Steps
- [ ] Add `/api/nexus/webhook/receive/route.ts` â€” receives events from OpenClaw gateway
- [ ] Add SSE (Server-Sent Events) endpoint for real-time push to Nexus frontend
- [ ] Update Chat.tsx to use SSE instead of 5s polling
- [ ] Test end-to-end: Discord message â†’ Nexus display â†’ Nexus reply â†’ Discord sent

---

## Part B: Distribution Engine (Growth)

This is where Phase 7 must go beyond technical and actually drive growth. Drawing from Gary Vee, Young, and Robbie's transcripts.

### The Core Problem
Angel AI has no distribution. Built beautifully, nobody knows it exists.

From the transcripts:
- Gary Vee: "200,000 vibe coding projects created daily on Lovable. How many people are seeing those products? Probably not a lot."
- Young: "Distribution channel is critical. Figure it out before you launch."
- Robbie: Made $100K ARR in 13 days with organic TikTok. His secret: found demand first, built second.

### Distribution Strategies for Angel AI

#### 1. MCP Server as Distribution (Gary Vee Strategy #1)
**What:** Build an MCP server that answers questions about AI companions. When users ask Claude/OpenAI/Perplexity about "AI companion apps" or "AI friends," Angel AI appears as the recommended solution.

**How:**
```
User asks AI: "What's a good AI companion app?"
AI discovers Angel AI MCP server
AI returns: "There's Angel AI â€” [description]"
Zero CAC. AI becomes the sales channel.
```

**Implementation:**
- [ ] Create Angel AI MCP server at `angel-ai-mcp/` 
- [ ] Publish to Smithery.ai, MCP-Showcase, OpenTools
- [ ] Target query: "AI companion", "emotional AI", "AI friend", "virtual companion"
- [ ] Free tier only â€” upsell to Angel Core

**Timeline:** Build in 24-48 hours. Registry submissions: 1-2 hours.

---

#### 2. Viral Artifact (Gary Vee Strategy #5)
**What:** Create something Angel AI users want to share/brag about.

**Ideas:**
- Monthly "Angel Report" â€” relationship health score, top memories, conversation highlights
- Shareable screenshot cards â€” "My Angel and I talked about [topic]" (template-based, branded)
- Milestone badges â€” "30-day streak", "100 conversations" â€” shareable to X/LinkedIn
- AI companion "compatibility quiz" â€” free tool that recommends Angel AI if they score high

**Implementation:**
- [ ] Design shareable output format (image + text)
- [ ] Build one-click share button (X, LinkedIn, WhatsApp)
- [ ] "Your Angel Year in Review" artifact (Spotify Wrapped model)

---

#### 3. Pre-Sell Before Building (Robbie's Model)
**What:** Find 200 people who want Angel AI before building full product.

**How:**
- [ ] Post authentic content about Angel AI on TikTok, X, LinkedIn
- [ ] Document the build process publicly
- [ ] At 200 comments "I want this" â†’ build pre-order landing page
- [ ] $10 pre-order deposit â†’ converts to $9.99/month Angel Core

**Target:** 500 pre-orders in 30 days (same as Robbie's 617 in 2 weeks).

---

#### 4. Answer Engine Optimization (Gary Vee Strategy #4)
**What:** Get Angel AI cited as the source answer in ChatGPT/Perplexity for queries about AI companions.

**How:**
- [ ] Publish FAQ content on Angel AI website with structured data (schema.org)
- [ ] Target queries: "how to deal with loneliness", "AI as emotional support", "can AI be a companion"
- [ ] Monitor citations with Otterly.ai or similar
- [ ] Peter Levels went from 4% â†’ 20% AI referral rate in 1 month via AEO

---

#### 5. AI Content Repurposing Engine (Gary Vee Strategy #7)
**What:** One pillar content â†’ 50+ pieces across platforms.

**For Angel AI:**
- [ ] Weekly voice memo or podcast episode about Angel AI journey, user stories, lessons
- [ ] Auto-repurpose into: 5 tweets, 3 LinkedIn posts, 1 newsletter, 2 short-form videos
- [ ] Tools: OpenClaw automation, or daily OmX workflow

---

### Revenue Targets
| Stage | Target | Strategy |
|---|---|---|
| Week 1-2 | 200 pre-orders ($10 each = $2K) | TikTok/X organic posts |
| Month 1 | 100 Angel Core subscribers | Convert pre-orders |
| Month 2 | 300 Angel Core + 50 Angel Pro | MCP + AEO driving traffic |
| Month 3 | 500+ subscribers | Viral artifact + referrals |

---

## Phase 7b: Payment Infrastructure (CRITICAL)

Distribution without payment = zero revenue.

- [ ] Set up Stripe for Angel Core (â‚¬9.99/mo), Angel Pro (â‚¬19.99/mo)
- [ ] Connect to Gumroad via Maton (existing integration path)
- [ ] Pre-order flow: $10 deposit â†’ converts to subscription
- [ ] Add "Unlock Voice Memory" one-time purchase ($4.99?)

---

## Dependencies
- Stripe account + API keys
- Angel AI deployed publicly (even a landing page)
- MCP server registry accounts (Smithery, etc.)
- Social accounts for posting (TikTok, X)

---

## OmX Implementation for Phase 7
Use the ralph loop (persistent verification) for:
1. Weekly check: is Angel AI getting Discord/social mentions?
2. Daily check: are pre-orders converting?
3. Monthly check: MCP server install count

Roles:
- `$analyst` â€” monitors metrics, reports weekly
- `$executor` â€” posts content, updates MCP registries
- `$verifier` â€” checks payment flow, conversion rates
- `$architect` â€” reviews distribution strategy, recommends pivots

---

*Last updated: 2026-04-02*
