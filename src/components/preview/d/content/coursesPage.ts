// Copy for the Direction D /courses page.
//
// PROVENANCE — every string is the live /courses wording, verbatim.
// The module lists are imported from the production page itself
// (TRAINING_MODULES, NUTRITION_MODULES) so they cannot drift. The strings
// below were inline in that page's JSX and are reproduced exactly; prices
// and the three settings-driven lines are still read at render time from
// @/lib/pricing and fetchSiteSettings, never copied.

export const COURSES_INTRO = {
  eyebrow: "Courses",
  headingLine1: "Two courses.",
  headingLine2: "One complete foundation.",
  body:
    "Structured fitness and nutrition systems built for real life. Learn how to move well, train consistently, and eat in a way that supports your goals without obsessing over every detail.",
  jumps: [
    { label: "Training Foundations", href: "#training" },
    { label: "Nutrition Foundations", href: "#nutrition" },
    { label: "Bundle", href: "#bundle" },
  ],
}

export const INSIDE_LABEL = "What’s inside"

export const TRAINING = {
  eyebrow: "Training Foundations",
  priceNoteLine1: "One-time payment · Limited time price",
  priceNoteLine2: "Built-in workout and progress tracking",
  cta: "Get Instant Access",
  href: "/checkout",
  points: [
    "50+ exercise videos with coaching cues",
    "4-week structured program",
    "Progressive overload system",
    "Workout tracking built in",
    "Designed to repeat and keep progressing",
  ],
}

export const TESTIMONIAL_BAND = {
  eyebrow: "Real results",
  headingLine1: "What people",
  headingLine2: "are saying.",
  alt: "Testimonials from Lisa Fit Method students",
}

export const NUTRITION = {
  eyebrow: "Nutrition Foundations",
  headingLine1: "Eat to match",
  headingLine2: "your training.",
  body:
    "A 4-week nutrition course with a personalised TDEE calculator, a structured meal plan built around your calorie target, science-backed education, and real recipes from verified sources.",
  points: [
    "Interactive TDEE calculator, personalised to your stats and goal",
    "4-week meal plan with real, attributed recipes",
    "Macro education, eating-out guide, and supplement evidence",
    "Written by a CPT with full research citations throughout",
  ],
  priceNoteLine1: "One-time payment · Limited time price",
  priceNoteLine2: "Ongoing access, no subscription",
  cta: "Get Instant Access",
  href: "/checkout?product=nutrition",
  detailsLink: "Full course details →",
  detailsHref: "/nutrition",
}

export const BUNDLE_BAND = {
  eyebrow: "Complete Foundations System",
  heading: "Get both courses together.",
  body:
    "Training and nutrition are two sides of the same system. When you have both, you know how to train and how to eat to support it. Most people who take one eventually come back for the other.",
  includes: ["Training Foundations", "Nutrition Foundations"],
  cta: "Get Both Courses",
  href: "/checkout?product=bundle",
  note: "One-time payment · No subscription",
}

export const TRACKER = {
  eyebrow: "Optional add-on",
  heading: "Progress Tracker",
  priceSuffix: "once · no subscription",
  // The third body carried an HTML-escaped apostrophe in production because
  // it was injected with dangerouslySetInnerHTML. Rendered as text here, so
  // the character itself is used.
  items: [
    {
      title: "Log any workout",
      body:
        "Build completely custom workout days with any exercises you want. Not just this program — use it for everything you train.",
    },
    {
      title: "Beat last week",
      body:
        "Your previous numbers sit right next to where you log. You always know exactly what to beat. Progressive overload made automatic.",
    },
    {
      title: "Installs like an app",
      body:
        "Add it to your phone home screen from your browser. Opens full-screen, no browser bar. One tap and you’re in the gym.",
    },
  ],
  cta: "Add at Checkout",
  href: "/checkout",
  altLink: "Tracker only →",
  altHref: "/tracker-checkout",
}

export const IS_THIS_FOR_ME = {
  eyebrow: "Is this for me?",
  headingLine1: "You’re in the right place",
  headingLine2: "if you’re serious.",
  items: [
    "You want structure instead of random workouts that lead nowhere",
    "You want to understand why you’re doing each movement, not just what",
    "You’ve dealt with nagging pain, instability, or recurring injuries",
    "You want a program you can keep progressing, not just finish once",
    "You’re ready to train consistently and actually build strength",
    "You want nutrition guidance that isn’t obsessive or exhausting",
  ],
}

export const COURSES_FAQ = {
  eyebrow: "Common questions",
  heading: "What you should know.",
  allLink: "See all questions →",
  allHref: "/faq",
  items: [
    {
      q: "How long is each training session?",
      a: "Between 45 and 60 minutes including warm-up and cool-down. Some days run a little shorter.",
    },
    {
      q: "Do I need a gym?",
      a: "You need access to basic equipment: dumbbells, a resistance band, and a flat bench or equivalent. A commercial gym works, but a well-equipped home gym is fine too.",
    },
    {
      q: "Is this for complete beginners?",
      a: "Yes. It’s built for people new to structured training or who’ve been winging it for years. You don’t need prior experience with any of the movements — everything is taught from the ground up.",
    },
    {
      q: "Can I run it more than once?",
      a: "That’s the point. The program is designed to be repeated. Each round you add weight and progress further. Most people who see real results run it 2 or 3 times.",
    },
    {
      q: "Is it a subscription?",
      a: "No. One-time payment for each course. You pay once and keep ongoing access.",
    },
    {
      q: "Can men use this program?",
      a: "Yes. The movements and principles apply to everyone. There are no gender-specific requirements.",
    },
  ],
}

export const COURSES_FINAL = {
  eyebrow: "Ready to start?",
  body: "One-time payment. Ongoing access. No subscription ever.",
  cta: "Get Instant Access",
  href: "/checkout",
  note: "Training Foundations · Limited time price",
}
