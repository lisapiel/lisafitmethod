# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Adults, roughly 30 and over, men and women alike. Do not gender the audience. They are already trying: they train, but without a plan. They do random workouts, struggle with consistency, and aren't getting results for the effort they put in. Many are working around an injury or physical limitation and aren't sure what is safe. They train at home or in a gym, often with minimal equipment (dumbbells and bands are enough to start).

The job: get stronger, move better, lose fat and build visible muscle with a structure that fits their body, schedule, equipment and history, and understand *why* it works so the effort finally goes somewhere.

Secondary audiences that the product serves directly:
- **Course buyers** working through the self-guided courses at their own pace.
- **Coaching clients** in the client portal (`/my-coaching`): check-ins, workouts, nutrition, progress, messages.
- **Masterclass members** (once it launches; it is not public yet) who know the basics and want new programming each month.
- **Lisa herself**, as the sole operator of a large admin area (`/admin`: coaching clients, programs, check-ins, blog, testimonials, leads, promo codes).

## Product Purpose

Lisa Fit Method gives people structure: strength training built on movement quality, real structure, smart progression, and a body that lasts. Success means a client who was spinning their wheels trains consistently, progresses measurably, and trusts their body again.

**1:1 coaching is the main business.** The self-guided courses are the on-ramp: people start on their own at their own pace, and buyers of the Complete Foundations Bundle get the full bundle price as a coaching credit. The credit applies only to the initial 3-month coaching commitment, taken up within 90 days of buying the bundle, and it is credited against the first coaching month. Month-to-month coaching is not eligible. The binding conditions are in the Terms (`/terms`). When in doubt, a surface should move people towards coaching, with courses as the lower-commitment way in.

Offers (prices live in `@/lib/pricing` and site settings, never hard-coded):
- **1:1 Coaching**: application-based, custom program, weekly check-ins, form feedback, messaging between check-ins. Small roster on purpose; applications reviewed personally within 48 hours.
- **Training Foundations**: self-guided course (foundation movements, core and glute priority, a structured program with built-in tracking, 50+ exercise videos).
- **Nutrition Foundations**: self-guided course (calorie/macro calculator, scalable 4-week meal plan, eating out, supplements, troubleshooting).
- **Complete Foundations Bundle**: both courses, with the coaching credit (initial 3-month coaching commitment only, within 90 days).
- **Masterclass**: **not publicly launched.** Its pages are hidden behind a launch flag and visible only to Lisa and admins. Don't link to it or promote it on public pages until Lisa launches it. Planned as a monthly subscription: A new 3-day program each month, 361 exercise videos, monthly batched Q&A with Lisa. Assumes the basics; Training Foundations comes first.
- **Free guides** (training and nutrition) as lead magnets, plus a blog.

## Positioning

A certified personal trainer with an engineer's brain and a real injury-and-rebuild story. Lisa hurt her back lifting, spent over 8 months in daily pain, rebuilt by understanding how the body works, and came back stronger. She teaches the system (the *why*), not just the workout (the *what*). Every plan adapts to goals, experience, schedule, equipment, and injuries or limitations. Courses are a one-time payment, not a subscription app. Coaching is personal: Lisa reviews every workout and check-in herself, no algorithm-generated programs.

Core line from the live site: "Your body isn't the problem. The plan is."

## Operating Context

- Coaching flow: apply → Lisa reviews → acceptance and terms/waiver → payment → setup → weekly check-ins, workouts, nutrition, progress logging and messaging in the client portal. Lisa runs all of it from the admin area.
- Courses are bought through a custom Stripe checkout; a Cognito account is created on purchase and course content is behind login.
- Clients use the training content mid-workout on their phones (the portal and course trackers are logged during sessions).
- Content marketing (short-form video series, blog) feeds the funnel: identity content → follower → education → trust → conversion. See `CONTENT_STRATEGY.md`.

## Capabilities and Constraints

- Stack: Next.js 15 App Router, TypeScript, Tailwind, AWS Amplify Gen 2 (Auth/Cognito, Data), Stripe. Deploys to lisafitmethod.com on push to `main`.
- **Scope of practice:** Lisa is a NASM Certified Personal Trainer, *not* a Registered Dietitian or licensed medical professional. Nutrition content is general education; never present it as medical or dietetic advice, and keep the existing disclaimers.
- **Pricing is Lisa's decision.** Never change, invent or "fix" prices; always read them from `@/lib/pricing` / site settings.
- **Copy is guarded.** Public page copy must not be reworded, shortened, merged or dropped without Lisa's approval. `scripts/copy-baseline/` records it and `node scripts/verify-copy.mjs` checks it.
- Home, About and Blog are signed off as final. Don't change their layout or section order unless Lisa asks.
- Terminology: "1:1 Coaching", "Training Foundations", "Nutrition Foundations", "Complete Foundations Bundle", "Masterclass", "check-in", "block" (a Masterclass monthly program).
- Currency is USD; the site is in English.

## Brand Commitments

- Name and wordmark: **Lisa Fit Method**. Lisa speaks in the first person on the site.
- Voice (from `CONTENT_STRATEGY.md`): intelligent, dry, calm; non-performative; introvert-confident; engineer brain in a fitness context. *Not* hyper-sexualized, loud or chaotic, motivational-poster energy, or "wellness girl". Plain answers, no bro-science.
- The brand colors and fonts in `CLAUDE.md` (main site, and the darker Training Foundations world) are binding. New colors or fonts need Lisa's explicit approval.

## Evidence on Hand

- **Client testimonials**: real, managed in admin → Testimonials (`/admin/testimonials`). Use only those; never write or paraphrase new ones.
- **Certification**: NASM Certified Personal Trainer.
- **Lisa's own photos and video**: `public/` (e.g. `lisa-about-hero.jpg`, `lisa-coaching-hero.jpg`, `hero.png`, portal screenshots `portal-mobile-*.jpg`), plus the exercise video library (50+ in Training Foundations, 361 in Masterclass).
- **Lisa's story**: the back injury and rebuild, told in her own words in the homepage copy (`src/components/preview/c/productionCopy.ts`).
- **Not available, never fabricate:** client before/after photos, client counts or success statistics, press mentions, star ratings or review aggregates, guarantees of results.

## Product Principles

1. **Structure over effort.** Every surface should make the plan and the progression visible, not sell intensity.
2. **Explain the why.** Teaching the system is the difference from apps; prefer clarity and understanding over hype.
3. **Personal, not automated.** Lisa's direct involvement is the product. Never imply algorithms or a faceless team.
4. **Courses are the on-ramp, coaching is the destination.** Lower the barrier to start, and make the path up to coaching obvious.
5. **Safe for real bodies.** Respect injuries and limitations; stay inside a trainer's scope of practice.

## Accessibility & Inclusion

No specific standard has been set yet (open decision). Known needs: the audience is 30+, so text has to be easy to read; workout and tracking screens are used one-handed on a phone mid-session; the language should include people working around injuries or limitations without assuming a body type or gender.
