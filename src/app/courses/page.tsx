import Image from "next/image"
import Link from "next/link"
import { getPublishedVideoUrl, getPublishedPhotoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Training Foundations — Lisa Fit Method",
  description:
    "A 4-week beginner strength training program. Learn the movements, build the habits, and create a foundation that lasts. One-time payment, yours forever.",
  openGraph: {
    title: "Training Foundations — Lisa Fit Method",
    description: "A 4-week beginner strength training program. $47 one-time, yours forever.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

const MODULE_ITEMS = [
  [
    "Hip hinge: learn how to protect your back under load",
    "Squat pattern: build strength through the hips, knees, and core",
    "Push pattern: press safely without destroying your shoulders",
    "Pull pattern: build posture, stability, and upper body strength",
    "Brace & carry: understand how your core actually works",
  ],
  [
    "Core stability fundamentals",
    "Glute strength & lower body stability",
    "Learn to load the posterior chain safely",
    "Build a stronger core that supports heavier lifting",
  ],
  [
    "3 structured training days per week",
    "Built-in warm-ups and cool-downs",
    "Progressive overload system included",
    "Step-by-step exercise guidance",
    "Workout & progress tracking built in",
    "Designed to be repeated and progressed beyond the first 4 weeks",
  ],
  [
    "Protein first",
    "Fuel your training properly",
    "Consistency over perfection",
    "Hydration affects everything",
    "Stop overcomplicating nutrition",
  ],
]

export default async function CoursesPage() {
  const [trailerUrl, testimonialsUrl, settings] = await Promise.all([
    getPublishedVideoUrl("lp_trailer"),
    getPublishedPhotoUrl("testimonials"),
    fetchSiteSettings(),
  ])

  const t = settings.text
  const accent = settings.colors.accent
  const hs = settings.typography.headingScale
  const bs = settings.typography.bodyScale

  const modules = [
    { num: "01", tag: "Module 1", title: t.mod1Title, desc: t.mod1Desc, items: MODULE_ITEMS[0] },
    { num: "02", tag: "Module 2", title: t.mod2Title, desc: t.mod2Desc, items: MODULE_ITEMS[1] },
    { num: "03", tag: "Module 3", title: t.mod3Title, desc: t.mod3Desc, items: MODULE_ITEMS[2] },
    { num: "04", tag: "Module 4", title: t.mod4Title, desc: t.mod4Desc, items: MODULE_ITEMS[3] },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Training Foundations",
    description: "A 4-week beginner strength training program. Learn the foundational movements, build consistent habits, and create a base that supports your training for life.",
    image: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png", width: 1200, height: 800 },
    url: "https://lisafitmethod.com/courses",
    provider: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
    instructor: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
    courseMode: "online",
    educationalLevel: "Beginner",
    timeRequired: "P4W",
    inLanguage: "en",
    teaches: ["Hip Hinge", "Squat Pattern", "Push Pattern", "Pull Pattern", "Core Stability", "Progressive Overload", "Nutrition Fundamentals"],
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", instructor: { "@type": "Person", name: "Lisa McPherson" } },
    offers: {
      "@type": "Offer",
      price: Number(t.coursePrice),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://lisafitmethod.com/checkout",
      seller: { "@type": "Organization", name: "Lisa Fit Method" },
    },
    hasPart: modules.map((m) => ({
      "@type": "Course",
      name: m.title,
      description: m.desc,
    })),
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "How long does each session take?", acceptedAnswer: { "@type": "Answer", text: "Between 45 and 60 minutes including warm-up and cool-down." } },
      { "@type": "Question", name: "Do I need a gym membership?", acceptedAnswer: { "@type": "Answer", text: "You need access to basic equipment: dumbbells, a resistance band, and a flat bench or equivalent." } },
      { "@type": "Question", name: "Is this for complete beginners?", acceptedAnswer: { "@type": "Answer", text: "Yes. It's designed for people who are new to structured training or feel like they've been winging it — regardless of experience level." } },
      { "@type": "Question", name: "Can I do more than 4 weeks?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. The program is designed to be run in multiple rounds. Each round you add weight and progress further. Four weeks is the foundation — most people who see real results run it 2 or 3 times." } },
      { "@type": "Question", name: "Is this a one-time payment?", acceptedAnswer: { "@type": "Answer", text: "Yes. One-time payment, yours forever, no subscription." } },
      { "@type": "Question", name: "Can men do this program?", acceptedAnswer: { "@type": "Answer", text: "Yes. The movements and principles apply to everyone. The program has no gender-specific requirements." } },
    ],
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "Training Foundations", item: "https://lisafitmethod.com/courses" },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root {
          --black: #0a0a0a; --off-white: #f5f2ee; --warm-white: #faf8f5;
          --accent: ${accent}; --accent-dark: #a8895e; --text: #1a1a1a; --muted: #6b6560;
          --heading-scale: ${hs}; --body-scale: ${bs};
        }
      `}</style>

      {/* HERO */}
      <section style={{ background: "#0a0a0a", padding: "120px 80px", textAlign: "center" }} className="courses-hero">
        <style>{`
          @media (max-width: 768px) { .courses-hero { padding: 80px 28px !important; } }
        `}</style>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>
          Lisa Fit Method
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(44px, 5vw, 72px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.05, marginBottom: 24 }}>
          {t.coursesHeroHeadline}
        </h1>
        <p style={{ fontSize: `calc(18px * ${bs})`, color: "rgba(245,242,238,0.6)", maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.7 }}>
          {t.coursesHeroSubtext}
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 14, marginBottom: 28 }}>
          <span style={{ fontSize: 18, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>$97</span>
          <span style={{ fontSize: 56, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
          <span style={{ fontSize: 10, color: "#0a0a0a", background: accent, padding: "5px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Limited Time</span>
        </div>
        <Link href="/checkout" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 64px" }}>
          Get Instant Access
        </Link>
        <p style={{ marginTop: 16, fontSize: 12, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
          One-time payment · Lifetime access · Built-in workout &amp; progress tracking
        </p>
      </section>

      {/* TRAILER */}
      {trailerUrl && (
        <section style={{ background: "#050505", padding: "100px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>A look inside</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 42px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.15, marginBottom: 48 }}>
            See exactly what <em style={{ fontStyle: "italic", color: accent }}>you&apos;re getting.</em>
          </h2>
          <div style={{ position: "relative", width: "100%", maxWidth: 560, margin: "0 auto", aspectRatio: "1334 / 1080", background: "#0a0a0a", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
            <video src={trailerUrl} autoPlay muted loop playsInline controls preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
          </div>
          <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.4)", maxWidth: 520, margin: "32px auto 0", lineHeight: 1.7, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Full exercise walkthroughs, movement breakdowns, built-in workout tracking, progression systems, warm-ups, and real structure from day one.
          </p>
        </section>
      )}

      {/* MODULES */}
      <section style={{ background: "#0a0a0a", padding: "0 80px 120px" }} className="modules-section">
        <style>{`
          @media (max-width: 768px) { .modules-section { padding: 0 28px 80px !important; } .modules-grid { grid-template-columns: 1fr !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ borderBottom: "1px solid rgba(245,242,238,0.08)", paddingBottom: 40, marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 16 }}>What&apos;s inside</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3vw, 48px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.1 }}>
              Four modules. <em style={{ fontStyle: "italic", color: accent }}>One real foundation.</em>
            </h2>
          </div>
          <div className="modules-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, background: "rgba(245,242,238,0.04)" }}>
            {modules.map((mod) => (
              <div key={mod.num} style={{ background: "#0a0a0a", padding: "48px 40px", position: "relative" }}>
                <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: 64, fontWeight: 900, color: "rgba(200,169,126,0.1)", position: "absolute", top: 24, right: 32, lineHeight: 1 }}>
                  {mod.num}
                </span>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 14 }}>{mod.tag}</p>
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(24px * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 14, lineHeight: 1.3 }}>{mod.title}</h3>
                <p style={{ fontSize: `calc(14px * ${bs})`, lineHeight: 1.75, color: "rgba(245,242,238,0.45)", marginBottom: 20 }}>{mod.desc}</p>
                <ul style={{ listStyle: "none" }}>
                  {mod.items.map((item) => (
                    <li key={item} style={{ fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.4)", padding: "6px 0 6px 16px", position: "relative", lineHeight: 1.5 }}>
                      <span style={{ position: "absolute", left: 0, color: accent, fontSize: 11 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonialsUrl && (
        <section style={{ background: "#f5f2ee", padding: "100px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 20 }}>Real results</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 42px) * ${hs})`, fontWeight: 700, color: "#0a0a0a", lineHeight: 1.15, marginBottom: 48 }}>
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
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3.5vw, 46px) * ${hs})`, fontWeight: 700, color: "#0a0a0a", lineHeight: 1.1, marginBottom: 32 }}>
              This is for you <em style={{ fontStyle: "italic", color: "#a8895e" }}>if you&apos;re serious.</em>
            </h2>
            <ul style={{ listStyle: "none" }}>
              {[
                "You're tired of random workouts that lead nowhere",
                "You want structure instead of guessing",
                "You want to understand why you're doing each movement",
                "You've dealt with nagging pain, instability, or recurring injuries",
                "You want a program you can continue progressing",
                "You're ready to train consistently and actually build strength",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: `calc(15px * ${bs})`, color: "#1a1a1a", lineHeight: 1.5 }}>
                  <span style={{ color: "#a8895e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="for-right" style={{ paddingTop: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>Want more?</p>
            <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(26px * ${hs})`, fontWeight: 700, color: "#0a0a0a", marginBottom: 20, lineHeight: 1.2 }}>
              Ready for a fully<br /><em style={{ fontStyle: "italic", color: "#a8895e" }}>personalized plan?</em>
            </h3>
            <p style={{ fontSize: `calc(15px * ${bs})`, color: "#1a1a1a", lineHeight: 1.75, marginBottom: 16 }}>
              Training Foundations gives you the system. 1:1 coaching gives you a program fully built around your body, goals, schedule, injuries, recovery, and progress.
            </p>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "#6b6560", lineHeight: 1.7, marginBottom: 32 }}>
              You&apos;ll get direct feedback, personalized programming, ongoing adjustments, and real accountability every step of the way.
            </p>
            <Link
              href="/coaching"
              style={{
                display: "inline-block",
                border: "2px solid #a8895e",
                color: "#a8895e",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "16px 32px",
              }}
            >
              Ask about 1:1 coaching →
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "#0a0a0a", padding: "120px 80px", textAlign: "center", position: "relative", overflow: "hidden" }} className="final-cta">
        <style>{`
          @media (max-width: 768px) { .final-cta { padding: 80px 28px !important; } }
        `}</style>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(200,169,126,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20, position: "relative", zIndex: 1 }}>Ready to start?</p>
        <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(38px, 4.5vw, 60px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 24, position: "relative", zIndex: 1 }}>
          {t.coursesFinalHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
          ))}
        </h2>
        <div style={{ position: "relative", zIndex: 1, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0a0a0a", background: accent, padding: "6px 16px", marginBottom: 20, fontFamily: "var(--font-dm-sans), sans-serif" }}>Limited Time Offer</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
            <span style={{ fontSize: 20, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>$97</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
          </div>
          <Link href="/checkout" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 72px" }}>
            Get Instant Access
          </Link>
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            One-time payment · <strong style={{ color: "rgba(245,242,238,0.55)", fontWeight: 500 }}>Lifetime access</strong> · Built-in workout &amp; progress tracking
          </p>
        </div>

      </section>
    </main>
    </>
  )
}
