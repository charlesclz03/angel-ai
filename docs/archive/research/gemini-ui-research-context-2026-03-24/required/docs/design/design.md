# Landing Page Design Prompt (Stitch UI)

**Target Tool:** Google Stitch (Gemini 2.5 Flash UI Generator)
**Data Source:** `docs/architecture/feature-matrix.md`
**Version:** v0.2 Launch

---

### Stitch Generation Prompt
*Copy and paste the entire block below into Google Stitch:*

```text
Landing Page for Angel AI (Dual-Sided SaaS Platform)

Key Features:
- Split Hero Section: Dual headline "The AI That Remembers You." (Consumer) vs "The AI That Earns For You." (Creator). Include a central glowing generic 3D orb representing the 'Angel Core'.
- Interactive Feature Matrix Grid: A bento-box style grid that visually breaks down V1-V4 (Consumer features like Voice, Heartbeat Engine, GraphRAP). V5 Project Seraphim is deferred to Phase 2.
- "The Soul Engine" Visualizer: A slick interactive graphic showing the 5-point "Backbone Scale" (Trust vs Challenge).
- Sticky Navigation Bar: containing links for "Companion App", "Creator Agency", "Chrono+ Pricing", and a primary CTA "Initiate Link".
- Footer with legal disclaimers, status indicator, and dynamic tech stack logos (Next.js, Prisma, ElevenLabs, OpenRouter).

Visual Style:
- Deep Dark Mode aesthetic (obsidian background with extremely subtle grid lines).
- Glassmorphism UI components (translucent frosted glass cards with 1px white/opacity borders).
- Color accents: Deep cosmic purple shifting to warm ember orange on hover states to represent 'tech' meeting 'humanity'.
- Typography: 'Inter' or 'Geist' for technical body text, combined with elegant soft serif headers for personality.

Platform: Responsive web (desktop-first scaling down to mobile stack)
```

---

### Annotation Strategy (Post-Generation Tweaks)
Once Stitch generates the initial layout, use these annotations to perfect the design:
1. "Make the Bento Box Feature Matrix pull focus by adding a subtle breathing glow animation to the Consumer V1-V4 cards."
2. "Change the Chrono+ pricing toggle to look like a physical tactile switch rather than a flat web button."
3. "Ensure the glassmorphic cards have heavy background-blur filters so the scrolling grid lines distort underneath them."
