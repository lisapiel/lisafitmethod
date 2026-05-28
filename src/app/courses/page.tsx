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
  TRACKER_PRICE_DISPLAY,
} from "@/lib/pricing"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Courses | Lisa Fit Method",
  description:
    "Training Foundations and Nutrition Foundations — two structured courses built to give you the movement, strength, and eating habits that actually last. One-time payment, ongoing access.",
  openGraph: {
    title: "Courses | Lisa Fit Method",
    description: "Two structured courses. Training Foundations and Nutrition Foundations. One-time payment, yours to keep.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

const TRAINING_MODULES = [
  { num: "01", tag: "Module 1", title: "Foundation Movements", items: ["Hip hinge: protect your back under load", "Squat pattern: hips, knees, and core working together", "Push pattern: press safely without destroying your shoulders", "Pull pattern: build posture, stability, and upper body strength", "Brace & carry: how your core actually works"] },
  { num: "02", tag: "Module 2", title: "Core & Glute Priority", items: ["Core stability fundamentals", "Glute strength and lower body stability", "Load the posterior chain safely", "Build a stronger core that supports heavier lifting"] },
  { num: "03", tag: "Module 3", title: "The Training Program", items: ["3 structured training days per week", "Built-in warm-ups and cool-downs", "Progressive overload system included", "Step-by-step exercise guidance", "Workout and progress tracking built in", "Designed to be repeated and progressed"] },
  { num: "04", tag: "Module 4", title: "Nutrition Foundations", items: ["Protein first", "Fuel your training properly", "Consistency over perfection", "Hydration affects everything", "Stop overcomplicating nutrition"] },
]

const NUTRITION_MODULES = [
  { num: "01", title: "Understanding Your Body", desc: "BMR, TDEE, and your personalised calorie target" },
  { num: "02", title: "Your Nutrition Blueprint", desc: "Protein, carbs, fats, hydration, and plate building" },
  { num: "03", title: "4-Week Meal Plan", desc: "Real recipes and grocery lists, scaled to your target" },
  { num: "04", title: "Making It Stick", desc: "Eating out, troubleshooting, supplements, and recovery" },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Training Foundations",
    description: "A complete strength training foundation. Learn the five foundational movement patterns, follow a structured program, and build a base that supports your training for life.",
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
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "How long does each session take?", acceptedAnswer: { "@type": "Answer", text: "Between 45 and 60 minutes including warm-up and cool-down." } },
      { "@type": "Question", name: "Do I need a gym membership?", acceptedAnswer: { "@type": "Answer", text: "You need access to basic equipment: dumbbells, a resistance band, and a flat bench or equivalent." } },
      { "@type": "Question", name: "Is this for complete beginners?", acceptedAnswer: { "@type": "Answer", text: "Yes. It's designed for people who are new to structured training or feel like they've been winging it, regardless of experience level." } },
      { "@type": "Question", name: "Can I do more than 4 weeks?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. The program is designed to be run in multiple rounds. Each round you add weight and progress further. Four weeks is the foundation; most people who see real results run it 2 or 3 times." } },
      { "@type": "Question", name: "Is this a one-time payment?", acceptedAnswer: { "@type": "Answer", text: "Yes. One-time payment. No subscription." } },
      { "@type": "Question", name: "Can men do this program?", acceptedAnswer: { "@type": "Answer", text: "Yes. The movements and principles apply to everyone." } },
    ],
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "Courses", item: "https://lisafitmethod.com/courses" },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
    <main style={{ background: "#0a0a0a", color: "#f5f2ee", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root {
          --accent: ${accent};
          --heading-scale: ${hs};
          --body-scale: ${bs};
        }
        .courses-divider-dark { width: 40px; height: 1px; background: rgba(200,169,126,0.4); margin-bottom: 32px; }
        .courses-divider-light { width: 40px; height: 1px; background: rgba(168,137,94,0.35); margin-bottom: 32px; }

        /* Video */
        .courses-video-band { width: 100%; height: 62vh; min-height: 320px; overflow: hidden; background: #111; }
        @media (max-width: 768px) { .courses-video-band { height: 56vw; min-height: 220px; } }

        /* Intro (LIGHT) */
        .courses-intro { padding: 100px 80px 80px; max-width: 860px; margin: 0 auto; text-align: center; }
        @media (max-width: 768px) { .courses-intro { padding: 72px 28px 60px; } }

        /* Course section (DARK) */
        .course-section { padding: 100px 80px; border-top: 1px solid rgba(255,255,255,0.06); }
        .course-section-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 340px; gap: 80px; align-items: start; }
        .course-cta-col { position: sticky; top: 96px; }
        @media (max-width: 900px) {
          .course-section { padding: 72px 28px; }
          .course-section-inner { grid-template-columns: 1fr; gap: 48px; }
          .course-cta-col { position: static; }
        }

        /* Price display (dark sections) */
        .price-block { margin-bottom: 28px; }
        .price-main { font-size: 52px; font-weight: 700; color: ${accent}; line-height: 1; font-family: var(--font-dm-sans), sans-serif; }
        .price-was { font-size: 13px; color: rgba(245,242,238,0.3); text-decoration: line-through; font-family: var(--font-dm-sans), sans-serif; display: inline; margin-left: 4px; }
        .price-note { font-size: 11px; color: rgba(245,242,238,0.35); font-family: var(--font-dm-sans), sans-serif; margin-top: 8px; line-height: 1.6; letter-spacing: 0.04em; }

        /* CTA buttons */
        .cta-primary { display: block; background: ${accent}; color: #0a0a0a; font-family: var(--font-dm-sans), sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; padding: 18px 28px; text-align: center; }
        .cta-ghost-dark { display: inline-block; color: rgba(245,242,238,0.4); font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 8px 0; }
        .cta-ghost-dark:hover { color: ${accent}; }
        .cta-ghost-light { display: inline-block; color: rgba(26,26,26,0.4); font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 8px 0; }
        .cta-ghost-light:hover { color: ${accent}; }

        /* Modules grid (dark) */
        .modules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.04); margin-top: 48px; }
        .module-card { background: #0a0a0a; padding: 36px 32px; }
        @media (max-width: 600px) { .modules-grid { grid-template-columns: 1fr; } .module-card { padding: 28px 0; background: transparent; border-bottom: 1px solid rgba(255,255,255,0.06); } }

        /* Bundle (LIGHT) */
        .bundle-section { padding: 100px 80px; border-top: 1px solid rgba(0,0,0,0.07); }
        .bundle-inner { max-width: 800px; margin: 0 auto; }
        @media (max-width: 768px) { .bundle-section { padding: 72px 28px; } }

        /* Tracker (DARK) */
        .tracker-section { padding: 80px 80px; border-top: 1px solid rgba(255,255,255,0.06); }
        .tracker-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; }
        @media (max-width: 768px) { .tracker-section { padding: 60px 28px; } .tracker-inner { grid-template-columns: 1fr; gap: 28px; } }

        /* FAQ (DARK) */
        .faq-section { padding: 100px 80px; border-top: 1px solid rgba(255,255,255,0.06); background: #0d0d0d; }
        .faq-inner { max-width: 700px; margin: 0 auto; }
        @media (max-width: 768px) { .faq-section { padding: 72px 28px; } }

        /* Testimonials (LIGHT) */
        .testimonials-section { padding: 100px 40px; border-top: 1px solid rgba(0,0,0,0.07); text-align: center; }
        @media (max-width: 768px) { .testimonials-section { padding: 72px 24px; } }

        /* Is This For Me (LIGHT) */
        .for-section { padding: 100px 80px; border-top: 1px solid rgba(0,0,0,0.07); background: #f5f2ee; }
        @media (max-width: 768px) { .for-section { padding: 72px 28px; } }

        /* Final CTA (DARK) */
        .final-cta { padding: 120px 80px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; position: relative; overflow: hidden; }
        @media (max-width: 768px) { .final-cta { padding: 80px 28px; } }
      `}</style>

      {/* VIDEO — dark */}
      {trailerUrl && (
        <section style={{ background: "#000" }}>
          <div className="courses-video-band">
            <VideoPlayer src={trailerUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </section>
      )}

      {/* INTRO — LIGHT */}
      <section style={{ background: "#faf8f5" }}>
        <div className="courses-intro">
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: 24 }}>Courses</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 4vw, 54px) * ${hs})`, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.1, marginBottom: 24 }}>
            Two courses.<br /><em style={{ fontStyle: "italic", color: accent }}>One complete foundation.</em>
          </h1>
          <p style={{ fontSize: `calc(15px * ${bs})`, color: "rgba(26,26,26,0.5)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 48px" }}>
            Structured fitness and nutrition systems built for real life. Learn how to move well, train consistently, and eat in a way that supports your goals without obsessing over every detail.
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Training Foundations", href: "#training" },
              { label: "Nutrition Foundations", href: "#nutrition" },
              { label: "Bundle", href: "#bundle" },
            ].map(({ label, href }) => (
              <a key={href} href={href} style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(26,26,26,0.45)", textDecoration: "none", borderBottom: `1px solid rgba(168,137,94,0.35)`, paddingBottom: 2, fontFamily: "var(--font-dm-sans), sans-serif" }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING FOUNDATIONS — DARK */}
      <section id="training" className="course-section" style={{ background: "#0a0a0a" }}>
        <div className="course-section-inner">
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>Training Foundations</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(36px, 4vw, 52px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 24 }}>
              {t.coursesHeroHeadline}
            </h2>
            <p style={{ fontSize: `calc(15px * ${bs})`, color: "rgba(245,242,238,0.5)", lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
              {t.coursesHeroSubtext}
            </p>

            <div className="courses-divider-dark" />

            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(245,242,238,0.3)", marginBottom: 32 }}>What&apos;s inside</p>

            <div className="modules-grid">
              {TRAINING_MODULES.map((mod) => (
                <div key={mod.num} className="module-card">
                  <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 10, fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500 }}>{mod.tag}</p>
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(17px * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 16, lineHeight: 1.3 }}>{mod.title}</p>
                  <ul style={{ listStyle: "none" }}>
                    {mod.items.map((item) => (
                      <li key={item} style={{ fontSize: `calc(12px * ${bs})`, color: "rgba(245,242,238,0.35)", padding: "4px 0 4px 14px", position: "relative", lineHeight: 1.5 }}>
                        <span style={{ position: "absolute", left: 0, color: accent, fontSize: 10 }}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="course-cta-col">
            <div style={{ background: "#111", padding: "36px 32px", borderTop: `2px solid ${accent}` }}>
              <div className="price-block">
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span className="price-main">${t.coursePrice}</span>
                  <span className="price-was">{COURSE_REGULAR_PRICE_DISPLAY}</span>
                </div>
                <p className="price-note">One-time payment · Founding member price<br />Built-in workout and progress tracking</p>
              </div>
              <Link href="/checkout" className="cta-primary">Get Instant Access</Link>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  "50+ exercise videos with coaching cues",
                  "4-week structured program",
                  "Progressive overload system",
                  "Workout tracking built in",
                  "Designed to repeat and keep progressing",
                ].map((point) => (
                  <div key={point} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, color: "rgba(245,242,238,0.4)", lineHeight: 1.4, fontFamily: "var(--font-dm-sans), sans-serif" }}>
                    <span style={{ color: accent, flexShrink: 0, fontSize: 11, marginTop: 1 }}>✓</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — LIGHT */}
      {testimonialsUrl && (
        <section className="testimonials-section" style={{ background: "#f5f2ee" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(168,137,94,0.9)", marginBottom: 16 }}>Real results</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(26px, 2.5vw, 36px) * ${hs})`, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, marginBottom: 48 }}>
            What people <em style={{ fontStyle: "italic", color: accent }}>are saying.</em>
          </h2>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Image src={testimonialsUrl} alt="Testimonials from Lisa Fit Method students" width={1800} height={1200} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </section>
      )}

      {/* NUTRITION FOUNDATIONS — DARK */}
      <section id="nutrition" className="course-section" style={{ background: "#0a0a0a" }}>
        <div className="course-section-inner">
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>Nutrition Foundations</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(36px, 4vw, 52px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 24 }}>
              Eat to match<br /><em style={{ fontStyle: "italic", color: accent }}>your training.</em>
            </h2>
            <p style={{ fontSize: `calc(15px * ${bs})`, color: "rgba(245,242,238,0.5)", lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
              A 4-week nutrition course with a personalised TDEE calculator, a structured meal plan built around your calorie target, science-backed education, and real recipes from verified sources.
            </p>

            <div className="courses-divider-dark" />

            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(245,242,238,0.3)", marginBottom: 32 }}>What&apos;s inside</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.04)" }}>
              {NUTRITION_MODULES.map((mod) => (
                <div key={mod.num} style={{ background: "#0a0a0a", padding: "32px 28px" }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(200,169,126,0.5)", marginBottom: 10 }}>{mod.num}</p>
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(16px * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 8, lineHeight: 1.3 }}>{mod.title}</p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: `calc(12px * ${bs})`, color: "rgba(245,242,238,0.35)", lineHeight: 1.5 }}>{mod.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40 }}>
              {[
                "Interactive TDEE calculator, personalised to your stats and goal",
                "4-week meal plan with real, attributed recipes",
                "Macro education, eating-out guide, and supplement evidence",
                "Written by a CPT with full research citations throughout",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.5 }}>
                  <span style={{ color: accent, flexShrink: 0, fontSize: 11, marginTop: 2 }}>→</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="course-cta-col">
            <div style={{ background: "#111", padding: "36px 32px", borderTop: `2px solid ${accent}` }}>
              <div className="price-block">
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span className="price-main">{NUTRITION_COURSE_PRICE_DISPLAY}</span>
                  <span className="price-was">{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
                </div>
                <p className="price-note">One-time payment · Founding member price<br />Ongoing access, no subscription</p>
              </div>
              <Link href="/checkout?product=nutrition" className="cta-primary">Get Instant Access</Link>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Link href="/nutrition" className="cta-ghost-dark">Full course details →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUNDLE — LIGHT */}
      <section id="bundle" className="bundle-section" style={{ background: "#faf8f5" }}>
        <div className="bundle-inner">
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>Complete Foundations System</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(30px, 3.5vw, 44px) * ${hs})`, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.1, marginBottom: 20 }}>
            Get both courses together.
          </h2>
          <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(26,26,26,0.5)", lineHeight: 1.7, marginBottom: 48, maxWidth: 560 }}>
            Training and nutrition are two sides of the same system. When you have both, you know how to train and how to eat to support it. Most people who take one eventually come back for the other.
          </p>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.09)", paddingTop: 40, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {["Training Foundations", "Nutrition Foundations"].map((name) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: accent, fontSize: 11 }}>✓</span>
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "rgba(26,26,26,0.65)" }}>{name}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{BUNDLE_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 13, color: "rgba(26,26,26,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", textDecoration: "line-through" }}>{BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}</span>
                <span style={{ fontSize: 11, color: "rgba(168,137,94,0.8)", fontFamily: "var(--font-dm-sans), sans-serif", letterSpacing: "0.05em" }}>save {BUNDLE_SAVINGS_DISPLAY}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 200 }}>
              <Link href="/checkout?product=bundle" className="cta-primary">Get Both Courses</Link>
              <p style={{ fontSize: 11, color: "rgba(26,26,26,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.5, textAlign: "center" }}>One-time payment · No subscription</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKER ADD-ON — DARK */}
      <section className="tracker-section" style={{ background: "#0a0a0a" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(200,169,126,0.5)", marginBottom: 16 }}>Optional add-on</p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 16, justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(24px, 2.5vw, 34px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.2, margin: 0 }}>
                Progress Tracker
              </h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "rgba(200,169,126,0.7)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{TRACKER_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 11, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif" }}>once · no subscription</span>
              </div>
            </div>
          </div>
          <div className="tracker-inner">
            {[
              { title: "Log any workout", body: "Build completely custom workout days with any exercises you want. Not just this program — use it for everything you train." },
              { title: "Beat last week", body: "Your previous numbers sit right next to where you log. You always know exactly what to beat. Progressive overload made automatic." },
              { title: "Installs like an app", body: "Add it to your phone home screen from your browser. Opens full-screen, no browser bar. One tap and you&apos;re in the gym." },
            ].map(({ title, body }) => (
              <div key={title}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(16px * ${hs})`, fontWeight: 700, color: "rgba(245,242,238,0.7)", marginBottom: 10 }}>{title}</p>
                <p style={{ fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.3)", lineHeight: 1.6 }}
                   dangerouslySetInnerHTML={{ __html: body }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <Link href="/checkout" style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.3)", color: "rgba(245,242,238,0.5)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "12px 24px" }}>Add at Checkout</Link>
            <Link href="/tracker-checkout" style={{ color: "rgba(200,169,126,0.5)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>Tracker only →</Link>
          </div>
        </div>
      </section>

      {/* IS THIS FOR ME? — LIGHT */}
      <section className="for-section">
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(168,137,94,0.85)", marginBottom: 20 }}>Is this for me?</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 40px) * ${hs})`, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1, marginBottom: 40 }}>
            You&apos;re in the right place <em style={{ fontStyle: "italic", color: accent }}>if you&apos;re serious.</em>
          </h2>
          <div>
            {[
              "You want structure instead of random workouts that lead nowhere",
              "You want to understand why you're doing each movement, not just what",
              "You've dealt with nagging pain, instability, or recurring injuries",
              "You want a program you can keep progressing, not just finish once",
              "You're ready to train consistently and actually build strength",
              "You want nutrition guidance that isn't obsessive or exhausting",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 0", borderBottom: "1px solid rgba(0,0,0,0.07)", fontSize: `calc(14px * ${bs})`, color: "rgba(26,26,26,0.6)", lineHeight: 1.5 }}>
                <span style={{ color: accent, flexShrink: 0, marginTop: 2, fontSize: 12 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — DARK */}
      <section className="faq-section">
        <div className="faq-inner">
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(200,169,126,0.5)", marginBottom: 20 }}>Common questions</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(26px, 2.8vw, 36px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.2, marginBottom: 48 }}>
            What you should know.
          </h2>
          <div>
            {[
              { q: "How long is each training session?", a: "Between 45 and 60 minutes including warm-up and cool-down. Some days run a little shorter." },
              { q: "Do I need a gym?", a: "You need access to basic equipment: dumbbells, a resistance band, and a flat bench or equivalent. A commercial gym works, but a well-equipped home gym is fine too." },
              { q: "Is this for complete beginners?", a: "Yes. It's built for people new to structured training or who've been winging it for years. You don't need prior experience with any of the movements — everything is taught from the ground up." },
              { q: "Can I run it more than once?", a: "That's the point. The program is designed to be repeated. Each round you add weight and progress further. Most people who see real results run it 2 or 3 times." },
              { q: "Is it a subscription?", a: "No. One-time payment for each course. You pay once and keep ongoing access." },
              { q: "Can men use this program?", a: "Yes. The movements and principles apply to everyone. There are no gender-specific requirements." },
            ].map(({ q, a }) => (
              <div key={q} style={{ padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: `calc(13px * ${bs})`, fontWeight: 600, color: "rgba(245,242,238,0.7)", marginBottom: 10, letterSpacing: "0.03em" }}>{q}</p>
                <p style={{ fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.35)", lineHeight: 1.7 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — DARK */}
      <section className="final-cta" style={{ background: "#0a0a0a" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(200,169,126,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>Ready to start?</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(34px, 4vw, 56px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 16 }}>
            {t.coursesFinalHeadline.replace(/\\n/g, "\n").split("\n").map((line: string, i: number, arr: string[]) => (
              <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
            ))}
          </h2>
          <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.35)", lineHeight: 1.7, marginBottom: 48 }}>
            One-time payment. Ongoing access. No subscription ever.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
              <span style={{ fontSize: 14, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", textDecoration: "line-through" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
            </div>
            <Link href="/checkout" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", padding: "20px 60px" }}>
              Get Instant Access
            </Link>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.2)", fontFamily: "var(--font-dm-sans), sans-serif", marginTop: 4 }}>Training Foundations · Founding member price</p>
          </div>
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
            <Link href="/checkout?product=nutrition" style={{ color: "rgba(200,169,126,0.6)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, textDecoration: "none", letterSpacing: "0.05em" }}>
              Nutrition Foundations · {NUTRITION_COURSE_PRICE_DISPLAY} →
            </Link>
            <Link href="/checkout?product=bundle" style={{ color: "rgba(200,169,126,0.6)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, textDecoration: "none", letterSpacing: "0.05em" }}>
              Both Courses · {BUNDLE_PRICE_DISPLAY} →
            </Link>
          </div>
        </div>
      </section>

      <FreeGuideTeaser />

    </main>
    </>
  )
}
