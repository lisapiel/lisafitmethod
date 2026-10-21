// Copy for the Direction D /coaching page.
//
// PROVENANCE — every string is the live /coaching wording, verbatim. The
// application form itself is not described here: it is the production
// component, @/components/CoachingApplicationForm.client, rendered as-is.
// The monthly prices are read from @/lib/pricing at render time.

export const CO_HERO = {
  eyebrow: "Online 1:1 Coaching",
  headingLine1: "Stronger body.",
  headingLine2: "Better movement. For life.",
  quote:
    "“I've had to rebuild my body from injury. Now I help you build yours with strength, structure, and smarter training.”",
  quoteAttribution: "Lisa M",
  lede:
    "Personalized 1:1 coaching for people who want to build real strength, improve their body composition, and move better. You bring the effort. I bring the plan, the feedback, and the accountability.",
  pillars: [
    "Personalized programming",
    "Real accountability and feedback",
    "Injury-aware and adaptive",
    "Long-term results",
  ],
  cta: "Apply for 1:1 Coaching",
  ctaHref: "#apply",
  secondary: "Learn more ↓",
  secondaryHref: "#experience",
  photoAlt: "Lisa McPherson coaching",
}

export const CO_EXPERIENCE = {
  eyebrow: "Your coaching experience",
  heading: "Everything you need in one place.",
  body:
    "Your whole program lives inside my coaching platform, which you can save to your phone's home screen so it opens just like an app. Open it at the gym, follow your workout, watch the demos, log your sets, track your progress, and message me when you need help. I built the platform myself. Former engineer habits die hard.",
  features: [
    "Custom workouts with videos",
    "Progress tracking",
    "Weekly check-ins",
    "Direct messaging",
    "Goals and metrics",
    "Nutrition targets and check-in accountability",
  ],
  link: "See how it works →",
  linkHref: "#how",
  // Real pixel dimensions, because three of these are tall phone captures and
  // the fourth is a near-square card: the layout is built around that
  // difference rather than forcing all four into one shape.
  shots: [
    { src: "/portal-mobile-home.jpg", alt: "The coaching platform home screen", w: 1164, h: 2357 },
    { src: "/portal-mobile-workout.jpg", alt: "A workout open in the coaching platform", w: 1204, h: 2352 },
    { src: "/portal-mobile-program.jpg", alt: "A training program in the coaching platform", w: 1205, h: 2432 },
    { src: "/portal-mobile-howto.jpg", alt: "An exercise how-to card in the coaching platform", w: 1061, h: 994 },
  ],
}

export const CO_GET = {
  eyebrow: "What you’ll get",
  heading: "Results that go beyond how you look.",
  items: [
    {
      title: "Stronger, more capable",
      body:
        "Real strength you can measure. Heavier lifts in the gym, and a body that handles life better outside of it.",
    },
    {
      title: "Improve body composition",
      body:
        "Build muscle, lose fat, and start liking what you see. Not from a quick fix, but from training you can sustain long term.",
    },
    {
      title: "Move better, feel better",
      body:
        "Better mobility, cleaner movement, and less of the nagging discomfort you’ve been trying to ignore.",
    },
    {
      title: "Sustainable results",
      body:
        "You’ll understand how to train, eat, and recover, so the results don’t disappear when the coaching ends.",
    },
  ],
}

export const CO_WHO = {
  eyebrow: "Who this is for",
  heading: "This is for you if",
  items: [
    "You want to get stronger, leaner, and move better",
    "You’ve done the random programs. They went nowhere.",
    "You want someone actually checking your work every week",
    "You’re ready to follow a personalized plan consistently and put in the effort.",
  ],
}

export const CO_HOW_WE_COACH = {
  eyebrow: "How we coach",
  heading: "Coaching that looks at everything",
  body:
    "Your program is 100% built around you, and it evolves as you do. Training, recovery, nutrition, lifestyle, mindset. If it affects your progress, we pay attention to it.",
  items: [
    { title: "Custom training", body: "Built around your goals, experience, equipment, schedule, and recovery." },
    { title: "Weekly check-ins", body: "I review your progress and adjust your plan every week." },
    { title: "Form feedback", body: "Send videos, get detailed feedback, and improve your technique." },
    { title: "Direct support", body: "Message me when you need me. Real answers, usually same day." },
    { title: "Injury-aware approach", body: "We work around your injuries and build resilience." },
    {
      title: "Education",
      body: "You’ll understand why you’re doing what you’re doing and how to progress long term.",
    },
  ],
}

export const CO_STEPS = {
  eyebrow: "How coaching works",
  heading: "From application to progress",
  steps: [
    {
      title: "You apply for coaching",
      body:
        "You fill out a short application so I can understand your goals, training history, schedule, equipment, injuries, and what you need help with most. I personally review every application.",
    },
    {
      title: "We define your goals",
      body:
        "After your first check-in, we set clear goals based on where you are now and where you want to go. Strength, muscle, fat loss, body recomposition, movement quality, or consistency. We get specific.",
    },
    {
      title: "I build your program",
      body:
        "Built around your goal, your body, your experience, your schedule, your equipment, and your recovery. A plan that makes sense for your life, not just one that looks good on paper.",
    },
    {
      title: "You train inside your platform",
      body:
        "You open your workouts from your phone, follow the plan, watch exercise videos when needed, and log your sets, reps, weight, and RPE as you train. Everything is easy to access while you're at the gym.",
    },
    {
      title: "We track and adjust",
      body:
        "Every week, you complete a check-in. I review your training, recovery, nutrition, body metrics, progress, struggles, and wins. Then we adjust what needs to be adjusted so you keep moving forward.",
    },
  ],
}

