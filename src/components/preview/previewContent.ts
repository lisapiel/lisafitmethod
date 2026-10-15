// Content for the redesign prototype at /preview.
//
// PROVENANCE RULES for this file — important, because this prototype is a
// design review surface, not a content change:
//
//   * All marketing copy is lifted verbatim from the live site (src/app/page.tsx,
//     src/lib/siteSettings.ts DEFAULTS) or is a typographic re-cut of it. Nothing
//     here invents a claim.
//   * All prices are imported from @/lib/pricing — never hardcoded — so the
//     prototype can never display a price that disagrees with production.
//   * Testimonials carry an explicit `approved` flag. Records that Lisa has not
//     yet published are rendered with a visible DRAFT badge. See TESTIMONIALS below.
//
import {
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
  COACHING_FROM_DISPLAY,
} from "@/lib/pricing"

export const PREVIEW_PRICES = {
  trainingNow: "$97",
  trainingWas: COURSE_REGULAR_PRICE_DISPLAY,
  nutritionNow: NUTRITION_COURSE_PRICE_DISPLAY,
  nutritionWas: NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  bundleNow: BUNDLE_PRICE_DISPLAY,
  bundleWas: BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  bundleSaves: BUNDLE_SAVINGS_DISPLAY,
  coachingFrom: COACHING_FROM_DISPLAY,
}

export const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/coaching", label: "Coaching" },
  { href: "/blog", label: "Journal" },
  { href: "/faq", label: "FAQ" },
]

export const HERO = {
  eyebrow: "Strength · Nutrition · Coaching",
  line1: "Build a stronger body",
  line2: "with a plan that actually fits you.",
  lede: "Learn the system on your own with structured training and nutrition courses, or work with me 1:1 for a plan built completely around you.",
  sub: "Every approach adapts to your goals, experience, schedule, equipment, and any injuries or limitations you're working around.",
  meta: ["From $77 · one-time", "Coaching from $397/month", "Miami · Online worldwide"],
}

export const MANIFESTO = [
  "Structure over intensity",
  "Movement before load",
  "Progress over motivation",
  "A body built to last",
]

// Lisa's real arc, drawn from siteSettings DEFAULTS aboutPara1–5. Condensed
// into timeline beats for the editorial story treatment — no new facts.
export const STORY_TIMELINE = [
  {
    marker: "Engineering",
    title: "Two master's degrees",
    body: "I grew up in France and got two engineering degrees — one in France, one in Canada in renewable energy and energy efficiency. I spent most of my twenties building a career, not a body.",
  },
  {
    marker: "The plateau",
    title: "Years of effort, nothing to show for it",
    body: "Classes, cardio, group workouts in Australia. I was consistent, I worked hard, and I went nowhere. Years of effort without anything to show for it.",
  },
  {
    marker: "Structure",
    title: "Miami, and the thing I'd been missing",
    body: "I started taking strength training seriously for the first time. Structure. Progressive overload. Real programming. My body started changing in a way it never had before.",
  },
  {
    marker: "The injury",
    title: "Almost a year of serious pain",
    body: "I kept adding weight before I had the foundation to support it. Warm-ups felt like a waste of time, mobility wasn't on my radar. Eventually my back gave out — the kind of pain that makes getting out of bed uncomfortable.",
  },
  {
    marker: "The rebuild",
    title: "Certified, pain-free, stronger",
    body: "I rebuilt everything: movement mechanics, warm-up protocols, mobility, real programming logic. I became a certified personal trainer because I needed to genuinely understand what I'd been skipping.",
  },
]

export const STORY_PULLQUOTE = "I'm an engineer by training — I think in systems and structures. That's how I approach programming: the warm-up, the movements, the progression, the recovery. Everything connects."

export const STORY_CREDS = [
  {
    label: "Certified & Evidence-Based",
    body: "Formally trained in movement, programming, and corrective exercise. My background in engineering taught me to approach fitness through systems, structure, and intelligent progression.",
  },
  {
    label: "Rebuilt Through Injury",
    body: "I didn't just study this. I had to rebuild my own body after serious back pain. I know what it feels like when training stops working — and what it takes to come back stronger.",
  },
  {
    label: "Real-World Coaching",
    body: "No gimmicks. No random workouts. Just intelligent training focused on movement quality, long-term progress, and building a body that actually lasts.",
  },
]

