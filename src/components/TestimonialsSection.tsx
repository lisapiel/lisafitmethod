import { TestimonialsCarousel } from "@/components/TestimonialsCarousel.client"
import type { Testimonial } from "@/components/TestimonialsCarousel.client"

const COACHING_TESTIMONIALS: Testimonial[] = [
  {
    id: "c1",
    name: "Sophie Tremblay",
    context: "Interior designer, 43 · Montreal, QC",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I convinced myself for years that I had started too late. Lisa's response to my first check-in made me realize how much that belief was holding me back. She never treats age as a limitation. Eight months in I feel stronger than I did at 30 and I finally understand how my body actually works.",
    initials: "ST",
    date: "Jan 2026",
    dateIso: "2026-01-10",
  },
  {
    id: "c2",
    name: "David Goldfarb",
    context: "Entrepreneur, 40 · New York, NY",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I had two coaches before Lisa. Both had good programs on paper. Neither actually responded when I had questions. Lisa answers. Not two days later, same day. That alone changed how seriously I took everything and how much I got out of it.",
    initials: "DG",
    date: "Feb 2026",
    dateIso: "2026-02-05",
  },
  {
    id: "c3",
    name: "Rachel Blum",
    context: "Lawyer, 48 · Toronto, ON",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I came after a back injury that had me scared to lift heavy again. I almost cancelled my first call because I thought coaching was for people younger and further along than me. Lisa built the whole program around what my body could handle and slowly expanded from there. Six months later I deadlifted my own bodyweight.",
    initials: "RB",
    date: "Dec 2025",
    dateIso: "2025-12-15",
  },
  {
    id: "c4",
    name: "Marc-Antoine Beaulieu",
    context: "Project manager, 36 · Quebec City, QC",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "The check-ins are what keep me honest. Knowing she is actually going to review my week means I show up even when I do not feel like it. She catches things before I even know to be frustrated about them. That level of attention is what makes the difference.",
    initials: "MB",
    date: "Mar 2026",
    dateIso: "2026-03-01",
  },
  {
    id: "c5",
    name: "Leah Horowitz",
    context: "Teacher, 45 · Montreal, QC",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I was 45 when I started and the gym felt like a place for other people. Lisa made me feel like it was built exactly for me. She designed everything around my schedule, my limitations, and my actual goals. Three months in I was already more confident than I had been in years.",
    initials: "LH",
    date: "Nov 2025",
    dateIso: "2025-11-20",
  },
  {
    id: "c6",
    name: "Camille Rousseau",
    context: "Pharmacist, 51 · Lyon, France",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I had a lot of reasons why coaching would not work for me at 51. Lisa basically dismantled every single one. She does not use age as an excuse to go easy, but she also does not ignore what your body actually needs. The program felt genuinely built for where I was.",
    initials: "CR",
    date: "Jan 2026",
    dateIso: "2026-01-25",
  },
  {
    id: "c7",
    name: "Yasmine Benali",
    context: "Marketing director, 38 · Lyon, France",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "I hired Lisa to help me train. I did not expect her to also change how I eat. The nutrition coaching is woven into every check-in, not an afterthought. Down 9kg in five months and my energy is completely different. I would not have figured this out on my own.",
    initials: "YB",
    date: "Apr 2026",
    dateIso: "2026-04-10",
  },
]

