type Testimonial = {
  id: string
  name: string
  location: string
  tag: string
  stars: number
  quote: string
  initials: string
}

const COURSE_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Melissa R.",
    location: "Chicago, IL",
    tag: "Training Foundations",
    stars: 5,
    quote: "I've tried a few online programs and always quit by week two. The way the movements are explained here actually makes sense — I finally feel confident walking into the gym without second-guessing every rep.",
    initials: "MR",
  },
  {
    id: "t2",
    name: "Jessica T.",
    location: "Austin, TX",
    tag: "Training Foundations",
    stars: 5,
    quote: "I have a desk job and my back and hips were constantly tight. Three weeks in and the difference is real. The core and glute work is no joke — I had no idea how weak my foundation actually was.",
    initials: "JT",
  },
  {
    id: "t3",
    name: "Sarah M.",
    location: "New York, NY",
    tag: "Training Foundations",
    stars: 5,
    quote: "The built-in progress tracking is what kept me going. Seeing the numbers climb week over week was genuinely addicting. I've been through the program twice now and still love it.",
    initials: "SM",
  },
]

const COACHING_TESTIMONIALS: Testimonial[] = [
  {
    id: "c1",
    name: "Daniela V.",
    location: "Miami, FL",
    tag: "1:1 Coaching",
    stars: 5,
    quote: "Lisa caught issues with my squat form on our very first call that I'd been doing wrong for years. The depth of her feedback and the way she programs around your actual life is something else entirely.",
    initials: "DV",
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div role="img" aria-label={`${count} out of 5 stars`} style={{ display: "flex", gap: 3, marginBottom: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#c8a97e" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article
      style={{
        background: "#fff",
        padding: "32px 28px",
        borderTop: "2px solid #c8a97e",
        boxShadow: "0 1px 20px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}>
        <div
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #c8a97e 0%, #a8895e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>
            {t.initials}
          </span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.3 }}>
            {t.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#6b6560", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            {t.location}
          </p>
        </div>
      </div>
      <Stars count={t.stars} />
      <blockquote
        style={{
          margin: 0, flex: 1,
          fontFamily: "var(--font-playfair), serif",
          fontSize: "calc(15px * var(--body-scale, 1))",
          fontStyle: "italic",
          color: "#1a1a1a",
          lineHeight: 1.75,
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="#a8895e" strokeWidth="2" />
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#a8895e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Verified · {t.tag}
        </span>
      </div>
    </article>
  )
}

function VideoPlaceholderCard() {
  return (
    <div
      style={{
        background: "#f5f2ee",
        padding: "40px 36px",
        border: "1.5px dashed rgba(200,169,126,0.55)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 240,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 80% 20%, rgba(200,169,126,0.1) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "1.5px solid rgba(200,169,126,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="#c8a97e" strokeWidth="1.5" />
          <path d="M10 8.5l5.5 3.5-5.5 3.5V8.5z" fill="#c8a97e" />
        </svg>
      </div>
      <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(17px, 2vw, 20px)", fontWeight: 700, fontStyle: "italic", color: "#0a0a0a", lineHeight: 1.3, marginBottom: 12 }}>
        Video testimonial<br />coming soon.
      </p>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#6b6560", lineHeight: 1.65, maxWidth: 320, margin: "0 0 20px" }}>
        A client is recording her full story on camera — in her own words, no script.
      </p>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        1:1 Coaching
      </span>
    </div>
  )
}

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
        .t-course-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .t-coaching-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 860px) {
          .t-course-grid { grid-template-columns: 1fr; }
          .t-coaching-grid { grid-template-columns: 1fr; }
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
        <div className="t-course-grid" style={{ marginBottom: 48 }}>
          {COURSE_TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>

        <SectionDivider label="1:1 Coaching" />
        <div className="t-coaching-grid">
          {COACHING_TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
          <VideoPlaceholderCard />
        </div>
      </div>
    </section>
  )
}

export { COURSE_TESTIMONIALS, COACHING_TESTIMONIALS }
