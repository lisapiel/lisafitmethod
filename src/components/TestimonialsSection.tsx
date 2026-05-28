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
    date: "Feb 2026",
    dateIso: "2026-02-01",
  },
  {
    id: "t2",
    name: "Ryan Kowalski",
    context: "Project manager, 34 · Austin, TX",
    tag: "Training Foundations",
    stars: 5,
    quote: "My lower back was always tight from sitting at a desk all day. Three weeks into this and I already feel different. The core work is harder than I expected but in a good way. Finally understand why my hips felt off for so long.",
    initials: "RK",
    date: "Jan 2026",
    dateIso: "2026-01-01",
  },
  {
    id: "t3",
    name: "Sarah Mitchell",
    context: "Nurse, 28 · New York, NY",
    tag: "Training Foundations",
    stars: 5,
    quote: "The progress tracking inside the program is honestly what kept me from quitting. Every week the numbers went up a little and that made me want to keep going. I have done the whole thing twice now and gained noticeable muscle both times.",
    initials: "SM",
    date: "Mar 2026",
    dateIso: "2026-03-01",
  },
  {
    id: "t4",
    name: "Luisa Vasquez",
    context: "Graphic designer, 26 · Los Angeles, CA",
    tag: "Training Foundations",
    stars: 5,
    quote: "I grew up thinking lifting was not for me. Nobody in my family trained. This program made it feel accessible without talking down to me. By week three I was showing up to the gym without any anxiety. By week four I could see changes.",
    initials: "LV",
    date: "Apr 2026",
    dateIso: "2026-04-01",
  },
  {
    id: "t5",
    name: "Priya Nair",
    context: "Software engineer, 29 · Seattle, WA",
    tag: "Training Foundations",
    stars: 5,
    quote: "Work hours are long so I needed something that fit into 45 minutes three times a week. No fluff, just structure. By week four I hit a deadlift I never thought I could. The way progressive overload is built into the program means you actually see the numbers move.",
    initials: "PN",
    date: "Feb 2026",
    dateIso: "2026-02-15",
  },
  {
    id: "t6",
    name: "Zoe Hartmann",
    context: "Photographer, 33 · Portland, OR",
    tag: "Training Foundations",
    stars: 5,
    quote: "I bought this on a Sunday and started Monday. By end of week one I already knew it was different. The hip hinge module alone fixed something in my lower back that had been bothering me for months. Never connected that the way I was bending was the problem.",
    initials: "ZH",
    date: "Dec 2025",
    dateIso: "2025-12-01",
  },
  {
    id: "t7",
    name: "Tomás Reyes",
    context: "Sales rep, 31 · Dallas, TX",
    tag: "Training Foundations",
    stars: 5,
    quote: "I had been going to the gym on and off for five years and honestly never looked like it. Same machines, zero progression. This showed me I was skipping everything that actually matters. The difference in how I look after two rounds is not subtle.",
    initials: "TR",
    date: "Mar 2026",
    dateIso: "2026-03-15",
  },
  {
    id: "t8",
    name: "Camille Leroux",
    context: "Accountant, 36 · Toronto, ON",
    tag: "Training Foundations",
    stars: 5,
    quote: "Started this two months after my second baby. My core felt completely disconnected. Four weeks in and I can engage muscles I thought were gone. Six weeks in my pants fit differently. The pacing is sensible but the results are real.",
    initials: "CL",
    date: "Jan 2026",
    dateIso: "2026-01-15",
  },
  {
    id: "t9",
    name: "Aisha Williams",
    context: "Social worker, 30 · Atlanta, GA",
    tag: "Training Foundations",
    stars: 5,
    quote: "I had already bought two fitness things that year and finished neither. This is the first one I completed. The module on progressive overload finally explained something I had heard a hundred times but never actually understood.",
    initials: "AW",
    date: "Apr 2026",
    dateIso: "2026-04-01",
  },
  {
    id: "t10",
    name: "Alex Fontaine",
    context: "Freelancer, 27 · Montreal, QC",
    tag: "Training Foundations",
    stars: 5,
    quote: "I started this at home with just dumbbells and a band. By week three I felt ready to try a real gym. The program works either way because it explains what each movement is actually doing, not just how to do it. Confidence went up fast.",
    initials: "AF",
    date: "Feb 2026",
    dateIso: "2026-02-20",
  },
  {
    id: "t11",
    name: "Brianna Okafor",
    context: "UX researcher, 32 · Boston, MA",
    tag: "Training Foundations",
    stars: 5,
    quote: "Most online courses give you a PDF and nothing else. Here the tracking is built into the platform. I can pull up week one and compare it to week four and the numbers are right there. That visibility changed my whole relationship with training.",
    initials: "BO",
    date: "Mar 2026",
    dateIso: "2026-03-20",
  },
  {
    id: "t12",
    name: "Jake Morrison",
    context: "Teacher, 26 · Denver, CO",
    tag: "Training Foundations",
    stars: 5,
    quote: "I thought I knew how to squat. The squat pattern module showed me I had been compensating for two years. Once it clicked, everything changed. Knees track properly now, lower back stopped hurting after leg days, and I can actually feel my glutes working.",
    initials: "JM",
    date: "Jan 2026",
    dateIso: "2026-01-20",
  },
]

