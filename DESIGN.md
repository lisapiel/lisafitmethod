---
name: Lisa Fit Method
description: A premium, editorial strength-training studio. Ivory paper, ink black, champagne gold, and serif headlines.
colors:
  ink-black: "#0a0a0a"
  warm-ivory: "#faf8f5"
  paper-stone: "#f5f2ee"
  champagne-gold: "#c8a97e"
  antique-gold: "#a8895e"
  ink-text: "#1a1a1a"
  warm-taupe: "#6b6560"
  portal-hairline: "#e8e2dc"
  course-charcoal: "#111111"
  course-card: "#161616"
  course-hairline: "#2a2a2a"
  course-cream: "#f0e6d3"
  course-gold: "#c9a96e"
  course-gold-light: "#e8c98a"
  course-muted: "#888888"
  status-success: "#5c9e6a"
  status-warning: "#d97460"
  status-error: "#c14646"
  status-error-on-dark: "#e07070"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.5rem, 6.2vw, 5.6rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.95rem, 4.1vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.2rem, 1.8vw, 1.72rem)"
    fontWeight: 500
    lineHeight: 1.18
  lede:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 1.4vw, 1.3rem)"
    fontWeight: 300
    lineHeight: 1.66
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 1.05vw, 1.0625rem)"
    fontWeight: 300
    lineHeight: 1.82
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    letterSpacing: "0.28em"
  button:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.2em"
  course-display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.1
  course-body:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 300
    lineHeight: 1.7
rounded:
  none: "0px"
  app-sm: "4px"
  app-md: "8px"
  round: "50%"
spacing:
  step-1: "clamp(8px, 0.8vw, 12px)"
  step-2: "clamp(14px, 1.4vw, 20px)"
  step-3: "clamp(22px, 2.2vw, 32px)"
  step-4: "clamp(34px, 3.4vw, 52px)"
  step-5: "clamp(48px, 5vw, 78px)"
  section: "clamp(76px, 9vw, 150px)"
  gutter: "clamp(22px, 5vw, 88px)"
  content-max: "1180px"
components:
  button-primary:
    backgroundColor: "{colors.antique-gold}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "17px 38px"
  button-primary-hover:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper-stone}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.antique-gold}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "17px 38px"
  button-outline-hover:
    backgroundColor: "{colors.antique-gold}"
    textColor: "#ffffff"
  button-gold:
    backgroundColor: "{colors.champagne-gold}"
    textColor: "{colors.ink-black}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "17px 38px"
  button-gold-hover:
    backgroundColor: "{colors.paper-stone}"
    textColor: "{colors.ink-black}"
  button-ghost-dark:
    backgroundColor: "transparent"
    textColor: "{colors.paper-stone}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "17px 38px"
  button-ghost-dark-hover:
    backgroundColor: "{colors.champagne-gold}"
    textColor: "{colors.ink-black}"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "11px 2px"
  nav-cta:
    backgroundColor: "transparent"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.none}"
    padding: "11px 22px"
  portal-card:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.app-md}"
    padding: "clamp(1.5rem, 5vw, 2.5rem)"
  course-card:
    backgroundColor: "{colors.course-card}"
    textColor: "{colors.course-cream}"
    rounded: "{rounded.app-sm}"
    padding: "24px"
---

# Design System: Lisa Fit Method

## Overview

**Creative North Star: "The Modern Strength Atelier"**

A premium, editorial training space that has the warmth of a private studio and the precision of a well-designed strength program. Ivory paper, ink black, muted gold, elegant serif headlines, atmospheric gym photography, and refined layouts. It should feel sophisticated and athletic, never clinical and never over-decorated. The public site reads as one long document, not a stack of modules. Every section opens the same way, sits on the same grid and shares one spacing ramp, so no section looks like it was added later.

The system has three registers that share one palette family. The **public site** (the Atelier proper) is about three-quarters light: warm paper where the reading happens, with the black ground saved for the moments that earn drama (the opening, the bundle, the closing ask, the footer). The **coaching portal** (`/my-coaching`) stays on the same warm light ground, but it serves clarity, usability and effortless one-handed mobile use over decoration. The **course world** (Training Foundations, Masterclass and the admin area) is a separate dark, luxury register: charcoal, cream and gold, with Cormorant Garamond and Montserrat.

Density is generous on the public site (long line-heights, wide section padding, light 300-weight body text) and tighter in the portal and admin, where the job is getting a task done.

