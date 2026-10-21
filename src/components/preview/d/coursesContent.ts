// Course showcase copy for Direction D only.
//
// Deliberately a separate module from c/productionCopy.ts: Direction C still
// renders the live homepage wording verbatim, and this refinement must not
// reach it. Prices, badges, CTA labels and destinations are imported or
// copied unchanged — only the descriptive copy is refined, which is the one
// place Lisa authorised rewriting (21 Oct).
//
// Every statement below is checked against what the courses actually ship:
// Training is Modules 1-4 plus the Workout Tracker; Nutrition is Modules 1-4
// plus References & Resources and the calculator.
import {
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
} from "@/lib/pricing"

export const TRAINING = {
  eyebrow: "Training Foundations",
  heading: "Train with structure. See your progress.",
  intro:
    "Learn the fundamental movement patterns, follow a structured training program, and track your progress so every workout builds on the last.",
  benefits: [
    {
      index: "01",
      title: "Master the foundations",
      body: "Learn proper movement patterns and technique, with a focus on building strength, stability, and control.",
    },
    {
      index: "02",
      title: "Follow a structured program",
      body: "Progressive workouts with warm-ups, core and glute training, and clear guidance on how to improve over time.",
    },
    {
      index: "03",
      title: "See your progress",
      body: "Exercise demonstration videos and a built-in workout tracker to record weights, reps, and performance.",
    },
  ],
  // Module 4 mentioned where it fits, rather than given equal billing.
  footnote:
    "Also includes Module 4: Nutrition Essentials, full warm-ups and cool-downs, progression guidance, and ongoing access.",
  priceWas: COURSE_REGULAR_PRICE_DISPLAY,
  tag: "LIMITED TIME",
  ctaPrimary: "Get Instant Access",
  ctaSecondary: "Explore the Course",
  buyHref: "/checkout",
  exploreHref: "/courses",
}

export const NUTRITION = {
  eyebrow: "Nutrition Foundations",
  heading: "Eat to support your training. Without overthinking it.",
  intro:
    "Understand what your body needs, build a nutrition strategy that fits your goals, and learn how to make it sustainable in real life.",
  benefits: [
    {
      index: "01",
      title: "Understand your body",
      body: "Learn the foundations of nutrition and how to make informed decisions about what you eat.",
    },
    {
      index: "02",
      title: "Build your nutrition blueprint",
      body: "Use the interactive calorie and macro calculator to establish personalized starting targets.",
    },
    {
      index: "03",
      title: "Turn knowledge into action",
      body: "Follow a flexible 4-week meal plan that scales to your calorie needs, with practical guidance to help you stay consistent.",
    },
  ],
  footnote:
    "Includes eating out, supplements, and troubleshooting guides, plus references and resources. One-time payment, buy once, access anytime.",
  priceNow: NUTRITION_COURSE_PRICE_DISPLAY,
  priceWas: NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  tag: "LIMITED TIME",
  ctaPrimary: `Get Instant Access · ${NUTRITION_COURSE_PRICE_DISPLAY}`,
  ctaSecondary: "Explore the Course",
  buyHref: "/checkout?product=nutrition",
  exploreHref: "/nutrition",
  photo: "/preview/nutrition-bowl.jpg",
}