const COACHING_TESTIMONIALS: Testimonial[] = [
  {
    id: "c1",
    name: "Daniela Vargas",
    context: "Interior designer, 33 · Miami, FL",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I had a trainer at a commercial gym before and the sessions never felt like they were actually built for me. With Lisa it was different from the very first call. She asked things nobody had asked before. Six months later I train with real confidence on my own.",
    initials: "DV",
    date: "Dec 2025",
    dateIso: "2025-12-01",
  },
  {
    id: "c2",
    name: "Gino Hanono",
    context: "Entrepreneur, 32 · New York, NY",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "Before Lisa I was only doing group fitness classes. Good for cardio but I had no idea how to actually build muscle or change my body. Lisa gave me a real program for the first time, explained the reasoning behind everything, and within three months I could see actual changes. My body looks different. The structure she brings is completely different from anything I had before.",
    initials: "GH",
    date: "Feb 2026",
    dateIso: "2026-02-01",
  },
  {
    id: "c3",
    name: "Marcus Webb",
    context: "Account director, 38 · Chicago, IL",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "Lower back pain had been derailing my training for two years. A lot of advice, nothing that actually stuck. Lisa figured out what was going on quickly and built around it from day one. Five months in I am training pain free, consistently, and I have more muscle than I have had in years. The results are real.",
    initials: "MW",
    date: "Jan 2026",
    dateIso: "2026-01-01",
  },
  {
    id: "c4",
    name: "Ingrid Solberg",
    context: "UX designer, 31 · San Francisco, CA",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "The check-ins are what make this worth it. Not just workouts but tracking how you feel, sleep, what is and is not working. I tried app-based coaching before and it felt like texting a bot. This does not. Lisa is actually there.",
    initials: "IS",
    date: "Mar 2026",
    dateIso: "2026-03-01",
  },
  {
    id: "c5",
    name: "Diana Khoury",
    context: "Lawyer, 40 · Boston, MA",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I came to Lisa after a shoulder injury two physios had not fully resolved. She built the program around it from day one, no shortcuts, no ignoring it. Eight months later I am lifting weight I genuinely never expected to reach and the shoulder has not flared up once.",
    initials: "DK",
    date: "Jan 2026",
    dateIso: "2026-01-15",
  },
  {
    id: "c6",
    name: "Valentina Cruz",
    context: "Marketing director, 35 · Phoenix, AZ",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I told Lisa I wanted to lose fat. She said we were going to build muscle first. I did not fully get it at the time. Four months later I am leaner than I have ever been without ever restricting aggressively. Down 8kg. My body looks different and I finally understand why that approach works.",
    initials: "VC",
    date: "Feb 2026",
    dateIso: "2026-02-15",
  },
  {
    id: "c7",
    name: "James Callahan",
    context: "Project manager, 31 · Denver, CO",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "Trained on my own for a year and made basically no progress. Lisa identified what I was doing wrong in the first week. What also stood out is how available she actually is. Send a question mid-week and get a real answer, not a template. Six months later I am 7kg heavier and finally look like I train.",
    initials: "JC",
    date: "Mar 2026",
    dateIso: "2026-03-15",
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
