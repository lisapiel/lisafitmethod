// Verbatim copy from the live homepage.
//
// SOURCE OF TRUTH: src/app/page.tsx (plus src/components/SiteHeader.tsx and
// src/components/SiteFooter.tsx for the chrome). Every string below is
// transcribed character for character from production. Prices come from
// @/lib/pricing and siteSettings, exactly as production derives them, so a
// price can never drift here.
//
// RULE FOR THIS FILE: nothing in it may be rewritten, shortened, merged or
// "improved". Direction C is a visual redesign only. The check in
// scripts/compare-copy.mjs diffs the rendered prototype against the rendered
// production page and fails on any difference.
import {
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
} from "@/lib/pricing"

export const PRICES = {
  courseRegular: COURSE_REGULAR_PRICE_DISPLAY,
  nutritionNow: NUTRITION_COURSE_PRICE_DISPLAY,
  nutritionRegular: NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  bundleNow: BUNDLE_PRICE_DISPLAY,
  bundleTotal: BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  bundleSavings: BUNDLE_SAVINGS_DISPLAY,
}

// ── Header (src/components/SiteHeader.tsx) ────────────────────────────────
export const HEADER = {
  wordmark: "Lisa Fit Method",
  links: [
    { href: "/about", label: "About" },
    { href: "/courses", label: "Courses" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
  ],
  mobileLinks: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Me" },
    { href: "/courses", label: "Courses" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
  ],
  mobileCtaCourses: "Explore Courses",
  mobileCtaCoaching: "Apply for Coaching",
  logIn: "Log In",
}

// ── Hero ──────────────────────────────────────────────────────────────────
export const HERO = {
  eyebrow: "Strength · Nutrition · Coaching",
  headlineLine1: "Build a stronger body",
  headlineLine2: "with a plan that actually fits you.",
  lede: "Learn the system on your own with structured training and nutrition courses, or work with me 1:1 for a plan built completely around you.",
  sub: "Every approach adapts to your goals, experience, schedule, equipment, and any injuries or limitations you're working around.",
  ctaPrimary: "Explore Courses",
  ctaSecondary: "1:1 Coaching",
  metaCourses: "From $77 · one-time payment",
  metaCoaching: "From $397/month",
}

// ── Choose your path ──────────────────────────────────────────────────────
export const PATH = {
  heading: "Choose how you want to start.",
  cards: [
    {
      href: "/courses",
      eyebrow: "Self-Guided Courses",
      body: "Training and nutrition education you can follow at your own pace.",
      price: "From $77 · one-time payment",
      cta: "Explore Courses →",
    },
    {
      href: "/coaching",
      eyebrow: "1:1 Coaching",
      body: "A custom plan, weekly check-ins, form feedback, and direct support.",
      price: "From $397/month",
      cta: "Explore Coaching →",
    },
  ],
}

// ── Story ─────────────────────────────────────────────────────────────────
export const STORY = {
  eyebrow: "Why this exists",
  heading: "I learned the hard way so you don't have to.",
  paragraphs: [
    "I trained for years chasing hard workouts, thinking more was better. I had no real system, no structure, just effort and I wasn't seeing the results I wanted.",
    "Then I hurt my back lifting. I was in pain every day for over 8 months. I couldn't train the way I used to or even trust my own body. If you've ever been injured like that, you know it's not just physical. You start wondering what's safe, what's making it worse, and whether you'll ever feel like yourself again. So I did what my brain naturally does. As an engineer, I've always needed to understand how things work, so I went deep into everything I had skipped for too long. Movement quality, warm-ups, mobility, stability, progressive overload, recovery, nutrition, and how to build strength without constantly beating your body up.",
    "I rebuilt slowly and came back stronger than ever, moving better, and with a body that finally reflected the work I was putting in.",
    "That experience changed everything. It's why I became a certified personal trainer, and it's why I created Lisa Fit Method. Because most people don't need more random workouts. They need structure, a plan that makes sense for their body, and a real understanding of what they're doing and why it matters. That's the approach I use to help my clients get stronger, move better, lose fat, build visible muscle definition, and feel more confident in their training.",
  ],
  link: "My full story →",
  quote: "Your body isn't the problem. The plan is.",
  cite: "Lisa McPherson, CPT",
}

// ── Courses ───────────────────────────────────────────────────────────────
export const COURSES_HEAD = {
  eyebrow: "The Courses",
  heading: "Train at your own pace.",
  // Replaced at Lisa's instruction, 20 Oct. The previous line was
  // "Everything I had to learn the hard way, organized into a system."
  sub: "Self-guided training and nutrition courses designed to help you learn, apply, and progress with structure.",
}

export const COURSES = [
  {
    key: "training",
    eyebrow: "Training Foundations",
    title: "Learn to train with structure, so your effort finally goes somewhere.",
    points: [
      "Foundation Movements. The movement patterns every strong body is built on.",
      "Core & Glute Priority. Spinal stability, stronger glutes, and better posture under load.",
      "The Training Program. Fully structured workouts with sets, reps, warm-ups, progression guidance, and built-in workout tracking so you can clearly see your progress over time.",
      "Works from home or the gym. Dumbbells and bands are enough to start.",
    ],
    tag: "LIMITED TIME",
    ctaPrimary: "Get Instant Access",
    ctaSecondary: "Explore the Course",
    buyHref: "/checkout",
    exploreHref: "/courses",
    footnote:
      "Includes 50+ exercise videos, built-in workout and progress tracking, full warm-ups and cool-downs, progression guidance, and ongoing access.",
  },
  {
    key: "nutrition",
    eyebrow: "Nutrition Foundations",
    title: "Eat to match your training, without overthinking it.",
    points: [
      "Interactive calorie and macro calculator, personalized to your stats.",
      "4-week meal plan that scales to your calorie target.",
      "Science-backed education. No bro-science.",
      "Eating out, supplements, and troubleshooting guides for real life.",
    ],
    tag: "LIMITED TIME",
    ctaPrimary: `Get Instant Access · ${NUTRITION_COURSE_PRICE_DISPLAY}`,
    ctaSecondary: "Explore the Course",
    buyHref: "/checkout?product=nutrition",
    exploreHref: "/nutrition",
    footnote: "One-time payment. Buy once, access anytime.",
  },
]

// ── Foundations bundle ────────────────────────────────────────────────────
export const BUNDLE = {
  eyebrow: "Foundations Bundle",
  badge: "Best Value",
  headingLine1: "Train right.",
  headingLine2: "Eat to match.",
  body: "The Complete Foundations Bundle: both courses together. Training Foundations gives you the movement system. Nutrition Foundations gives you the eating strategy. And if you upgrade to 1:1 coaching within 90 days, the full $137 credits toward your first coaching month.",
  tileTrainingLabel: "Training Foundations",
  tileTrainingValueSuffix: " value",
  tileNutritionLabel: "Nutrition Foundations",
  tileNutritionValue: `${NUTRITION_COURSE_PRICE_DISPLAY} value`,
  savings: `You save ${BUNDLE_SAVINGS_DISPLAY}`,
  cta: "Get Both Courses",
  note: "One-time payment · Buy once, access anytime",
  upsellLead: "Want a plan built completely around you?",
  upsellLink: "Explore 1:1 coaching.",
  href: "/checkout?product=bundle",
}

// ── Common questions ──────────────────────────────────────────────────────
export const FAQ_HEAD = {
  eyebrow: "Common Questions",
  headingLine1: "Good questions.",
  headingLine2: "Straight answers.",
  link: "See all questions →",
}

export const FAQS = [
  {
    q: "How does 1:1 coaching actually work?",
    a: "You apply, I review, and if we are a good fit I build your program from scratch around your goals, schedule, equipment, and history. Every week you complete a check-in and I adjust based on what's working. You can message me anytime between check-ins.",
  },
  {
    q: "Do I need gym experience to start the courses?",
    a: "None at all. Training Foundations starts from the very beginning and builds from there. If you have been training for a while you will still find things here that fix how you move and change how you progress.",
  },
  {
    q: "Can I try the courses before committing to coaching?",
    a: "Yes, and most of my coaching clients did exactly that. The Complete Foundations Bundle is a great on-ramp — it's $137 one-time and if you upgrade to 1:1 coaching within 90 days, the full $137 credits toward your first coaching month. It's also a good way to see how I teach before committing to 1:1 work.",
  },
  {
    q: "How is this different from a workout app?",
    a: "Weekly check-ins plus messaging anytime between them. I personally review every workout and every check-in and I adjust your program based on what's actually working. Real answers, usually same day. No generic algorithm-generated programs.",
  },
]

// ── Final call to action ──────────────────────────────────────────────────
export const FINAL = {
  eyebrow: "Ready to start?",
  headingLine1: "Stop guessing.",
  headingLine2: "Start training with someone who actually knows your body.",
  body: "Apply for 1:1 coaching and get a fully custom program, weekly check-ins, and real accountability from someone who will actually be there.",
  cta: "Apply for Coaching",
  note1: "Coaching from $397/month. Applications reviewed personally within 48 hours.",
  note2: "I keep my coaching roster intentionally small so every client gets personal attention.",
  altLead: "Prefer a self-guided approach?",
  altLink: "Explore the courses.",
  href: "/coaching#apply",
}

// ── Footer (src/components/SiteFooter.tsx) ────────────────────────────────
export const FOOTER = {
  wordmark: "Lisa Fit Method",
  tagline:
    "Strength training built on movement quality, real structure, smart progression, and a body that lasts.",
  instagram: "@lisafitmethod ↗",
  instagramHref: "https://instagram.com/lisafitmethod",
  siteLabel: "Site",
  siteLinks: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/courses", label: "Courses" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
  membersLabel: "Members",
  memberLinks: [
    { href: "/login", label: "Member Login" },
    { href: "/checkout", label: "Get The Course" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/licensing", label: "Licensing & Copyright" },
  ],
}
