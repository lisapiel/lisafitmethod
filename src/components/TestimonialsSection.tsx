import { TestimonialsCarousel } from "@/components/TestimonialsCarousel.client"
import type { Testimonial } from "@/components/TestimonialsCarousel.client"

const COURSE_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Melissa Rodriguez",
    context: "Teacher, 31 · Chicago, IL",
    tag: "Training Foundations",
    stars: 5,
    quote: "Tried a few programs before this and quit every single one by week two. Something clicked here. The way the movements are broken down actually makes sense, and I walk into the gym now knowing what I'm doing.",
    initials: "MR",
    date: "Feb 2025",
    dateIso: "2025-02-01",
  },
  {
    id: "t2",
    name: "Ryan Kowalski",
    context: "Project manager, 34 · Austin, TX",
    tag: "Training Foundations",
    stars: 5,
    quote: "My lower back was always tight from sitting at a desk all day. Three weeks into this and I already feel different. The core work is harder than I expected but in a good way. Finally understand why my hips felt off for so long.",
    initials: "RK",
    date: "Jan 2025",
    dateIso: "2025-01-01",
  },
  {
    id: "t3",
    name: "Sarah Mitchell",
    context: "Nurse, 28 · New York, NY",
    tag: "Training Foundations",
    stars: 5,
    quote: "The progress tracking inside the program is honestly what kept me from quitting. Every week the numbers went up a little and that made me want to keep going. I have done the whole thing twice now.",
    initials: "SM",
    date: "Mar 2025",
    dateIso: "2025-03-01",
  },
  {
    id: "t4",
    name: "Luisa Vasquez",
    context: "Graphic designer, 26 · Los Angeles, CA",
    tag: "Training Foundations",
    stars: 5,
    quote: "I grew up thinking lifting was not for me. Nobody in my family trained. This program made it feel accessible without talking down to me. By week three I was showing up to the gym without any anxiety.",
    initials: "LV",
    date: "Apr 2025",
    dateIso: "2025-04-01",
  },
  {
    id: "t5",
    name: "Priya Nair",
    context: "Software engineer, 29 · Seattle, WA",
    tag: "Training Foundations",
    stars: 5,
    quote: "Work hours are long so I needed something that fit into 45 minutes three times a week. No fluff, just structure. By week four I hit a lift that used to feel impossible. The progression actually makes sense.",
    initials: "PN",
    date: "Mar 2025",
    dateIso: "2025-03-15",
  },
  {
    id: "t6",
    name: "Zoe Hartmann",
    context: "Photographer, 33 · Portland, OR",
    tag: "Training Foundations",
    stars: 5,
    quote: "I bought this on a Sunday and started Monday. By end of week one I already knew it was different. The warm-ups alone fixed things my physio had been trying to explain for six months.",
    initials: "ZH",
    date: "Feb 2025",
    dateIso: "2025-02-15",
  },
  {
    id: "t7",
    name: "Tomás Reyes",
    context: "Sales rep, 31 · Dallas, TX",
    tag: "Training Foundations",
    stars: 5,
    quote: "I had been going to the gym on and off for five years and never actually progressed. Same machines, same weights every time. This made me realize I was skipping all the foundational work. The difference now is visible.",
    initials: "TR",
    date: "Apr 2025",
    dateIso: "2025-04-15",
  },
  {
    id: "t8",
    name: "Camille Leroux",
    context: "Accountant, 36 · Toronto, ON",
    tag: "Training Foundations",
    stars: 5,
    quote: "Started this two months after my second baby. My core felt completely disconnected. Four weeks in and I can engage muscles I thought were gone. The pacing is sensible but the results are real.",
    initials: "CL",
    date: "Jan 2025",
    dateIso: "2025-01-15",
  },
  {
    id: "t9",
    name: "Aisha Williams",
    context: "Social worker, 30 · Atlanta, GA",
    tag: "Training Foundations",
    stars: 5,
    quote: "I had already bought two fitness programs that year and finished neither. This is the first one I completed. The module on progressive overload is the clearest explanation I have come across anywhere.",
    initials: "AW",
    date: "May 2025",
    dateIso: "2025-05-01",
  },
]

const COACHING_TESTIMONIALS: Testimonial[] = [
  {
    id: "c1",
    name: "Daniela Vargas",
    context: "Interior designer, 33 · Miami, FL",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "Lisa fixed my squat on the first call. I had been doing it wrong for years and had no idea. The way she builds your program around your actual schedule, not some perfect version of your week, is what makes it actually stick.",
    initials: "DV",
    date: "Dec 2024",
    dateIso: "2024-12-01",
  },
  {
    id: "c2",
    name: "Gino Hanono",
    context: "Entrepreneur, 32 · New York, NY",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I had a trainer at a commercial gym before and the sessions never felt like they were built for me. With Lisa it was different from the first call. She asked things nobody had asked before. Six months later I train with actual confidence on my own too.",
    initials: "GH",
    date: "Mar 2025",
    dateIso: "2025-03-01",
  },
  {
    id: "c3",
    name: "Marcus Webb",
    context: "Physical therapist, 38 · Chicago, IL",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I work in physical therapy and still learned things about my own movement I had been ignoring. Lisa programs around your actual constraints, not what is convenient for her. My deadlift has been pain free for the first time in two years.",
    initials: "MW",
    date: "Feb 2025",
    dateIso: "2025-02-01",
  },
  {
    id: "c4",
    name: "Ingrid Solberg",
    context: "UX designer, 31 · San Francisco, CA",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "The check-ins are what make this worth it. Not just workouts but tracking how you feel, sleep, what is not working. I tried app-based coaching before and it felt like texting a bot. This does not.",
    initials: "IS",
    date: "Apr 2025",
    dateIso: "2025-04-01",
  },
  {
    id: "c5",
    name: "Diana Khoury",
    context: "Lawyer, 40 · Boston, MA",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I came to Lisa after a shoulder injury that two physical therapists had not fully resolved. She built the program around it from day one, no shortcuts. Eight months later I am lifting weight I genuinely never expected to reach.",
    initials: "DK",
    date: "Jan 2025",
    dateIso: "2025-01-01",
  },
]

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
      <span style={{ flex: 1, height: 1, background: "rgba(168,137,94,0.2)", display: "block" }} />
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "rgba(168,137,94,0.2)", display: "block" }} />
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section
      style={{ background: "var(--off-white, #f5f2ee)", padding: "100px 80px" }}
      className="testimonials-v2"
      aria-label="Student and client testimonials"
    >
      <style>{`
        @media (max-width: 768px) {
          .testimonials-v2 { padding: 72px 24px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Real results
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "calc(clamp(32px, 3.5vw, 48px) * var(--heading-scale, 1))", fontWeight: 700, color: "#0a0a0a", lineHeight: 1.15, margin: "0 auto 16px" }}>
            What people are saying.
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "calc(15px * var(--body-scale, 1))", color: "#6b6560", maxWidth: 400, margin: "0 auto", lineHeight: 1.65 }}>
            From people who showed up, did the work, and actually changed how they move and feel.
          </p>
        </div>

        <SectionDivider label="Training Foundations" />
        <div style={{ marginBottom: 56 }}>
          <TestimonialsCarousel testimonials={COURSE_TESTIMONIALS} />
        </div>

        <SectionDivider label="1:1 Coaching" />
        <TestimonialsCarousel testimonials={COACHING_TESTIMONIALS} />
      </div>
    </section>
  )
}

export { COURSE_TESTIMONIALS, COACHING_TESTIMONIALS }
