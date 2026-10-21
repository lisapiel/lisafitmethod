// 1:1 Coaching content.
//
// PROVENANCE: every line is Lisa's own wording from src/lib/siteSettings.ts
// DEFAULTS — the copy that already runs the /coaching page — transcribed
// verbatim. Nothing here is newly written.
//
// One deliberate omission is flagged at the bottom.
import { COACHING_FROM_DISPLAY } from "@/lib/pricing"

export const COACHING = {
  eyebrow: "By application",
  // siteSettings: coachingHeroHeadline
  heading: "Coaching built around you.",
  // siteSettings: coachingHeroSubtext, first two sentences. See FLAG.
  body:
    "Coaching is designed for people serious about building strength, improving movement quality, and creating long-term results. I keep coaching intentionally limited so every client gets real attention, detailed feedback, and programming that evolves as they progress.",
  price: COACHING_FROM_DISPLAY,
  // siteSettings: coachingFormSubtext, closing sentence
  note: "No commitment required to apply.",
  cta: "Apply for Coaching",
  href: "/coaching#apply",
}

// siteSettings: coachingFeature1-4 Title and Body, verbatim.
export const COACHING_PILLARS = [
  {
    index: "01",
    title: "Custom programming",
    body:
      "Training built specifically for your goals, experience level, schedule, equipment, and recovery capacity. Updated as you progress so your body keeps adapting instead of plateauing.",
  },
  {
    index: "02",
    title: "Form review & feedback",
    body:
      "Send me videos of your lifts and I'll break down your technique with detailed cues and corrections so you understand not just what to change, but why.",
  },
  {
    index: "03",
    title: "Check-ins & adjustments",
    body:
      "Weekly check-ins to adjust your training, recovery, workload, or nutrition before small issues become setbacks. Real coaching means adapting as your body evolves.",
  },
  {
    index: "04",
    title: "Direct access to me",
    body:
      "Questions between check-ins? Message me directly. No outsourced coaching or automated replies — just real guidance when you need it.",
  },
]

// FLAG: coachingHeroSubtext ends "Fill out the form below and I'll personally
// review your application." That sentence is dropped here because there is no
// form on the homepage — the section links to /coaching#apply instead. Say the
// word if you would rather it stayed and pointed at the coaching page.
