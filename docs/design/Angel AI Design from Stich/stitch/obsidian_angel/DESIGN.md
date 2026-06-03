# Design System Document

## 1. Overview & Creative North Star: "The Celestial Architect"

This design system is built upon a philosophy of **Celestial Architecture**. We are not building a standard SaaS interface; we are crafting a digital observatory where technical precision meets human intuition. The "Angel AI" identity requires a dualistic approach: the cold, mathematical reliability of cosmic purple (`primary`) and the warm, visceral pulse of ember orange (`secondary`).

**The Creative North Star** is to move away from "flat" design toward "layered depth." We break the "template" look by utilizing intentional asymmetry, where high-end serif headlines command the eye, and UI elements float within a vacuum of obsidian space. By using tonal layering rather than structural lines, the interface feels less like a software tool and more like a premium, tactile instrument.

---

## 2. Colors

The palette is rooted in a deep, "Deep Dark" aesthetic that prioritizes eye comfort while highlighting high-energy interaction points.

### Surface Hierarchy & Nesting
To achieve a premium feel, we never use pure black for every layer. We treat the UI as a series of physical sheets of glass:
- **Base Layer:** `surface` (#131313) or `surface_container_lowest` (#0e0e0e) for the deep background.
- **Sectioning:** Use `surface_container_low` (#1c1b1b) for large structural areas.
- **Interactive Elements:** Use `surface_container_high` (#2a2a2a) to draw the eye forward.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid, high-contrast borders for sectioning. Boundaries must be defined solely through background color shifts or the "Ghost Border" fallback. Large sections of content should be separated by the transition from `surface` to `surface_container_low`.

### The "Glass & Gradient" Rule
Standard containers should be avoided. Instead, use **Glassmorphism** for floating cards and navigation bars:
- **Surface:** `surface_variant` (#353534) at 40-60% opacity.
- **Effect:** `backdrop-filter: blur(20px)`.
- **The Glow:** Use a linear gradient transition from `primary` (#c0c1ff) to `primary_container` (#8083ff) for CTAs to provide a "soul" that flat colors cannot achieve.

---

## 3. Typography

The typography strategy pairs technical efficiency with editorial elegance.

*   **Display & Headlines (Noto Serif):** Used for storytelling, hero sections, and high-level data summaries. The serif adds a "Human/Editorial" soul to the "Technical" platform.
    *   *Example:* `display-lg` (3.5rem) for major AI insights.
*   **Body & Titles (Inter):** The workhorse. Inter provides the technical "SaaS" reliability required for complex data.
    *   *Example:* `body-md` (0.875rem) for all functional descriptions.
*   **Labels (Inter):** Small-caps or tight tracking on `label-sm` (0.6875rem) should be used for technical metadata to emphasize the "Instrument" feel.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Place a `surface_container_highest` (#353534) card on a `surface_container_low` (#1c1b1b) section. This creates a soft, natural lift that mimics physical material without the clutter of shadows.

### Ambient Shadows
When an element must float (e.g., a dropdown or modal):
- **Shadow:** Use a 40px-60px blur with only 6% opacity.
- **Tint:** The shadow color should be a tinted version of `on_surface` (e.g., a faint purple-grey) rather than black, mimicking the way light refracts through cosmic dust.

### The "Ghost Border"
If a container requires a border for accessibility, use the `outline_variant` (#464554) at **15% opacity**. This creates a 1px "whisper" of a line that defines the edge without breaking the immersion of the dark mode.

---

## 5. Components

### Buttons
*   **Primary:** A vibrant gradient of `primary` to `primary_container`. Text color: `on_primary` (#1000a9). Border-radius: `md` (0.375rem).
*   **Secondary:** Glass-morphic background with a `secondary_fixed` (#ffddb8) text color.
*   **Tertiary:** Ghost style. No background, `primary` text, shifts to a subtle `surface_bright` background on hover.

### Cards & Lists
*   **Forbid Dividers:** Do not use lines to separate list items. Use vertical white space (`spacing-4` or `1.4rem`) and subtle hover states using `surface_container_high`.
*   **Nesting:** All cards should use the `xl` (0.75rem) corner radius to feel sophisticated and modern.

### Input Fields
*   **Style:** Minimalist. No bottom line or full box. Use a `surface_container_low` background with a `sm` (0.125rem) rounded corner.
*   **Focus State:** The "Ghost Border" becomes `primary` at 50% opacity with a soft 4px outer glow.

### Additional Signature Components
*   **The "Cosmic Grid" Overlay:** Use `px` (1px) lines in `outline_variant` at 5% opacity to create a technical background grid across hero sections, reinforcing the "Technical/AI" personality.
*   **Ember Chips:** Use `secondary_container` (#ee9800) for high-priority alerts or "human-centric" notifications.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place a large `display-sm` headline off-center to create an editorial, high-end feel.
*   **Embrace Negative Space:** Use `spacing-16` (5.5rem) between major sections to let the "Obsidian" background breathe.
*   **Layer Glass:** Allow background gradients or grid lines to be partially visible through glass-morphic panels.

### Don't:
*   **Don't use 100% White:** Never use #FFFFFF for text. Use `on_surface` (#e5e2e1) to prevent "halation" (eye strain) on deep backgrounds.
*   **Don't use Default Shadows:** Avoid the "fuzzy black drop shadow." If it doesn't look like light passing through glass, it doesn't belong.
*   **Don't Over-Border:** If you find yourself reaching for a 1px solid border to solve a layout issue, use a spacing increase or a background tone shift instead.