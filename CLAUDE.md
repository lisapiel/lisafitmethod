# Lisa Fit Method — Claude Instructions

This repository contains **Lisa Fit Method**, a Next.js 15 application using the App Router, TypeScript, Tailwind CSS, and AWS Amplify for authentication and data. The site is hosted on AWS Amplify and serves lisafitmethod.com.

Before starting any new task, re-read this `CLAUDE.md` file in full so the latest conventions stay top-of-mind. Do not rely on memory from earlier sessions.

---

## First instruction on every task

Before doing anything else, always run:
```
git pull origin main
```
This is a multi-agent repo. Other agents and Amplify may have pushed changes since the last session. Never skip this step. Also check `git status` and `git log --oneline -5` for unexpected state before touching anything.

---

## Project overview

- **Site:** lisafitmethod.com
- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, AWS Amplify Gen 2
- **Hosting:** AWS Amplify — auto-deploys when pushed to `main`
- **Repo:** github.com/lisapiel/lisafitmethod
- **Owner:** Lisa McPherson — not a software engineer. Manage all git operations (pull, commit, push, status) on her behalf without being asked.

---

## Development workflow

- Re-read this `CLAUDE.md` file before every task.
- Review `BUILD_ERRORS.md`, `RUNTIME_ERRORS.md`, and `LOGIC_BUGS.md` (if they exist) before starting any task to avoid repeating past mistakes.
- Use **Node.js 20+** and install dependencies with `npm install`.
- Start local development with `npm run dev`. The app is served at http://localhost:3000.
- Build for production with `npm run build` and serve using `npm start`.
- Before reporting any code change as complete, run `npm run lint && npx tsc --noEmit` to catch errors. Amplify CI will reject builds that fail these checks.
- When a CI build fails, reproduce locally before diagnosing from truncated build logs.

---

## Git & deployment workflow

Lisa does not manage git manually. Always handle the full cycle:

1. `git pull origin main` — always first
2. Make changes
3. `git add <specific files>` — never `git add .` blindly; never commit `node_modules`, `.next/`, or `.amplify/`
4. `git commit -m "descriptive present-tense message"`
5. `git push origin main` — this triggers an Amplify CI build and auto-deploy to lisafitmethod.com

After pushing, the Amplify build pipeline runs (typically 2–5 minutes) and the live site updates. Confirm the push succeeded and let Lisa know the site will be live shortly.

If there are uncommitted changes already in the repo, surface them to Lisa before proceeding so nothing gets lost. Never force-push or rewrite history.

---

## Repository structure

```
/
├── src/
│   ├── app/                  # Next.js App Router pages and layouts
│   │   ├── layout.tsx        # Root layout (fonts, global providers)
│   │   ├── page.tsx          # Landing page (/)
│   │   └── training-foundations/
│   │       ├── page.tsx      # Training section entry / auth gate
│   │       ├── module1/page.tsx
│   │       ├── module2/page.tsx
│   │       ├── module3/page.tsx
│   │       └── module4/page.tsx
│   ├── components/           # Shared React components
│   │   └── ui/               # Tailwind + Radix primitives (button, card, etc.)
│   ├── lib/                  # Utilities and AWS Amplify helpers
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets (images, fonts)
├── amplify/                  # Amplify Gen 2 backend definition
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

**Adding new pages or sections:** create a new folder under `src/app/` (e.g. `src/app/coaching/page.tsx`) following the App Router convention. Keep assets in `public/` and reference them with root-relative paths.

---

## Coding conventions

- All code is written in **TypeScript**. No `any` types.
- Use the `@/` alias to reference files under `src/` (e.g., `@/components/Button`).
- Styling is done with **Tailwind CSS**. Use the `cn` helper from `@/lib/utils` to merge class names conditionally.
- Follow existing formatting: two-space indentation, double quotes, no semicolons.
- Prefer functional React components with named exports.
- Use React Server Components by default; add `"use client"` only for interactive components that need browser APIs, event handlers, or state.
- Keep components small. Any self-contained block of ~40+ lines of JSX, any block with its own state/effects, or any block duplicated across two or more parents should be extracted into its own file under the matching `components/` directory.
- Pages should include descriptive `metadata` exports. If a page requires `"use client"`, place the client component in `page.client.tsx` and add a server `page.tsx` that exports `metadata` and renders the client component.
- No JavaScript frameworks beyond the stack — no jQuery, no vanilla DOM manipulation when React handles it.
- Images: always include `alt` text. Use `next/image` for all images so they are optimized automatically.
- No comments explaining what the code does — only add a comment if the reason behind something is non-obvious.
- Keep markup semantic (`<section>`, `<nav>`, `<main>`, `<footer>`).

---

## Brand tokens

Tailwind CSS variables should be defined in `tailwind.config.ts` and referenced as CSS custom properties. Never introduce new colors or fonts without Lisa's explicit approval.

### Main site — warm, editorial
```css
/* Fonts: Playfair Display (headings), DM Sans (body) */
:root {
  --black: #0a0a0a;
  --off-white: #f5f2ee;
  --warm-white: #faf8f5;
  --accent: #c8a97e;
  --accent-dark: #a8895e;
  --text: #1a1a1a;
  --muted: #6b6560;
}
```

### Training Foundations — dark, luxury
```css
/* Fonts: Cormorant Garamond (headings), Montserrat (body) */
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
```

---

## AWS Amplify

- Backend is defined in the `amplify/` directory using Amplify Gen 2 conventions.
- Authentication is handled by Amplify Auth (backed by Amazon Cognito).
- Data models are defined in `amplify/data/resource.ts` using the Amplify Data schema.
- Use `generateServerClientUsingCookies` from `aws-amplify/adapter-nextjs` for server-side data access in App Router pages and layouts.
- Use the `useAuthenticator` hook and Amplify UI components for client-side auth flows.
- Treat Amplify ClientSchema results as transport-only: normalize them through adapters that strip `null`, parse JSON fields, and coerce types before storing in UI state.
- The Amplify CI/CD pipeline deploys from the `main` branch. The domain lisafitmethod.com is managed inside the Amplify console (no CNAME file needed).

---

## Multi-agent awareness

Multiple agents may work on this repo. Before starting any task:
- Run `git pull origin main` and check `git status` and `git log --oneline -5` for recent changes.
- If there are unexpected files or uncommitted changes, surface them to Lisa before touching anything.
- Never force-push or rewrite history.
- Always prefer small, focused commits over large batches.

---

## Technical debt

- Record technical debt items in `TECHNICAL_DEBT.md` with area, impact, plan, and added date.
- Remove entries once resolved; this file tracks active debt only.

---

## Error registries

- Record build errors and their fixes in `BUILD_ERRORS.md`.
- Record runtime errors and their fixes in `RUNTIME_ERRORS.md`.
- Record logic bugs and their fixes in `LOGIC_BUGS.md`.
- After resolving an error, add an entry describing the mistake, the fix, and a rule to avoid recurrence. Create the file if it doesn't exist.