**Key Characteristics:**
- One accent family (gold) on ivory and black. No other brand hues.
- Square corners, hairline rules and underline inputs on the public site. No boxes and no shadows.
- Serif display type, light sans body text, and small wide-tracked uppercase labels.
- Slow, eased motion (`cubic-bezier(0.16,1,0.3,1)`): ink-fill buttons, drawn rules, line-by-line reveals. Every animation respects reduced motion.
- Tone changes between dark and light sections blend across an eased gradient band, never on a hard edge.

## Colors

A restrained palette of warm neutrals and a single gold accent, defined twice: a warm editorial set for the public site and portal, and a darker luxury set for the course world.

### Primary
- **Antique Gold** (`antique-gold`): The working accent on light grounds. Primary button fill, eyebrows, italic emphasis inside headlines, link text and underlines, price figures, list markers. It is darker than Champagne Gold so it holds contrast on ivory.
- **Champagne Gold** (`champagne-gold`): The accent on the dark ground. Eyebrows, links, the gold button and figure values on black sections. In the portal it is the accent for progress, spinners and highlights.

### Neutral
- **Ink Black** (`ink-black`): The dark ground (opening, bundle, closing, footer, mobile nav sheet), the hover fill of the primary button, and the theme color.
- **Warm Ivory** (`warm-ivory`): The default page ground and portal background.
- **Paper Stone** (`paper-stone`): The alternate light ground for sections that need separating, and the text color on dark grounds (applied at 58–88% opacity for secondary text).
- **Ink Text** (`ink-text`): Headlines and lede text on light grounds.
- **Warm Taupe** (`warm-taupe`): Body copy, labels and secondary text on light grounds.
- **Portal Hairline** (`portal-hairline`): Card borders and dividers in the coaching portal.
- **Hairline rules** (`rgba(26,26,26,0.13)` on light, `rgba(245,242,238,0.14)` on dark): The only divider on the public site.

### Course World
- **Course Charcoal / Course Card** (`course-charcoal`, `course-card`): Grounds and raised surfaces in Training Foundations, Masterclass and admin.
- **Course Hairline** (`course-hairline`): Borders, dividers and scrollbar thumbs.
- **Course Cream** (`course-cream`): Primary text on the dark course grounds.
- **Course Gold / Course Gold Light** (`course-gold`, `course-gold-light`): Accents, active states and headings in the course world.
- **Course Muted** (`course-muted`): Secondary text.

### Status (functional only)
- **Success Green** (`status-success`): Done, logged, on track, goal reached.
- **Warning Terracotta** (`status-warning`): Attention needed, a figure moving the wrong way.
- **Error Red** (`status-error`), with **Error Rose** (`status-error-on-dark`) on dark grounds: failures, destructive actions, unread badges in admin.

### Named Rules
**The One Accent Rule.** Gold is the only brand hue. New colors or fonts need Lisa's explicit approval. Tints of the existing tokens at reduced opacity are how the system gets its range.

**The Status-Only Rule.** Green, terracotta and red exist only to report state (success, warning, error). They are never decoration, never brand, and never appear on the public marketing pages.

**The Two Golds Rule.** Use Antique Gold on light grounds and Champagne Gold on dark grounds. Swapping them breaks contrast in one direction or the other.

**The Readable Contrast Rule.** On the coaching platform and in all new work, text meets WCAG 2.2 AA: 4.5:1 for text under 24px (under 18.66px if bold), and 3:1 for larger text and for UI marks such as borders, icons and focus rings. Measured on light grounds: Warm Taupe passes for text of any size (5.4:1 on ivory, 5.7:1 on white). Antique Gold (3.1:1 on ivory), Success Green (3.2:1 on white) and Warning Terracotta (3.2:1 on white) pass only as large text or as marks. Champagne Gold on ivory (2.1:1) fails as both text and marks. Small text therefore uses Ink Text or Warm Taupe, and color is never the only signal of state: always pair it with a word or an icon.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** DM Sans (with system-ui, sans-serif)
**Course World:** Cormorant Garamond (headings) and Montserrat (body), loaded in the root layout via `next/font`

**Character:** A high-contrast editorial serif set at medium weight with slightly tight tracking, paired with a light, airy geometric sans. The serif carries the authority and the sans gets out of the way.

