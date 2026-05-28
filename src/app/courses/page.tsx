import Image from "next/image"
import Link from "next/link"
import { getPublishedVideoUrl, getPublishedPhotoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import VideoPlayer from "@/components/VideoPlayer.client"
import FreeGuideTeaser from "@/components/FreeGuideTeaser.client"
import {
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
  FOUNDING_DATE,
} from "@/lib/pricing"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Training Foundations — Lisa Fit Method",
  description:
    "A 4-week beginner strength training program. Learn the movements, build the habits, and create a foundation that lasts. One-time payment, yours forever.",
  openGraph: {
    title: "Training Foundations — Lisa Fit Method",
    description: "A 4-week beginner strength training program. $97 one-time, yours forever.",
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

      {/* OUR PROGRAMS — overview of both courses */}
      <section style={{ background: "#0a0a0a", padding: "64px 80px", borderBottom: "1px solid #1a1a1a" }} className="programs-overview">
        <style>{`
          @media (max-width: 768px) { .programs-overview { padding: 48px 24px !important; } .programs-grid-2 { grid-template-columns: 1fr !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 32, textAlign: "center" }}>Our Programs</p>
          <div className="programs-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <div style={{ background: "#111111", padding: "40px 36px", borderTop: `3px solid ${accent}` }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 14, fontFamily: "var(--font-dm-sans), sans-serif" }}>Training Foundations</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(22px * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 12, lineHeight: 1.2 }}>Learn to move.<br /><em style={{ fontStyle: "italic" }}>Build real strength.</em></h2>
              <p style={{ fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, marginBottom: 24 }}>A 4-week beginner strength training program. Five foundational movements, progressive overload, built-in workout tracking.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 34, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
                <span style={{ fontSize: 9, color: "#0a0a0a", background: accent, padding: "3px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 20, lineHeight: 1.4 }}>Regular {COURSE_REGULAR_PRICE_DISPLAY} from {FOUNDING_DATE}</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/checkout" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "13px 24px" }}>Get Instant Access</Link>
                <a href="#training-detail" style={{ display: "inline-block", color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>Details ↓</a>
              </div>
            </div>
            <div style={{ background: "#111111", padding: "40px 36px", borderTop: `3px solid ${accent}` }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 14, fontFamily: "var(--font-dm-sans), sans-serif" }}>Nutrition Foundations</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(22px * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 12, lineHeight: 1.2 }}>Eat to match<br /><em style={{ fontStyle: "italic" }}>your training.</em></h2>
              <p style={{ fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, marginBottom: 24 }}>A 4-week nutrition course with a personalized TDEE calculator, a meal plan that adapts to your calorie target, and real verified recipes.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 34, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 9, color: "#0a0a0a", background: accent, padding: "3px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 20, lineHeight: 1.4 }}>Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY} from {FOUNDING_DATE}</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/checkout?product=nutrition" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "13px 24px" }}>Get Instant Access</Link>
                <Link href="/nutrition" style={{ display: "inline-block", color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>Full Details →</Link>
              </div>
            </div>
          </div>

          {/* Bundle row */}
          <div style={{ marginTop: 2 }}>
            <div style={{ background: "#1a1208", padding: "32px 36px", borderTop: `3px solid ${accent}`, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 8, fontFamily: "var(--font-dm-sans), sans-serif" }}>Foundations Bundle — Best Value</p>
                <p style={{ fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.5)", lineHeight: 1.5, maxWidth: 560 }}>Both courses together. Training Foundations + Nutrition Foundations. {BUNDLE_INDIVIDUAL_TOTAL_DISPLAY} if bought separately.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 14, color: "rgba(245,242,238,0.25)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}</span>
                    <span style={{ fontSize: 34, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{BUNDLE_PRICE_DISPLAY}</span>
                    <span style={{ fontSize: 9, color: "#0a0a0a", background: accent, padding: "3px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Save {BUNDLE_SAVINGS_DISPLAY}</span>
                  </div>
                </div>
                <Link href="/checkout?product=bundle" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "13px 28px", whiteSpace: "nowrap" }}>Get Both Courses</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERO — Training Foundations detail */}
      <section id="training-detail" style={{ background: "#0a0a0a" }} className="courses-hero">
        <style>{`
          .courses-video-band {
            width: 100%;
            height: 62vh;
            min-height: 320px;
            overflow: hidden;
            background: #111;
          }
          .courses-hero-text {
            max-width: 1100px;
            margin: 0 auto;
            padding: 52px 80px 80px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 60px;
            align-items: start;
          }
          .courses-hero-cta-col {
            min-width: 220px;
          }
          .courses-hero-no-video {
            max-width: 680px;
            margin: 0 auto;
            padding: 100px 80px 80px;
            text-align: center;
          }
          @media (max-width: 768px) {
            .courses-video-band { height: 56vw; min-height: 220px; }
            .courses-hero-text { grid-template-columns: 1fr; gap: 32px; padding: 40px 24px 56px; }
            .courses-hero-no-video { padding: 64px 24px 56px; }
          }
        `}</style>

        {/* Video — directly under navbar, no gap */}
        {trailerUrl && (
          <div className="courses-video-band">
            <VideoPlayer src={trailerUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}

        {/* Content */}
        {trailerUrl ? (
          <div className="courses-hero-text">
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>
                Lisa Fit Method
              </p>
              <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 4.5vw, 64px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.05, marginBottom: 20 }}>
                {t.coursesHeroHeadline}
              </h1>
              <p style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.55)", lineHeight: 1.4 }}>
                {t.coursesHeroSubtext}
              </p>
            </div>
            <div className="courses-hero-cta-col">
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 52, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
                <span style={{ fontSize: 10, color: "#0a0a0a", background: accent, padding: "5px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
              </div>
              <Link href="/checkout" style={{ display: "block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 32px", textAlign: "center" }}>
                Get Instant Access
              </Link>
              <p style={{ marginTop: 14, fontSize: 11, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.4 }}>
                One-time payment · Lifetime access<br />Built-in workout &amp; progress tracking
              </p>
            </div>
          </div>
        ) : (
          <div className="courses-hero-no-video">
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>
              Lisa Fit Method
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 4.5vw, 64px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.05, marginBottom: 24 }}>
              {t.coursesHeroHeadline}
            </h1>
            <p style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.55)", lineHeight: 1.4, marginBottom: 40 }}>
              {t.coursesHeroSubtext}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, justifyContent: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 18, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>$97</span>
              <span style={{ fontSize: 52, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
              <span style={{ fontSize: 10, color: "#0a0a0a", background: accent, padding: "5px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Limited Time</span>
            </div>
            <Link href="/checkout" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 64px" }}>
              Get Instant Access
            </Link>
            <p style={{ marginTop: 16, fontSize: 12, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
              One-time payment · Lifetime access · Built-in workout &amp; progress tracking
            </p>
          </div>
        )}
      </section>

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
                <p style={{ fontSize: `calc(14px * ${bs})`, lineHeight: 1.4, color: "rgba(245,242,238,0.45)", marginBottom: 20 }}>{mod.desc}</p>
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
            <p style={{ fontSize: `calc(15px * ${bs})`, color: "#1a1a1a", lineHeight: 1.4, marginBottom: 16 }}>
              Training Foundations gives you the system. 1:1 coaching gives you a program fully built around your body, goals, schedule, injuries, recovery, and progress.
            </p>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "#6b6560", lineHeight: 1.4, marginBottom: 32 }}>
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

      {/* NUTRITION FOUNDATIONS CALLOUT */}
      <section style={{ background: "#111111", padding: "100px 80px", borderTop: "1px solid #1a1a1a" }} className="nutrition-callout">
        <style>{`
          @media (max-width: 768px) { .nutrition-callout { padding: 72px 28px !important; } .nutrition-callout-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }
        `}</style>
        <div className="nutrition-callout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto", alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 16 }}>Also from Lisa Fit Method</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(30px, 3vw, 44px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.15, marginBottom: 20 }}>
              Pair it with<br /><em style={{ fontStyle: "italic", color: accent }}>Nutrition Foundations.</em>
            </h2>
            <p style={{ fontSize: `calc(15px * ${bs})`, color: "rgba(245,242,238,0.55)", lineHeight: 1.6, marginBottom: 28 }}>
              Training alone only gets you part of the way. Nutrition Foundations is a 4-week paid course that builds the eating habits to match — with a personalized TDEE calculator, a structured meal plan that adapts to your calorie target, science-backed education, and real recipes from verified sources.
            </p>
            <ul style={{ listStyle: "none", marginBottom: 36 }}>
              {[
                "Interactive TDEE calculator — personalized to your stats and goal",
                "4-week meal plan with real, attributed recipes",
                "Macro education, eating-out guide, and supplement evidence",
                "Written by a CPT with full research citations throughout",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(245,242,238,0.06)", fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.5)", lineHeight: 1.5 }}>
                  <span style={{ color: accent, flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, color: "rgba(245,242,238,0.25)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 44, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 10, color: "#0a0a0a", background: accent, padding: "4px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 20, lineHeight: 1.4 }}>Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY} from {FOUNDING_DATE}.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/checkout?product=nutrition" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "18px 40px" }}>
                Get Instant Access
              </Link>
              <Link href="/nutrition" style={{ display: "inline-block", color: "rgba(245,242,238,0.45)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
                Full course details →
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              { num: "01", title: "Understanding Your Body", desc: "BMR, TDEE, and your personalized calorie target" },
              { num: "02", title: "Your Nutrition Blueprint", desc: "Protein, carbs, fats, hydration, and plate building" },
              { num: "03", title: "4-Week Meal Plan", desc: "Recipes, portions, and grocery lists — scaled to you" },
              { num: "04", title: "Making It Stick", desc: "Eating out, troubleshooting, supplements, and recovery" },
            ].map((mod) => (
              <div key={mod.num} style={{ background: "#161616", padding: "32px 28px", position: "relative", borderTop: `2px solid rgba(201,169,110,0.4)` }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(201,169,110,0.5)", marginBottom: 12 }}>{mod.num}</p>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 16, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.3, marginBottom: 8 }}>{mod.title}</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "rgba(245,242,238,0.35)", lineHeight: 1.5 }}>{mod.desc}</p>
              </div>
            ))}
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
          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0a0a0a", background: accent, padding: "6px 16px", marginBottom: 20, fontFamily: "var(--font-dm-sans), sans-serif" }}>Founding Member Price</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 20, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 28 }}>Regular {COURSE_REGULAR_PRICE_DISPLAY} from {FOUNDING_DATE}</p>
          <Link href="/checkout" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 72px" }}>
            Get Instant Access
          </Link>
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            One-time payment · <strong style={{ color: "rgba(245,242,238,0.55)", fontWeight: 500 }}>Lifetime access</strong> · Built-in workout &amp; progress tracking
          </p>
          <div style={{ marginTop: 40, paddingTop: 40, borderTop: "1px solid rgba(245,242,238,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Also available</p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="/nutrition" style={{ color: accent, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                Nutrition Foundations
              </Link>
              <span style={{ fontSize: 13, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_PRICE_DISPLAY} · 4-week nutrition course</span>
              <Link href="/checkout?product=nutrition" style={{ display: "inline-block", border: `1px solid ${accent}`, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "10px 20px" }}>
                Buy Now
              </Link>
            </div>
            <div style={{ background: "#1a1208", padding: "20px 28px", width: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, borderTop: `1px solid rgba(200,169,126,0.2)` }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 4, fontFamily: "var(--font-dm-sans), sans-serif" }}>Foundations Bundle — Best Value</p>
                <p style={{ fontSize: 12, color: "rgba(245,242,238,0.4)", fontFamily: "var(--font-dm-sans), sans-serif" }}>Both courses · {BUNDLE_INDIVIDUAL_TOTAL_DISPLAY} individual · Save {BUNDLE_SAVINGS_DISPLAY}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif" }}>{BUNDLE_PRICE_DISPLAY}</span>
                <Link href="/checkout?product=bundle" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "12px 24px", whiteSpace: "nowrap" }}>Get Both Courses</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOT READY TO COMMIT */}
      <FreeGuideTeaser />

    </main>
    </>
  )
}