export const CO_WEEK = {
  eyebrow: "A typical week",
  heading: "What a week actually looks like",
  items: [
    "You open your program from your phone and follow your workouts for the week.",
    "You log your sets, reps, weights, and notes as you train.",
    "You send me form videos when you want feedback.",
    "You message me if you have questions or need help adjusting something.",
    "At the end of the week, you complete your check-in.",
    "I review everything and make the adjustments needed based on your progress, recovery, and goals.",
  ],
  closing: "Simple. Structured. Personal.",
}

export const CO_INVESTMENT = {
  eyebrow: "Investment",
  heading: "Simple pricing, out in the open.",
  lede: "Pricing is right here because you should know what you are getting into before we ever talk.",
  bestValue: "Best Value",
  per: "per month",
  primaryLabel: "3-month coaching",
  primaryPoints: [
    "3-month minimum commitment",
    "After 3 months, continues month-to-month at $397/month until cancelled",
    "Save $100/month compared with month-to-month",
    "Best if you're ready to give the plan enough time to actually work",
  ],
  secondaryLabel: "Month-to-month coaching",
  secondaryPoints: ["Cancel anytime", "Best if you want maximum flexibility"],
  note:
    "Coaching is by application because I keep spots limited and I only take people I'm confident I can help.",
  cta: "Apply Now",
  ctaHref: "#apply",
  ctaNote: "Applications reviewed personally within 48 hours.",
}

export const CO_ABOUT = {
  eyebrow: "About me",
  heading: "A coach who gets it",
  paragraphs: [
    "I've been through my own injuries and setbacks. Eight months of back pain taught me more about training than any certification did.",
    "I rebuilt my body with smart training, patience, and consistency. Now I help other people do the same thing, without the years of guessing I went through.",
    "My goal is simple. A strong, resilient body that supports the life you actually want to live.",
  ],
  points: [
    "Evidence-based and practical",
    "Focused on long-term results",
    "Realistic and sustainable",
    "You’re not just a number",
  ],
  photoAlt: "Lisa McPherson",
}

export const CO_FAQ = {
  eyebrow: "Common questions",
  heading: "Questions people ask before applying.",
  items: [
    {
      q: "How is this different from a workout app?",
      a: "You work directly with me, not an algorithm and not an assigned trainer from a pool. I personally review every workout and every check-in, I adjust your program based on what's actually working, and I keep my roster small on purpose so every client gets my full attention.",
    },
    {
      q: "Is there a smaller way to start before committing to coaching?",
      a: "Yes. The Complete Foundations Bundle ($137) is the best place to start. If you upgrade to 3-month 1:1 coaching within 90 days, the full $137 credits toward your first coaching month. The bundle credit applies to the 3-month coaching option only, not to month-to-month coaching.",
    },
    {
      q: "Do you coach nutrition too?",
      a: "Yes. Every client gets personalized nutrition targets and weekly check-in support. No rigid meal plans, just clear targets that actually work around your real life.",
    },
    {
      q: "What if I have an injury or pain?",
      a: "Tell me about it in the application. Working around injuries is a big part of what I do. We train what we can, build up what we can’t yet, and I’ll tell you honestly if something needs a medical professional first.",
    },
    {
      q: "How much time do I need?",
      a: "Most of my clients train 3 to 4 days a week and spend about five minutes on their Sunday check-in. Your program is built around your schedule, not the other way around.",
    },
    {
      q: "How fast will I see results?",
      a: "Honestly? You’ll feel the difference in a few weeks. Visible change usually takes about 12 weeks of consistent work. That’s why the primary tier starts with a 3-month commitment. I don’t take clients for outcomes I can’t deliver.",
    },
    {
      q: "What happens after I apply?",
      a: "I personally read your application within 48 hours. If I think I can help, we get on a short call, I map out how I’d coach you, and you decide. If I’m not the right fit, I’ll tell you that too.",
    },
  ],
}

export const CO_APPLY = {
  eyebrow: "Apply for coaching",
  heading: "Apply for coaching",
  lede: "Tell me about your goals, your training, and what you need help with most.",
  reviewNote: "I personally review every application and respond within 48 hours.",
  nextLabel: "What happens next",
  nextSteps: [
    "I personally review your application within 48 hours.",
    "If it’s a fit, I’ll email you with the next steps to get started.",
    "Once you join, I’ll build your personalized program and we get started.",
  ],
  callNote: "Prefer to talk first? We can always schedule a call, but it's completely optional.",
  bundleLink:
    "Prefer a self-guided approach? The Complete Foundations Bundle ($137) is a great place to start. Upgrade to 3-month coaching within 90 days and the full $137 will be credited toward your first coaching month →",
  bundleHref: "/courses",
}