### Hierarchy
- **Display** (500, `clamp(2.5rem, 6.2vw, 5.6rem)`, 1.04): Homepage hero only, max 18ch. Inner-page heroes step down to `clamp(2.2rem, 5vw, 4.2rem)`, max 20ch.
- **Headline** (500, `clamp(1.95rem, 4.1vw, 3.5rem)`, 1.04): Every section heading. Words in `<i>` render italic in gold.
- **Title** (500, `clamp(1.2rem, 1.8vw, 1.72rem)`, 1.18): Subsection heads, module rail titles, FAQ questions.
- **Lede** (300, `clamp(1.05rem, 1.4vw, 1.3rem)`, 1.66): The opening paragraph under a heading, in Ink Text. Max about 62ch.
- **Body** (300, `clamp(0.95rem, 1.05vw, 1.0625rem)`, 1.82): Prose in Warm Taupe. Max 56–72ch.
- **Label / Eyebrow** (600, 10.5px, 0.28em tracking, uppercase): Section eyebrows, in Antique Gold on light and Champagne Gold on dark. Form labels and figure labels use the same treatment at 9.5–10px.
- **Button** (600, 11px, 0.2em tracking, uppercase): All buttons and text links.

Headings use `text-wrap: balance` globally.

### Named Rules
**The Same Opening Rule.** Every public section opens with eyebrow, then a short drawn gold rule (54px), then the headline. Repeating one opening is most of what makes the site read as one document.

**The Light Body Rule.** Body copy is weight 300. Emphasis comes from the serif and from gold italics, never from bold body text.

**The Readable Floor Rule.** On the coaching platform and in new work, secondary labels (eyebrows, field labels, figure labels, metadata) are at least 12px, and body text is 16px, the preferred size everywhere and especially on mobile. Some existing portal and admin screens fall below this. They will be brought up as part of the coaching platform UI/UX work, not changed piecemeal.

## Layout

Everything is driven by one set of fluid custom properties on the `.pv-d` root (`src/components/preview/d/StylesD.tsx`):

- **One gutter** (`spacing.gutter`), shared by every section and the nav, so every left edge lines up down the page.
- **One content width** (`spacing.content-max`), widening to 1340px with a larger gutter above 1800px.
- **One section padding** (`spacing.section`). Sections never set their own vertical padding.
- **One spacing ramp** (`step-1` to `step-5`) for everything inside a section. The section opening sits `step-5` above its content.

Lists, module runs and Q&A are **hairline-ruled rows**, not grids of cards. The numbered module rail is a 76px number column plus content, and collapses to a single column under 680px. Two-column lists and forms collapse to one column at 760px and 560px. The nav switches to a burger and full-screen black sheet under 960px.

Full-bleed photography sits in `PhotoBand` (parallax, `clamp(300px, 46vh, 520px)`, 72vw tall on phones) or as a low-opacity `Atmosphere` backdrop behind a section, scrimmed into its ground over a 30px landing.

The coaching portal is a single mobile-first column of rounded cards. Prioritize thumb reach and legible type over layout expression.

### Named Rules
**The Seamless Ground Rule.** Never change tone (light to dark) on a hard edge. Use `ToneShift`, a smoothstep-eased gradient band (`clamp(42px, 9vw, 150px)`, 20px on phones) whose halves carry `data-tone` so the nav flips at the midpoint.

**The Three-Quarters Light Rule.** Most of a public page is paper. Dark grounds are reserved for the opening, the bundle, the closing ask and the footer.

## Elevation & Depth

The public site is flat. Depth comes from tonal grounds (ivory, stone, black), photography, a 4% fractal-noise grain over dark sections (`mix-blend-mode: overlay`), and scroll parallax, not shadows. The only shadow is the condensed nav's inset hairline, together with a 16px backdrop blur over a translucent ground. The portal and course world are also essentially flat, separating surfaces with hairline borders and tonal steps (`course-charcoal` to `course-card`).

### Shadow Vocabulary
- **Nav hairline** (`box-shadow: inset 0 -1px 0 rgba(26,26,26,0.1)` on light, `inset 0 -1px 0 rgba(200,169,126,0.18)` on dark): The bottom edge of the condensed, blurred nav. Nowhere else.

### Named Rules
**The No-Box Rule.** On the public site, separate content with hairline rules and space, never with drop shadows or bordered cards.

## Shapes

The public site is strictly square: buttons, inputs, nav CTA and photographs all have 0 radius. The only circles are small dots and avatar-like marks (`50%`). Rules are 1px hairlines. The accordion's plus sign is drawn from two 1px strokes.

The coaching portal and admin use gentle rounding for an app-like, touch-friendly feel: 8px (`app-md`) on cards and panels, 4px (`app-sm`) on inputs and small controls, and pill or 50% shapes only for badges and spinners.

**The Square Atelier Rule.** Square corners on every public page. Rounded corners belong to the portal, course and admin apps only.

## Components

Refined and restrained. Components never call attention to themselves beyond the one gold action.

