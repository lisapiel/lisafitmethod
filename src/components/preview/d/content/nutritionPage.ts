// Copy for the Direction D /nutrition page.
//
// PROVENANCE — every string is the live /nutrition wording, verbatim. The
// module outlines and the FAQ come from @/app/nutrition/content, which is the
// production page's own source. Prices come from @/lib/pricing at render time.

export const NUTRITION_HERO = {
  eyebrow: "Lisa Fit Method",
  headingLine1: "Nutrition",
  headingLine2: "Foundations.",
  lede:
    "A 4-week nutrition course built for people who train. Personalized to your body. Grounded in research. Practical enough to actually use.",
  jumpCta: "Explore the Modules",
  jumpHref: "#modules",
  limited: "Limited Time",
  cta: "Get Instant Access",
  href: "/checkout?product=nutrition",
  noteLine1: "One-time payment · Buy once, access anytime",
  noteLine2: "No subscription · No recurring fees",
}

export const WHAT_YOU_GET = [
  {
    label: "Personalized Calculator",
    body:
      "Your TDEE, macro targets, and training-day vs. rest-day calories — calculated for your body and your goal.",
  },
  {
    label: "Real Recipes, Real Sources",
    body:
      "9 verified recipes from established creators, attributed with links. Portions scale automatically to your calorie target.",
  },
  {
    label: "Science, Not Guesswork",
    body:
      "Every recommendation is backed by cited research — Morton 2018, Burke 2011, Smith 2011, and more.",
  },
]

export const NUTRITION_MODULES_HEAD = {
  eyebrow: "What’s inside",
  headingLine1: "Four modules.",
  headingLine2: "One real system.",
}

export const NUTRITION_FOR = {
  eyebrow: "Is this for me?",
  headingLine1: "This is for you",
  headingLine2: "if you’re serious.",
  items: [
    "You train consistently but your diet doesn’t match your effort",
    "You don’t know how many calories you actually need",
    "You’ve tried tracking food but gave up because it felt too complicated",
    "You want a meal plan that’s built around real food, not a list of restrictions",
    "You eat well at home but fall apart eating out or on weekends",
    "You want to understand the why, not just follow a plan blindly",
  ],
}

export const NUTRITION_PAIR = {
  eyebrow: "Pair it with",
  headingLine1: "Train smarter with",
  headingLine2: "Training Foundations.",
  body1:
    "Nutrition Foundations pairs perfectly with Training Foundations — a 4-week beginner strength training program covering the five foundational movements with built-in workout tracking and progressive overload guidance.",
  body2:
    "Together, they give you a training system and a nutrition system that are designed to work alongside each other.",
  cta: "Explore Training Foundations →",
  href: "/courses",
}

export const NUTRITION_FAQ_HEAD = {
  eyebrow: "Questions",
  heading: "Common questions.",
}

export const NUTRITION_DISCLAIMER = {
  label: "Disclaimer:",
  body:
    " Lisa McPherson is a NASM Certified Personal Trainer, not a Registered Dietitian or licensed medical professional. This course provides general nutrition education for fitness and performance goals — not medical nutrition therapy. It does not replace advice from a healthcare provider. Individual results vary. Always consult your physician before starting a new nutrition plan, especially if you have a medical condition, take medications, or have a history of eating disorders.",
}

export const NUTRITION_FINAL = {
  eyebrow: "Ready to start?",
  headingLine1: "Eat to match",
  headingLine2: "your training.",
  body:
    "Four modules. A personalized calculator. A full meal plan. Everything you need to stop guessing and start eating with intention.",
  limited: "Limited Time",
  cta: "Get Instant Access",
  href: "/checkout?product=nutrition",
  // Production renders this as one line with the middle clause emphasised.
  noteLead: "One-time payment · ",
  noteStrong: "Buy once, access anytime",
  noteTail: " · No subscription",
  betterTogether: "Better together",
  bundleLabel: "Foundations Bundle",
  bundleCta: "Get Both Courses",
  bundleHref: "/checkout?product=bundle",
}