// Movement showcase — real published exercise footage from the Training
// Foundations course. These are the actual videos a member watches inside
// Module 1 and Module 2, so the showcase demonstrates the real product
// rather than describing it. Slot keys match published MediaAsset records.
export type MovementSlot = {
  slot: string
  name: string
  pattern: string
  note: string
  module: string
}

export const MOVEMENT_SHOWCASE: MovementSlot[] = [
  {
    slot: "m1_goblet_squat",
    name: "Goblet Squat",
    pattern: "Squat",
    note: "Depth and bracing before load. The pattern every lower-body lift is built on.",
    module: "Module 01",
  },
  {
    slot: "m1_hip_hinge",
    name: "Hip Hinge",
    pattern: "Hinge",
    note: "The movement most people get wrong first — and the reason backs give out.",
    module: "Module 01",
  },
  {
    slot: "m2_rdl",
    name: "Romanian Deadlift",
    pattern: "Hinge · Loaded",
    note: "Hamstrings and glutes under real tension, with a spine that stays neutral.",
    module: "Module 02",
  },
  {
    slot: "m1_db_row",
    name: "Dumbbell Row",
    pattern: "Pull",
    note: "A back that holds posture under load, not just arms that move weight.",
    module: "Module 01",
  },
  {
    slot: "m1_db_bench_press",
    name: "Dumbbell Bench Press",
    pattern: "Push",
    note: "Shoulders in a position they can actually press from, safely, for years.",
    module: "Module 01",
  },
  {
    slot: "m2_hip_thrust",
    name: "Hip Thrust",
    pattern: "Glute-dominant",
    note: "Direct glute loading — the strongest driver of shape and hip stability.",
    module: "Module 02",
  },
  {
    slot: "m2_pallof_press",
    name: "Pallof Press",
    pattern: "Anti-rotation",
    note: "A core that resists movement. This is what protects a spine under load.",
    module: "Module 02",
  },
  {
    slot: "m2_farmers_carry",
    name: "Farmer's Carry",
    pattern: "Carry",
    note: "Grip, bracing, and posture at once. The most transferable thing you can train.",
    module: "Module 02",
  },
]

export const COURSES = [
  {
    key: "training",
    index: "01",
    eyebrow: "Training Foundations",
    title: "Learn to train with structure, so your effort finally goes somewhere.",
    points: [
      "The movement patterns every strong body is built on.",
      "Spinal stability, stronger glutes, and better posture under load.",
      "Fully structured workouts — sets, reps, warm-ups, progression, and built-in tracking.",
      "Works from home or the gym. Dumbbells and bands are enough to start.",
    ],
    now: PREVIEW_PRICES.trainingNow,
    was: PREVIEW_PRICES.trainingWas,
    footnote: "50+ exercise videos, built-in workout and progress tracking, full warm-ups and cool-downs, and ongoing access.",
    buyHref: "/checkout",
    exploreHref: "/courses",
  },
  {
    key: "nutrition",
    index: "02",
    eyebrow: "Nutrition Foundations",
    title: "Eat to match your training, without overthinking it.",
    points: [
      "Interactive calorie and macro calculator, personalized to your stats.",
      "4-week meal plan that scales to your calorie target.",
      "Science-backed education. No bro-science.",
      "Eating out, supplements, and troubleshooting guides for real life.",
    ],
    now: PREVIEW_PRICES.nutritionNow,
    was: PREVIEW_PRICES.nutritionWas,
    footnote: "One-time payment. Buy once, access anytime.",
    buyHref: "/checkout?product=nutrition",
    exploreHref: "/nutrition",
  },
]

export const BUNDLE = {
  eyebrow: "Complete Foundations Bundle",
  title: "Train right. Eat to match.",
  body: "Both courses together. Training Foundations gives you the movement system. Nutrition Foundations gives you the eating strategy. And if you upgrade to 1:1 coaching within 90 days, the full $137 credits toward your first coaching month.",
  now: PREVIEW_PRICES.bundleNow,
  was: PREVIEW_PRICES.bundleWas,
  saves: PREVIEW_PRICES.bundleSaves,
  href: "/checkout?product=bundle",
}

export const COACHING_PILLARS = [
  {
    index: "01",
    title: "Custom programming",
    body: "Training built specifically for your goals, experience level, schedule, equipment, and recovery capacity. Updated as you progress so your body keeps adapting instead of plateauing.",
  },
  {
    index: "02",
    title: "Form review & feedback",
    body: "Send videos of your lifts and I'll break down your technique with detailed cues and corrections — not just what to change, but why.",
  },
  {
    index: "03",
    title: "Check-ins & adjustments",
    body: "Weekly check-ins to adjust training, recovery, workload, or nutrition before small issues become setbacks. Real coaching means adapting as your body evolves.",
  },
  {
    index: "04",
    title: "Direct access to me",
    body: "Questions between check-ins? Message me directly. No outsourced coaching or automated replies — just real guidance when you need it.",
  },
]

