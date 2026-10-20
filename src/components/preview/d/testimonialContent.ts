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
  // seed route: clientName is "Gabriela". The brief calls her Gaby — see FLAGS.
  name: "Gabriela",
  descriptor: "Training Client",
  // seed route: featuredQuote, verbatim.
  quote:
    "I really love the workout. It's kicking my butt and I've been sore all week. I'm learning a lot of these machines — and it's so cool to do this knowing that you created it. It just makes me that much more motivated and excited. This is exactly what I needed.",
  // seed route: writtenTestimonial, verbatim.
  written:
    "I especially love how you demo the movements and can track everything. I just quit CrossFit for good so I'm going to be using it a whole lot more.",
}

// The square export lives in public/preview/ and is produced by
// scripts/prepare-testimonial-video.mjs. It is intentionally a plain static
// file: no CMS lookup, no admin dependency.
export const GINO_VIDEO = {
  src: "/preview/gino-testimonial.mp4",
  poster: "/preview/gino-testimonial.jpg",
}

// FLAGS — for review, not resolved unilaterally.
//
// 1. Gabriela's quote. The saved record is a lightly cleaned version of her
//    voice message. The brief quotes her raw words:
//      raw   "...it's so cool to do this knowing that you created it cause it
//             just makes me that much more like inclined to do it and be
//             motivated and like get excited about it"
//      saved "...it's so cool to do this knowing that you created it. It just
//             makes me that much more motivated and excited."
//      raw   "Thank you so much because this is exactly what I needed."
//      saved "This is exactly what I needed."
//    The saved version is rendered, because the brief asks for the approved
//    wording to be preserved. Swapping to the raw transcript is a one-line
//    change to `quote` above.
//
// 2. Her name. Saved record says "Gabriela"; the brief says "Gaby". The saved
//    name is rendered. Change `name` above to switch.
//
// 3. Gino's waist figure. The brief frames it as 38 inches to ~34 inches; the
//    saved metric says "4 inches off waist", which is the same change stated
//    differently. The saved wording is rendered.