### Buttons
- **Shape:** Square (0 radius), 17px × 38px padding, 11px uppercase label at 0.2em tracking.
- **Primary:** Antique Gold fill with white text. This is the default call to action on light grounds.
- **Hover:** An ink fill rises from the bottom (`scaleY` 0→1 over 620ms, `cubic-bezier(0.16,1,0.3,1)`), and the label color crossfades over 560ms.
- **Outline:** A gold hairline border (`rgba(168,137,94,0.45)`) with gold text; fills with gold on hover.
- **Gold (dark grounds):** Champagne Gold fill with black text; fills with Paper Stone on hover.
- **Ghost dark:** A Champagne Gold hairline border with stone text; fills with gold on hover.
- **Text link:** Uppercase gold label with a 1px underline; the gap to its arrow widens from 9px to 17px on hover, and the color shifts to ink (or stone on dark).

### Navigation
A fixed bar that samples the `data-tone` of the section underneath it and switches between ink-on-light and stone-on-dark. When scrolled it condenses (padding 26px → 12px) onto a translucent blurred ground. The wordmark is Playfair at 0.26em tracking. Links are 11px uppercase with a gold underline that draws in from the left on hover. The CTA is a square hairline-bordered button that fills solid on hover. Under 960px it becomes a burger that opens a full-screen black sheet with Playfair links separated by gold hairlines.

### Inputs / Fields
- **Style:** Underline only: transparent background, 1px bottom rule, square, 11px × 2px padding, 1rem light text, placeholder at 28% ink.
- **Focus:** The underline shifts to Antique Gold (420ms).
- **Labels:** 10px uppercase taupe at 0.18em tracking, 9px above the field.
- **Submit:** Primary-button styling, 0.6 opacity when disabled.

### Lists, Rails and Accordions
- **Marker list:** Hairline-separated rows with a gold `→` or `✓` marker. One reveal for the whole list, never a per-item stagger.
- **Module rail:** A large Playfair number in faded gold, a tag eyebrow, a title, a description and a two-column arrow list.
- **Accordion:** Rows ruled top and bottom. The plus turns into a minus on open, and the panel expands by animating `grid-template-rows` over 620ms.

### Figures and Prices
One stat treatment everywhere: a Playfair value in gold, a 9.5px uppercase label below, and hairline dividers between figures. Prices use the same style at `clamp(2.6rem, 4.6vw, 3.9rem)`, with any struck-through "was" price shown at 30% opacity. Price values always come from `@/lib/pricing`.

### Portal Card (coaching portal)
A white card with a Portal Hairline border, 8px radius and fluid padding, on a Warm Ivory ground. Section labels are small uppercase DM Sans; key numbers are bold Playfair. Status colors mark progress only.

**The Thumb Target Rule.** Every tap target on the coaching platform is at least 44×44px, well above the WCAG 2.2 AA minimum of 24px, with at least 8px between neighbouring targets. Clients log sets one-handed mid-workout, so primary actions sit within thumb reach. Every interactive element shows a visible focus ring that meets 3:1 contrast.

### Course Card (course world and admin)
A Course Card surface with a Course Hairline border, 4–8px radius, Course Cream text, Cormorant headings and Montserrat body and labels.

## Do's and Don'ts

### Do:
- **Do** build public sections from the shared furniture in `src/components/preview/d/Sections.tsx` (`SectionD`, `OpenD`, `MarkerListD`, `ModuleRailD`, `PriceBlockD`, `QaListD`) so new pages inherit the rhythm.
- **Do** use only the `--d-*` spacing ramp, `--d-gutter` and `--d-max` for spacing and width on public pages.
- **Do** put `ToneShift` between every light and dark ground, and set `data-tone` on every section so the nav can read it.
- **Do** use Antique Gold for accents on light grounds and Champagne Gold on dark grounds.
- **Do** honor `prefers-reduced-motion` in every reveal, rule and transition. The existing `Reveal`, `RevealLines` and `DrawRule` already do.
- **Do** make coaching platform screens easy to read and use on a phone mid-workout: secondary labels at 12px or larger, body text at 16px, AA contrast, and tap targets of at least 44×44px (see the Readable Floor, Readable Contrast and Thumb Target rules).
- **Do** use status colors only to report state.

### Don't:
- **Don't** introduce new colors or fonts without Lisa's explicit approval.
- **Don't** round corners, add drop shadows or wrap content in bordered cards on public pages.
- **Don't** change tone on a hard edge between sections.
- **Don't** use bold body text. Use the serif or gold italics for emphasis.
- **Don't** use green, terracotta or red on the public marketing pages, or anywhere as decoration.
- **Don't** mix the course world's Cormorant and Montserrat into the public site, or the public site's Playfair and DM Sans into course modules.
- **Don't** use fast, bouncy or springy easing. Motion here is slow and settles.
