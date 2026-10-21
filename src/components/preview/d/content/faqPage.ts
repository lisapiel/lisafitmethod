// Copy for the Direction D /faq page.
//
// PROVENANCE — every string is the live /faq wording, verbatim. The questions
// and answers themselves come from @/app/faq/content, which is the production
// page's own source, so they cannot drift.

export const FAQ_HEAD = {
  eyebrow: "Frequently Asked Questions",
  heading: "Everything you need to know before you start.",
  lede:
    "The Lisa Fit Method is a fitness education platform built around evidence-based training and nutrition. Its goal is to help people build strength, improve their body composition, and understand the principles behind their results so they can keep progressing with confidence. These are the questions people ask most before getting started.",
}

export const FAQ_CTA = {
  eyebrow: "Ready to start?",
  heading: "The right starting point depends on your goal.",
  lede:
    "Every option below is a one-time payment with lifetime access. Pick the one that matches where you are right now.",
  cards: [
    {
      label: "Training Foundations",
      headline: "Learn to train the right way.",
      body:
        "For people who want to build real strength, learn correct technique, and finally follow a program that makes sense. 50+ exercise videos, a structured 4-week program, progressive overload guidance, and built-in workout tracking.",
      cta: "Get Training Foundations",
      href: "/checkout?product=training",
      secondary: "See what’s included →",
      secondaryHref: "/courses",
    },
    {
      label: "Nutrition Foundations",
      headline: "Learn to eat for your goals.",
      body:
        "For people who want to understand nutrition for fat loss, muscle building, or both. TDEE calculator, 4-week meal plan, macro education, and real-world strategies for eating well without obsessing over food.",
      cta: "Get Nutrition Foundations",
      href: "/checkout?product=nutrition",
      secondary: "See what’s included →",
      secondaryHref: "/nutrition",
    },
    {
      label: "1:1 Coaching",
      headline: "Personalized guidance, directly from Lisa.",
      body:
        "For people who want a fully custom program built around their specific goals, injury history, and schedule. Includes form review, weekly check-ins, and ongoing program adjustments as you progress.",
      cta: "Learn About Coaching",
      href: "/coaching",
    },
    {
      label: "Foundations Bundle",
      badge: "Best Value",
      headline: "The complete system.",
      body:
        "For people who want to address both training and nutrition at the same time. Both courses together at the best available price. One payment, lifetime access to everything.",
      cta: "Get Both Courses",
      href: "/checkout?product=bundle",
      note: "One-time payment. Lifetime access.",
    },
  ],
  footLead: "Still have a question not answered here? ",
  footLink: "Get in touch.",
  footHref: "/contact",
}
