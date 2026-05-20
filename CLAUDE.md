# Lisa Fit Method — Claude Instructions

## First instruction on every task
Before doing anything else, always run:
```
git pull origin main
```
This is a multi-agent repo. Other agents and Vercel may have pushed changes since the last session. Never skip this step.

---

## Project overview
- **Site:** lisafitmethod.com
- **Stack:** Plain HTML + CSS (no build tools, no framework)
- **Hosting:** GitHub Pages, auto-deploys when pushed to `main`
- **Repo:** github.com/lisapiel/lisafitmethod
- **Owner:** Lisa McPherson — not a software engineer. Manage all git operations (pull, commit, push, status) on her behalf without being asked.

---

## Git & deployment workflow

Lisa does not manage git manually. Always handle the full cycle:

1. `git pull origin main` — always first
2. Make changes
3. `git add <specific files>` — never `git add .` blindly
4. `git commit -m "descriptive message"`
5. `git push origin main` — this triggers auto-deploy to GitHub Pages

After pushing, the live site at lisafitmethod.com updates within ~1–2 minutes. Confirm the push succeeded and mention the site will be live shortly.

If there are uncommitted changes already in the repo, surface them to Lisa before proceeding so nothing gets lost.

---

## File structure

```
/
├── index.html                    # Main landing page
├── CNAME                         # Custom domain (lisafitmethod.com)
├── LFM_landscanp_photo_copy.png  # Hero photo asset
└── training-foundations/
    ├── index.html                # Training section entry / password gate
    ├── module1.html
    ├── module2.html
    ├── module3.html
    └── module4.html
```

**Adding new pages or sections:** create a new folder (e.g. `/coaching/index.html`) following the same pattern. Keep assets (images, icons) co-located in the folder they belong to, or in a shared `/assets/` folder if used across sections.

---

## Component philosophy (plain HTML)

This is a plain HTML site — no React, no templating engine. To keep things scalable and consistent:

- **Shared CSS variables** live in a `<style>` block at the top of each page inside `:root {}`. Keep brand tokens (colors, fonts) identical across all pages — copy from the reference below.
- **Repeated UI blocks** (nav, footer, section headers) should be written as clearly commented HTML blocks that can be copied and updated across pages. Mark them with `<!-- COMPONENT: nav -->` style comments so they're easy to find and sync.
- **No inline styles** — always use CSS classes.
- **When a pattern appears 3+ times**, extract it into a reusable CSS class rather than duplicating styles.

If the site grows to 10+ pages, flag to Lisa that a static site generator (like Eleventy or plain HTML includes via a simple build script) should be considered to avoid manual duplication.

---

## Brand tokens

### Main site (index.html) — warm, editorial
```css
:root {
  --black: #0a0a0a;
  --off-white: #f5f2ee;
  --warm-white: #faf8f5;
  --accent: #c8a97e;
  --accent-dark: #a8895e;
  --text: #1a1a1a;
  --muted: #6b6560;
}
/* Fonts: Playfair Display (headings), DM Sans (body) */
```

### Training Foundations — dark, luxury
```css
:root {
  --black: #0a0a0a;
  --dark: #111111;
  --card: #161616;
  --border: #2a2a2a;
  --cream: #f0e6d3;
  --gold: #c9a96e;
  --gold-light: #e8c98a;
  --muted: #888888;
}
/* Fonts: Cormorant Garamond (headings), Montserrat (body) */
```

Never introduce new colors or fonts without Lisa's explicit approval.

---

## Code standards

- No JavaScript frameworks — vanilla JS only, and only when necessary
- CSS: mobile-first, use CSS Grid and Flexbox
- Images: always include `alt` text, use `object-fit: cover` for hero images
- No comments explaining what the code does — only add a comment if the reason behind something is non-obvious
- Keep HTML semantic (`<section>`, `<nav>`, `<main>`, `<footer>`)

---

## Multi-agent awareness

Multiple agents may work on this repo. Before starting any task:
- Check `git status` and `git log --oneline -5` for recent changes
- If there are unexpected files or uncommitted changes, surface them to Lisa before touching anything
- Never force-push or rewrite history
- Always prefer small, focused commits over large batches