export const COACHING = {
  eyebrow: "By application",
  title: "Coaching built around you.",
  body: "Coaching is for people serious about building strength, improving movement quality, and creating long-term results. I keep the roster intentionally small so every client gets real attention, detailed feedback, and programming that evolves as they progress.",
  note: "Applications reviewed personally within 48 hours. No commitment required to apply.",
  href: "/coaching#apply",
}

// ── Testimonials ──────────────────────────────────────────────────────────
//
// `approved: false` means Lisa has NOT published this record yet. As of this
// prototype the production testimonials API returns zero published records —
// both of these exist in the repo as DRAFT (see
// src/app/api/admin/testimonials/seed/route.ts) awaiting her approval.
//
// Any card rendered from an unapproved record MUST show the DRAFT badge. The
// quotes below are the same verbatim text already staged in that seed route;
// no private client detail is added here, and no client is identified beyond
// the first name they already agreed to.
export type PreviewTestimonial = {
  id: string
  name: string
  descriptor: string
  headline: string
  quote: string
  metrics: { value: string; label: string }[]
  videoSlot: string
  approved: boolean
}

export const TESTIMONIALS: PreviewTestimonial[] = [
  {
    id: "gino",
    name: "Gino",
    descriptor: "Online Coaching Client",
    headline: "From random workouts to a routine that sticks.",
    quote: "Biggest change honestly is that it's a routine now, not a grind. The structure you built is what made it stick.",
    metrics: [
      { value: "~30 lb", label: "lost" },
      { value: "4 in", label: "off waist" },
      { value: "90 → 225 lb", label: "back squat" },
    ],
    videoSlot: "testimonial_gino",
    approved: false,
  },
  {
    id: "gabriela",
    name: "Gabriela",
    descriptor: "Training Client",
    headline: "",
    quote: "I really love the workout. It's kicking my butt and I've been sore all week. I'm learning a lot of these machines — and it's so cool to do this knowing that you created it. It just makes me that much more motivated and excited. This is exactly what I needed.",
    metrics: [],
    videoSlot: "",
    approved: false,
  },
]

export const FAQS = [
  {
    q: "How does 1:1 coaching actually work?",
    a: "You apply, I review, and if we're a good fit I build your program from scratch around your goals, schedule, equipment, and history. Every week you complete a check-in and I adjust based on what's working. You can message me anytime between check-ins.",
  },
  {
    q: "Do I need gym experience to start the courses?",
    a: "None at all. Training Foundations starts from the very beginning and builds from there. If you've been training a while you'll still find things here that fix how you move and change how you progress.",
  },
  {
    q: "Can I try the courses before committing to coaching?",
    a: "Yes, and most of my coaching clients did exactly that. The Complete Foundations Bundle is a great on-ramp, and if you upgrade to 1:1 coaching within 90 days the full $137 credits toward your first coaching month.",
  },
  {
    q: "How is this different from a workout app?",
    a: "Weekly check-ins plus messaging anytime between them. I personally review every workout and every check-in and adjust your program based on what's actually working. No generic algorithm-generated programs.",
  },
]

export const CLOSING = {
  eyebrow: "Ready to start?",
  title: "Stop guessing.",
  titleEm: "Start training with someone who actually knows your body.",
  body: "Apply for 1:1 coaching and get a fully custom program, weekly check-ins, and real accountability from someone who will actually be there.",
}

// Direction B's pinned statement panel. Each beat is a compression of a claim
// the live site already makes — the method, the structure, the tracking, the
// longevity — set large enough to be read one at a time.
export const STATEMENTS = [
  {
    big: "Structure over intensity.",
    small: "Most people don't need a harder workout. They need a plan where the effort actually accumulates.",
  },
  {
    big: "Movement before load.",
    small: "Five foundational patterns, taught properly, before anything heavy goes on the bar.",
  },
  {
    big: "Your numbers, written down.",
    small: "Sets, reps, and weight tracked inside the program, so progression is a decision rather than a guess.",
  },
  {
    big: "A body built to last.",
    small: "Run the program once, repeat it stronger, and keep building from your own numbers for years.",
  },
]