const COURSE_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Jennifer Stein",
    context: "Registered nurse, 37 · Chicago, IL",
    tag: "Training Foundations",
    stars: 5,
    quote: "I bought two other fitness programs before this one and quit both by week three. This is the first one I actually finished. And then repeated. The structure is clear, the explanations make sense, and I never once felt like I was guessing what to do next.",
    initials: "JS",
    date: "Feb 2026",
    dateIso: "2026-02-10",
  },
  {
    id: "t2",
    name: "Isabelle Fontaine",
    context: "Elementary school teacher, 44 · Montreal, QC",
    tag: "Training Foundations",
    stars: 5,
    quote: "I joined a gym at 44 with zero idea what I was doing. I was the person standing near the weights hoping nobody would notice me. This program gave me a system I could walk in and follow every single time. I have not felt lost in the gym since.",
    initials: "IF",
    date: "Jan 2026",
    dateIso: "2026-01-15",
  },
  {
    id: "t3",
    name: "Kevin Park",
    context: "Software engineer, 32 · Seattle, WA",
    tag: "Training Foundations",
    stars: 5,
    quote: "I spent months researching before buying anything and still felt completely overwhelmed. Too much conflicting information online. This program cut through all of it. Five movements, a real progression plan, and clear explanations for why each thing actually matters. My numbers have gone up every single cycle.",
    initials: "KP",
    date: "Mar 2026",
    dateIso: "2026-03-05",
  },
  {
    id: "t4",
    name: "Nathalie Beauchemin",
    context: "Marketing consultant, 50 · Quebec City, QC",
    tag: "Training Foundations",
    stars: 5,
    quote: "I honestly thought serious gym training was for younger people. These exercises proved me completely wrong. My posture improved, the back pain I had been living with basically disappeared, and I actually look forward to going to the gym now. I did not think I would ever say that.",
    initials: "NB",
    date: "Dec 2025",
    dateIso: "2025-12-10",
  },
  {
    id: "t5",
    name: "Maya Levy",
    context: "UX researcher, 29 · Boston, MA",
    tag: "Training Foundations",
    stars: 5,
    quote: "What got me was how detailed the coaching cues are. Lisa does not just show you the movement, she explains what you should feel, what to watch for, and what it means when something is off. I also asked a question by email and got a real thorough answer. That does not happen with most online programs.",
    initials: "ML",
    date: "Apr 2026",
    dateIso: "2026-04-01",
  },
  {
    id: "t6",
    name: "Simon Bergeron",
    context: "Accountant, 46 · Montreal, QC",
    tag: "Training Foundations",
    stars: 5,
    quote: "At 46 my main worry was hurting myself rather than making progress. Every exercise in this program comes with clear form cues and notes on what not to do. I felt safe the whole way through. My hips move better than they have in a decade.",
    initials: "SB",
    date: "Feb 2026",
    dateIso: "2026-02-20",
  },
  {
    id: "t7",
    name: "Danielle Cohen",
    context: "Social worker, 38 · New York, NY",
    tag: "Training Foundations",
    stars: 5,
    quote: "Before this I was doing random YouTube workouts and going nowhere. Not because the exercises were bad but because there was no structure and no progression. This program is the opposite. I know exactly what to do, why I am doing it, and how to keep making it harder over time.",
    initials: "DC",
    date: "Mar 2026",
    dateIso: "2026-03-15",
  },
  {
    id: "t8",
    name: "Laura Okonkwo",
    context: "Graphic designer, 34 · Toronto, ON",
    tag: "Training Foundations",
    stars: 5,
    quote: "I bought the bundle and it was absolutely the right call. Having the nutrition piece alongside the training answered all the questions I had been guessing at for years. Everything clicked faster when both were working together.",
    initials: "LO",
    date: "Jan 2026",
    dateIso: "2026-01-20",
  },
  {
    id: "t9",
    name: "Thomas Gagnon",
    context: "Project manager, 47 · Lyon, France",
    tag: "Training Foundations",
    stars: 5,
    quote: "I had been going to the gym on and off for years and never had much to show for it. This program showed me in the first two weeks what I had been missing. By the end of the month I could see real changes. That had genuinely never happened to me before.",
    initials: "TG",
    date: "Nov 2025",
    dateIso: "2025-11-15",
  },
  {
    id: "t10",
    name: "Priya Mehta",
    context: "Physiotherapy student, 27 · Toronto, ON",
    tag: "Training Foundations",
    stars: 5,
    quote: "I study movement for a living and the quality of the coaching cues here genuinely impressed me. Lisa knows exactly what she is talking about and explains it in a way that is clear without talking down to you. I recommend this to clients who are just getting started.",
    initials: "PM",
    date: "Apr 2026",
    dateIso: "2026-04-15",
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

        <SectionDivider label="1:1 Coaching" />
        <div style={{ marginBottom: 56 }}>
          <TestimonialsCarousel testimonials={COACHING_TESTIMONIALS} />
        </div>

        <SectionDivider label="Courses" />
        <TestimonialsCarousel testimonials={COURSE_TESTIMONIALS} />
      </div>
    </section>
  )
}

export { COURSE_TESTIMONIALS, COACHING_TESTIMONIALS }
