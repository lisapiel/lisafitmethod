// Testimonial content for Direction D.
//
// PROVENANCE — every string below already existed in this project. Nothing
// here is newly written marketing copy.
//
//   Section heading, eyebrow and sub-line
//     src/components/TestimonialsSection.tsx — the wording already authored
//     for a testimonials section on this site.
//
//   Gino and Gabriela records
//     src/app/api/admin/testimonials/seed/route.ts — the records prepared and
//     saved in the project. Copied verbatim, including punctuation.
//
// This module deliberately does NOT read from the testimonial admin, the
// DynamoDB table or the media CMS. Direction D depends on none of that
// machinery: the words are static and the video is a file in public/preview.
//
// TWO DIFFERENCES WERE FOUND against the wording quoted in the brief, and are
// flagged rather than silently resolved — see FLAGS at the bottom.

// A statement from Lisa, supplied 20 Oct. Rendered as something she says —
// attributed, set as a quote — rather than as a strapline.
export const LISA_STATEMENT = {
  quote:
    "Without a plan, you're doing 100 random workouts. With one, you're building one long progression. Same effort, completely different results.",
  attribution: "Lisa McPherson, CPT",
}

export const TESTIMONIALS_HEAD = {
  // from TestimonialsSection.tsx
  eyebrow: "Real results",
  heading: "Real People. Real Progress.",
  sub: "Real progress starts with a plan that fits your life. Here’s what personalized training can look like.",
}

export const GINO = {
  name: "Gino",
  descriptor: "Online Coaching Client",
  // seed route: headline
  headline: "From random workouts to a routine that sticks.",
  // seed route: featuredQuote — identical to the quote given in the brief.
  quote:
    "Biggest change honestly is that it's a routine now, not a grind. The structure you built is what made it stick.",
  // seed route: writtenTestimonial. Carries the consistency, protein,
  // recovery and cardio detail in his own words.
  written:
    "I'm at ~210, down 30 pounds, waist is a 34 (pushing 33), and I'm five days into Phase III training almost every day. I'm logging every meal, hitting 150g+ protein most days, and my recovery and cardio are way better than when we started. My back squats went from 90 lbs to 225 lbs.",
  // seed route: metrics, unchanged.
  metrics: [
    { value: "~30 lb", label: "lost" },
    { value: "4 inches", label: "off waist" },
    { value: "90 → 225 lb", label: "back squat" },
  ],
}

export const GABRIELA = {
  name: "Gabriela",
  descriptor: "Training Client",
  // Wording supplied by Lisa, 20 Oct. Replaces the earlier saved record: the
  // line praising Lisa personally is removed and the substance about the
  // programme is kept. Rendered exactly as given, with no em dashes.
  quote:
    "I really love the workout. It's kicking my butt and I've been sore all week. I'm learning a lot of these machines, and it makes me even more motivated and excited. This is exactly what I needed. I especially love how helpful the videos are for understanding the movements, and I like being able to track everything. I just quit CrossFit for good, so I'm going to be using it a lot more.",
}

// The square export lives in public/preview/ and is produced by
// scripts/prepare-testimonial-video.mjs. It is intentionally a plain static
// file: no CMS lookup, no admin dependency.
export const GINO_VIDEO = {
  src: "/preview/gino-testimonial.mp4",
  poster: "/preview/gino-testimonial.jpg",
}

// Gabriela's photograph, supplied by Lisa. Rotated upright, metadata
// stripped and resized to 900x1200 — a true 3:4, so the portrait plate
// crops nothing.
export const GABY_PHOTO = {
  src: "/preview/gaby-testimonial.jpg",
  alt: "Gabriela, Lisa Fit Method training client",
}

// FLAGS — for review, not resolved unilaterally.
//
// 1. Her name. The saved record and this module say "Gabriela"; Lisa has
//    called her "Gaby" in conversation. "Gabriela" is rendered, with a comma
//    before the descriptor as instructed. Change `name` above to switch.
//
// 2. Gino's waist figure. Lisa has framed it as 38 inches to ~34 inches; the
//    saved metric says "4 inches off waist", which is the same change stated
//    differently. The saved wording is rendered.
