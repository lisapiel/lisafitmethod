import Image from "next/image"
import Link from "next/link"
import { getPublishedVideoUrl, getPublishedPhotoUrl } from "@/lib/mediaClient"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Training Foundations — Lisa Fit Method",
  description:
    "A 4-week strength training program for women beginners. Learn the movements, build the habits, and create a foundation that lasts. One-time payment, yours forever.",
  openGraph: {
    title: "Training Foundations — Lisa Fit Method",
    description: "A 4-week strength training program for women beginners. $47 one-time, yours forever.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

const MODULES = [
  {
    num: "01",
    tag: "Module 1",
    title: "Foundation Movements",
    desc: "The five movement patterns every lifter needs before adding weight or complexity. Skip this and everything else becomes harder and more dangerous.",
    items: [
      "Hip Hinge — the most important movement you'll learn",
      "Squat Pattern — knees, hips, and spine working together",
      "Push Pattern — pressing without wrecking your shoulders",
      "Pull Pattern — building the back that protects everything",
      "Brace & Carry — how your core actually works",
    ],
  },
  {
    num: "02",
    tag: "Module 2",
    title: "Core & Glute Priority",
    desc: "Targeted training for the muscles most responsible for lower back health, posture, and strength. This is the work most programs skip.",
    items: [
      "Dead Bug & Bird Dog — anti-extension stability",
      "Glute Bridge & Hip Thrust — the primary glute builders",
      "Glute Medius Circuit — the work most programs ignore",
      "Romanian Deadlift — posterior chain under load",
      "Pallof Press & Farmer's Carry — anti-rotation and bracing",
    ],
  },
  {
    num: "03",
    tag: "Module 3",
    title: "The 4-Week Program",
    desc: "Three days a week. Warm-ups, working sets, and cool-downs. Every session structured with intent. Weeks 3 and 4 include progressive overload built in.",
    items: [
      "Day A — Lower body focus",
      "Day B — Upper body focus",
      "Day C — Movement quality & integration",
      "Weeks 3 & 4 — Progressive overload built in",
      "10-minute warm-ups and 5-minute cool-downs included",
    ],
  },
  {
    num: "04",
    tag: "Module 4",
    title: "Nutrition Foundations",
    desc: "Five principles that support everything you do in the gym without obsessing over food or following a complicated diet.",
    items: [
      "Protein is your priority",
      "Eat enough to train",
      "Consistency beats perfection",
      "Hydration affects everything",
      "Don't complicate it until you've mastered the basics",
    ],
  },
]

export default async function CoursesPage() {
  const [trailerUrl, testimonialsUrl] = await Promise.all([
    getPublishedVideoUrl("lp_trailer"),
    getPublishedPhotoUrl("testimonials"),
  ])

  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root {
          --black: #0a0a0a; --off-white: #f5f2ee; --warm-white: #faf8f5;
          --accent: #c8a97e; --accent-dark: #a8895e; --text: #1a1a1a; --muted: #6b6560;
        }
      `}</style>

      {/* HERO */}
      <section style={{ background: "#0a0a0a", padding: "120px 80px", textAlign: "center" }} className="courses-hero">
        <style>{`
          .courses-hero { padding: 120px 80px; }
          @media (max-width: 768px) { .courses-hero { padding: 80px 28px !important; } }
        `}</style>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20 }}>
          Lisa Fit Method
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(44px, 5vw, 72px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.05, marginBottom: 24 }}>
          Training Foundations
        </h1>
        <p style={{ fontSize: 18, color: "rgba(245,242,238,0.6)", maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.7 }}>
          A 4-week beginner program built around the movements, habits, and structure that actually create results — and keep you training for life.
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 14, marginBottom: 28 }}>
          <span style={{ fontSize: 18, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>$67</span>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#c8a97e", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>$47</span>
          <span style={{ fontSize: 10, color: "#0a0a0a", background: "#c8a97e", padding: "5px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Limited Time</span>
        </div>
        <Link href="/checkout" style={{ display: "inline-block", background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 64px" }}>
          Get Instant Access
        </Link>
        <p style={{ marginTop: 16, fontSize: 12, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
          One-time payment · Yours forever · No subscription
        </p>
      </section>

      {/* MODULES */}
      <section style={{ background: "#0a0a0a", padding: "0 80px 120px" }} className="modules-section">
        <style>{`
          @media (max-width: 768px) { .modules-section { padding: 0 28px 80px !important; } .modules-grid { grid-template-columns: 1fr !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ borderBottom: "1px solid rgba(245,242,238,0.08)", paddingBottom: 40, marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 16 }}>What&apos;s inside</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 3vw, 48px)", fontWeight: 700, color: "#f5f2ee", lineHeight: 1.1 }}>
              Four modules. <em style={{ fontStyle: "italic", color: "#c8a97e" }}>One foundation.</em>
            </h2>
          </div>
          <div className="modules-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, background: "rgba(245,242,238,0.04)" }}>
            {MODULES.map((mod) => (
              <div key={mod.num} style={{ background: "#0a0a0a", padding: "48px 40px", position: "relative" }}>
                <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: 64, fontWeight: 900, color: "rgba(200,169,126,0.1)", position: "absolute", top: 24, right: 32, lineHeight: 1 }}>
                  {mod.num}
                </span>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 14 }}>{mod.tag}</p>
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 24, fontWeight: 700, color: "#f5f2ee", marginBottom: 14, lineHeight: 1.3 }}>{mod.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(245,242,238,0.45)", marginBottom: 20 }}>{mod.desc}</p>
                <ul style={{ listStyle: "none" }}>
                  {mod.items.map((item) => (
                    <li key={item} style={{ fontSize: 13, color: "rgba(245,242,238,0.4)", padding: "6px 0 6px 16px", position: "relative", lineHeight: 1.5 }}>
                      <span style={{ position: "absolute", left: 0, color: "#c8a97e", fontSize: 11 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAILER */}
      {trailerUrl && (
        <section style={{ background: "#050505", padding: "100px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20 }}>A look inside</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 700, color: "#f5f2ee", lineHeight: 1.15, marginBottom: 48 }}>
            See exactly what <em style={{ fontStyle: "italic", color: "#c8a97e" }}>you&apos;re getting.</em>
          </h2>
          <div style={{ position: "relative", width: "100%", maxWidth: 560, margin: "0 auto", aspectRatio: "1334 / 1080", background: "#0a0a0a", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
            <video src={trailerUrl} autoPlay muted loop playsInline controls preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonialsUrl && (
        <section style={{ background: "#f5f2ee", padding: "100px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 20 }}>Real results</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 700, color: "#0a0a0a", lineHeight: 1.15, marginBottom: 48 }}>
            What people <em style={{ fontStyle: "italic", color: "#a8895e" }}>are saying.</em>
          </h2>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Image src={testimonialsUrl} alt="Testimonials from Lisa Fit Method students" width={1800} height={1200} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </section>
      )}

      {/* WHO IT'S FOR */}
      <section style={{ background: "#faf8f5", padding: "120px 80px" }} className="for-section">
        <style>{`
          @media (max-width: 768px) { .for-section { padding: 80px 28px !important; } .for-grid { grid-template-columns: 1fr !important; gap: 48px !important; } .for-right { padding-top: 0 !important; } }
        `}</style>
        <div className="for-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>Is this for me?</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 3.5vw, 46px)", fontWeight: 700, color: "#0a0a0a", lineHeight: 1.1, marginBottom: 32 }}>
              This is for you <em style={{ fontStyle: "italic", color: "#a8895e" }}>if you&apos;re serious.</em>
            </h2>
            <ul style={{ listStyle: "none" }}>
              {[
                "You're new to structured training or feel like you've been winging it",
                "You want to understand the why behind every movement, not just follow a list",
                "You've had nagging injuries or lower back pain and want to train safely",
                "You're tired of random workouts that don't build on each other",
                "You're ready to commit to 3 days a week for 4 weeks",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 15, color: "#1a1a1a", lineHeight: 1.5 }}>
                  <span style={{ color: "#a8895e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="for-right" style={{ paddingTop: 80 }}>
            <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 26, fontWeight: 700, color: "#0a0a0a", marginBottom: 8 }}>This is not for you</h3>
            <p style={{ fontSize: 13, color: "#6b6560", marginBottom: 24 }}>(and that&apos;s okay)</p>
            <ul style={{ listStyle: "none" }}>
              {[
                "You're looking for a quick fix or a 7-day transformation",
                "You already have years of consistent structured training",
                "You're not willing to do warm-ups or cool-downs",
                "You want someone to tell you to push through bad form",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 15, color: "#6b6560", lineHeight: 1.5 }}>
                  <span style={{ color: "#bbb", fontSize: 18, flexShrink: 0 }}>×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "#0a0a0a", padding: "120px 80px", textAlign: "center", position: "relative", overflow: "hidden" }} className="final-cta">
        <style>{`
          @media (max-width: 768px) { .final-cta { padding: 80px 28px !important; } }
        `}</style>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(200,169,126,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20, position: "relative", zIndex: 1 }}>Ready to start?</p>
        <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(38px, 4.5vw, 60px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 24, position: "relative", zIndex: 1 }}>
          Build the foundation.<br />
          <em style={{ fontStyle: "italic", color: "#c8a97e" }}>Train for life.</em>
        </h2>
        <div style={{ position: "relative", zIndex: 1, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0a0a0a", background: "#c8a97e", padding: "6px 16px", marginBottom: 20, fontFamily: "var(--font-dm-sans), sans-serif" }}>Limited Time Offer</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
            <span style={{ fontSize: 20, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>$67</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: "#c8a97e", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>$47</span>
          </div>
          <Link href="/checkout" style={{ display: "inline-block", background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 72px" }}>
            Get Instant Access
          </Link>
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            One-time payment · <strong style={{ color: "rgba(245,242,238,0.55)", fontWeight: 500 }}>Yours forever</strong> · No subscription
          </p>
        </div>

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: "Training Foundations",
              description: "A 4-week beginner strength training program for women. Learn the movements, build the habits, and create a foundation that lasts.",
              provider: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer" },
              offers: { "@type": "Offer", price: "47", priceCurrency: "USD", availability: "https://schema.org/InStock" },
              url: "https://lisafitmethod.com/courses",
            }),
          }}
        />
      </section>
    </main>
  )
}
