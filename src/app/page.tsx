import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl, getPublishedVideoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import VideoPlayer from "@/components/VideoPlayer.client"
import { FreeGuideSignupForm } from "@/components/FreeGuideSignupForm"
import { TestimonialsSection, COURSE_TESTIMONIALS, COACHING_TESTIMONIALS } from "@/components/TestimonialsSection"
import {
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
} from "@/lib/pricing"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Lisa Fit Method — Train the Right Way",
  description:
    "A 4-week training system for beginners and returners. Learn proper form, follow a structured program, track your progress, and finally understand what actually changes your body.",
  openGraph: {
    title: "Lisa Fit Method — Train the Right Way",
    description: "A 4-week training system for beginners and returners. Proper movement, real structure, and a body built to last.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

export default async function HomePage() {
  const [heroUrl, bannerUrl, trailerUrl, settings] = await Promise.all([
    getPublishedPhotoUrl("hero"),
    getPublishedPhotoUrl("banner"),
    getPublishedVideoUrl("lp_trailer"),
    fetchSiteSettings(),
  ])

  const t = settings.text
  const accent = settings.colors.accent
  const hs = settings.typography.headingScale
  const bs = settings.typography.bodyScale

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Lisa Fit Method",
      url: "https://lisafitmethod.com",
      description: "A 4-week training system for beginners and returners. Learn proper form, follow a structured program, track your progress, and build a body that lasts.",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://lisafitmethod.com/blog?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Lisa Fit Method",
      url: "https://lisafitmethod.com",
      logo: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png" },
      image: "https://lisafitmethod.com/hero.png",
      description: "Online personal training and strength programming — built around proper movement, real structure, and a foundation that lasts.",
      founder: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
      sameAs: ["https://instagram.com/lisafitmethod"],
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Lisa McPherson",
      jobTitle: "Certified Personal Trainer",
      url: "https://lisafitmethod.com/about",
      image: "https://lisafitmethod.com/hero.png",
      description: "Certified personal trainer and founder of Lisa Fit Method. Rebuilt training from scratch after a serious back injury — now helps people build strength the right way.",
      sameAs: ["https://instagram.com/lisafitmethod"],
      worksFor: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      knowsAbout: ["Strength Training", "Beginner Weightlifting", "Movement Correction", "Corrective Exercise", "Progressive Overload", "Core Stability"],
      hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Certification", name: "Certified Personal Trainer (CPT)" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Training Foundations",
      description: "A 4-week training system for beginners and returners. Three days a week. Built around the five foundational movement patterns, structured programming, and built-in workout tracking.",
      image: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png", width: 1200, height: 800 },
      provider: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      instructor: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
      url: "https://lisafitmethod.com/courses",
      courseMode: "online",
      educationalLevel: "Beginner",
      timeRequired: "P4W",
      inLanguage: "en",
      offers: {
        "@type": "Offer",
        price: Number(t.coursePrice),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://lisafitmethod.com/checkout",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        instructor: { "@type": "Person", name: "Lisa McPherson" },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        ratingCount: String(COURSE_TESTIMONIALS.length),
        bestRating: "5",
        worstRating: "1",
      },
      review: COURSE_TESTIMONIALS.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        reviewRating: { "@type": "Rating", ratingValue: String(r.stars), bestRating: "5" },
        reviewBody: r.quote,
        datePublished: r.dateIso,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "1:1 Personal Training Coaching",
      description: "Personalized online coaching with Lisa McPherson — custom programming, form review, and weekly check-ins tailored to your goals and schedule.",
      provider: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      url: "https://lisafitmethod.com/coaching",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        ratingCount: String(COACHING_TESTIMONIALS.length),
        bestRating: "5",
        worstRating: "1",
      },
      review: COACHING_TESTIMONIALS.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        reviewRating: { "@type": "Rating", ratingValue: String(r.stars), bestRating: "5" },
        reviewBody: r.quote,
        datePublished: r.dateIso,
      })),
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <main
      style={{
        background: "var(--warm-white, #faf8f5)",
        color: "var(--text, #1a1a1a)",
        fontFamily: "var(--font-dm-sans), sans-serif",
        fontWeight: 300,
        overflowX: "hidden",
      }}
    >
      <style>{`
        :root {
          --black: #0a0a0a;
          --off-white: #f5f2ee;
          --warm-white: #faf8f5;
          --accent: ${accent};
          --accent-dark: #a8895e;
          --text: #1a1a1a;
          --muted: #6b6560;
          --heading-scale: ${hs};
          --body-scale: ${bs};
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeUp 0.8s ease forwards 0.2s; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.8s ease forwards 0.4s; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.8s ease forwards 0.6s; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.8s ease forwards 0.8s; opacity: 0; }
      `}</style>

      {/* HERO — video first, directly under nav */}
      <section style={{ background: "#0a0a0a" }} className="home-hero">
        <style>{`
          .home-video-band {
            width: 100%;
            height: 62vh;
            min-height: 340px;
            overflow: hidden;
            background: #111;
          }
          .home-hero-text {
            max-width: 1100px;
            margin: 0 auto;
            padding: 56px 80px 80px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 60px;
            align-items: start;
          }
          .home-hero-cta-col { min-width: 240px; }
          .home-hero-fallback {
            padding: 100px 80px 80px;
            max-width: 1100px;
            margin: 0 auto;
          }
          @media (max-width: 768px) {
            .home-video-band { height: 56vw; min-height: 240px; }
            .home-hero-text { grid-template-columns: 1fr; gap: 32px; padding: 40px 24px 56px; }
            .home-hero-fallback { padding: 64px 24px 56px; }
          }
        `}</style>

        {trailerUrl && (
          <div className="home-video-band">
            <VideoPlayer src={trailerUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}

        {trailerUrl ? (
          <div className="home-hero-text">
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>
                Lisa Fit Method — Training Foundations
              </p>
              <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 4.5vw, 64px) * ${hs})`, fontWeight: 900, color: "var(--off-white)", lineHeight: 1.05, marginBottom: 20 }}>
                {t.homeHeroHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
                ))}
              </h1>
              <p style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.65)", lineHeight: 1.4, maxWidth: 440 }}>
                {t.homeHeroSubtext}
              </p>
            </div>
            <div className="home-hero-cta-col">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, color: "rgba(245,242,238,0.35)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 44, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
                <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0a0a0a", background: "var(--accent)", padding: "4px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}>Founding Price</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/checkout" style={{ display: "block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "18px 32px", textAlign: "center" }}>
                  Get Instant Access
                </Link>
                <Link href="/coaching" style={{ display: "block", border: "1px solid rgba(200,169,126,0.45)", color: "rgba(245,242,238,0.7)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "16px 20px", textAlign: "center" }}>
                  Book 1:1 Coaching
                </Link>
              </div>
              <p style={{ marginTop: 14, fontSize: 11, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6 }}>
                One-time payment. <strong style={{ color: "rgba(245,242,238,0.6)", fontWeight: 500 }}>Lifetime access.</strong> Reuse it, track it, and keep progressing.
              </p>
            </div>
          </div>
        ) : (
          <div className="home-hero-fallback">
            <p className="fade-up-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>
              Lisa Fit Method — Training Foundations
            </p>
            <h1 className="fade-up-2" style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 4.5vw, 64px) * ${hs})`, fontWeight: 900, color: "var(--off-white)", lineHeight: 1.05, marginBottom: 24 }}>
              {t.homeHeroHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
              ))}
            </h1>
            <p className="fade-up-3" style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.65)", lineHeight: 1.4, maxWidth: 440, marginBottom: 32 }}>
              {t.homeHeroSubtext}
            </p>
            <div className="fade-up-4" style={{ alignSelf: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, color: "rgba(245,242,238,0.35)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
                <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0a0a0a", background: "var(--accent)", padding: "4px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}>Founding Price</span>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/checkout" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "18px 42px" }}>
                  Get Instant Access
                </Link>
                <Link href="/coaching" style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.45)", color: "rgba(245,242,238,0.7)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "18px 28px" }}>
                  Book 1:1 Coaching
                </Link>
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
                One-time payment. <strong style={{ color: "rgba(245,242,238,0.6)", fontWeight: 500 }}>Lifetime access.</strong> More programs coming soon.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* HERO PHOTO */}
      {heroUrl && (
        <section style={{ background: "#0a0a0a" }} className="home-hero-photo">
          <style>{`
            .home-hero-photo-wrap { position: relative; width: 100%; height: 70vh; overflow: hidden; }
            @media (max-width: 768px) { .home-hero-photo-wrap { height: 80vw; } }
          `}</style>
          <div className="home-hero-photo-wrap">
            <Image
              src={heroUrl}
              alt="Lisa McPherson — Lisa Fit Method"
              fill
              style={{ objectFit: "cover", objectPosition: settings.crops.hero }}
              sizes="100vw"
            />
          </div>
        </section>
      )}

      {/* STORY */}
      <section style={{ background: "var(--off-white)", padding: "80px 80px" }} className="story-section">
        <style>{`
          @media (max-width: 768px) {
            .story-section { padding: 72px 28px !important; }
            .story-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          }
        `}</style>
        <div className="story-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 24 }}>Why this exists</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(36px, 3.5vw, 52px) * ${hs})`, fontWeight: 700, lineHeight: 1.15, color: "var(--black)", marginBottom: 32 }}>
              {t.homeStoryHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
              ))}
            </h2>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.4, color: "var(--muted)", marginBottom: 20 }}>
              {t.homeStoryPara1}
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.4, color: "var(--muted)", marginBottom: 20 }}>
              {t.homeStoryPara2}
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.4, color: "var(--muted)" }}>
              {t.homeStoryPara3}
            </p>
            <Link href="/about" style={{ display: "inline-block", marginTop: 28, fontSize: 12, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-dark)", textDecoration: "none" }}>
              My full story →
            </Link>
          </div>
          <div>
            <div style={{ background: "var(--black)", color: "var(--off-white)", padding: "48px 40px", position: "relative" }}>
              <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: 120, color: "var(--accent)", opacity: 0.3, position: "absolute", top: -20, left: 28, lineHeight: 1, userSelect: "none" }}>&ldquo;</span>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(22px * ${hs})`, fontStyle: "italic", lineHeight: 1.6, color: "var(--off-white)", position: "relative", zIndex: 1 }}>
                {t.homeStoryQuote}
              </p>
              <cite style={{ display: "block", marginTop: 24, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontStyle: "normal", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)" }}>
                — Lisa McPherson, CPT
              </cite>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER — between story and course preview */}
      {bannerUrl && (
        <section style={{ background: "#0a0a0a", width: "100%" }}>
          <Image
            src={bannerUrl}
            alt="Lisa Fit Method"
            width={2400}
            height={800}
            style={{ width: "100%", height: "auto", display: "block" }}
            sizes="100vw"
          />
        </section>
      )}

      {/* SHORT COURSE PREVIEW */}
      <section style={{ background: "var(--black)", padding: "100px 80px" }} className="preview-section">
        <style>{`
          @media (max-width: 768px) {
            .preview-section { padding: 72px 28px !important; }
            .preview-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          }
        `}</style>
        <div className="preview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>Training Foundations</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3.5vw, 48px) * ${hs})`, fontWeight: 700, color: "var(--off-white)", lineHeight: 1.15, marginBottom: 28 }}>
              Four modules.<br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>One solid foundation.</em>
            </h2>
            <ul style={{ listStyle: "none", marginBottom: 36 }}>
              {[
                "Foundation Movements: Learn the movement patterns every strong body is built on",
                "Core & Glute Priority: Build spinal stability, stronger glutes, better posture, and a body that moves properly under load",
                "The 4-Week Program: Fully structured workouts with sets, reps, warm-ups, mobility work, progressive overload guidance, and built-in workout tracking so you can clearly see your progress over time. Most exercises can be done with dumbbells, resistance bands, and minimal equipment if you're starting from home, while still transitioning naturally into a gym environment over time.",
                "Nutrition Foundations: Simple nutrition principles for building muscle, supporting recovery, and staying lean without obsessing over food",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(245,242,238,0.06)", fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.6)", lineHeight: 1.4 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 16, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 44, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
              <span style={{ fontSize: 10, color: "#0a0a0a", background: "var(--accent)", padding: "4px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <Link href="/checkout" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 36px" }}>
                Get Instant Access
              </Link>
              <Link href="/courses" style={{ display: "inline-block", color: "rgba(245,242,238,0.5)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", padding: "16px 0" }}>
                Explore the Course →
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.4 }}>
              Includes 50+ exercise videos, built-in workout and progress tracking, full warm-ups and cool-downs, progression guidance, and lifetime access so you can keep using the program beyond the first four weeks.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {["Foundation\nMovements", "Core &\nGlute Priority", "The 4-Week\nProgram", "Nutrition\nFoundations"].map((label, i) => (
              <div key={label} style={{ background: "#141414", padding: "36px 32px", borderTop: "2px solid rgba(200,169,126,0.4)" }}>
                <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(200,169,126,0.5)", marginBottom: 14, fontFamily: "var(--font-dm-sans), sans-serif" }}>0{i + 1}</p>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 17, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.3, whiteSpace: "pre-line" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NUTRITION FOUNDATIONS TEASER */}
      <section style={{ background: "#111111", padding: "100px 80px" }} className="nutrition-teaser">
        <style>{`
          @media (max-width: 768px) { .nutrition-teaser { padding: 72px 28px !important; } .nutrition-teaser-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        `}</style>
        <div className="nutrition-teaser-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              { label: "TDEE Calculator", sub: "Personalized to your stats" },
              { label: "4-Week Meal Plan", sub: "Scales to your calorie target" },
              { label: "Macro Education", sub: "With research citations" },
              { label: "Eating Out Guide", sub: "Real-world strategies" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#161616", padding: "28px 24px", borderTop: "2px solid rgba(201,169,110,0.35)" }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, fontWeight: 600, color: "#f5f2ee", lineHeight: 1.3, marginBottom: 6 }}>{item.label}</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, color: "rgba(245,242,238,0.35)", lineHeight: 1.4 }}>{item.sub}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>New Course</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(30px, 3.5vw, 46px) * ${hs})`, fontWeight: 700, color: "var(--off-white)", lineHeight: 1.15, marginBottom: 20 }}>
              Nutrition Foundations.<br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Eat to match your training.</em>
            </h2>
            <p style={{ fontSize: `calc(15px * ${bs})`, color: "rgba(245,242,238,0.5)", lineHeight: 1.6, marginBottom: 28 }}>
              A 4-week nutrition course for people who train. Learn how to calculate your real calorie needs, build a meal plan that adapts to your goals, and develop habits that hold up outside the gym — without obsessing over food.
            </p>
            <ul style={{ listStyle: "none", marginBottom: 36 }}>
              {[
                "Interactive calorie and macro calculator",
                "4-week meal plan with verified, attributed recipes",
                "Science-backed education — no bro-science",
                "Eating out, supplements, and troubleshooting guides",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(245,242,238,0.05)", fontSize: `calc(13px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, color: "rgba(245,242,238,0.25)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 44, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 10, color: "#0a0a0a", background: "var(--accent)", padding: "4px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 20, lineHeight: 1.4 }}>Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}. Limited time.</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/nutrition" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 36px" }}>
                Explore the Course
              </Link>
              <Link href="/checkout?product=nutrition" style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.4)", color: "rgba(245,242,238,0.55)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", padding: "16px 24px" }}>
                Get Instant Access — {NUTRITION_COURSE_PRICE_DISPLAY}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDATIONS BUNDLE */}
      <section style={{ background: "#0d0b08", padding: "80px 80px", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }} className="bundle-section">
        <style>{`
          @media (max-width: 768px) { .bundle-section { padding: 64px 24px !important; } .bundle-inner { flex-direction: column !important; align-items: flex-start !important; gap: 28px !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif" }}>Foundations Bundle</p>
            <span style={{ fontSize: 9, color: "#0a0a0a", background: "var(--accent)", padding: "3px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Best Value</span>
          </div>
          <div className="bundle-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 40px) * ${hs})`, fontWeight: 700, color: "var(--off-white)", lineHeight: 1.15, marginBottom: 16 }}>
                Train right.<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>Eat to match.</em>
              </h2>
              <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.65, maxWidth: 500, marginBottom: 24 }}>
                Both courses together. Training Foundations gives you the movement system. Nutrition Foundations gives you the eating strategy. {BUNDLE_INDIVIDUAL_TOTAL_DISPLAY} if bought separately — get both for {BUNDLE_PRICE_DISPLAY} and save {BUNDLE_SAVINGS_DISPLAY}.
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ padding: "14px 20px", background: "#161616", borderLeft: "2px solid rgba(200,169,126,0.4)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--off-white)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 2 }}>Training Foundations</p>
                  <p style={{ fontSize: 11, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>4-week strength program · ${t.coursePrice} value</p>
                </div>
                <div style={{ padding: "14px 20px", background: "#161616", borderLeft: "2px solid rgba(200,169,126,0.4)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--off-white)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 2 }}>Nutrition Foundations</p>
                  <p style={{ fontSize: 11, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>4-week nutrition course · {NUTRITION_COURSE_PRICE_DISPLAY} value</p>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, color: "rgba(245,242,238,0.25)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}</span>
                <span style={{ fontSize: 56, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{BUNDLE_PRICE_DISPLAY}</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 20 }}>You save {BUNDLE_SAVINGS_DISPLAY}</p>
              <Link href="/checkout?product=bundle" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "18px 40px" }}>
                Get Both Courses
              </Link>
              <p style={{ marginTop: 14, fontSize: 11, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
                One-time payment · Lifetime access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* FINAL CTA */}
      <section style={{ background: "var(--black)", padding: "140px 80px", textAlign: "center", position: "relative", overflow: "hidden" }} className="final-cta-section">
        <style>{`
          @media (max-width: 768px) {
            .final-cta-section { padding: 100px 28px !important; }
          }
        `}</style>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, background: "radial-gradient(circle, rgba(200,169,126,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20, position: "relative", zIndex: 1 }}>Ready to start?</p>
        <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(42px, 5vw, 68px) * ${hs})`, fontWeight: 900, color: "var(--off-white)", lineHeight: 1.1, marginBottom: 24, position: "relative", zIndex: 1 }}>
          {t.homeFinalHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
          ))}
        </h2>
        <p style={{ fontSize: `calc(17px * ${bs})`, color: "rgba(245,242,238,0.5)", maxWidth: 480, margin: "0 auto 48px", lineHeight: 1.4, position: "relative", zIndex: 1 }}>
          {t.homeFinalSubtext}
        </p>
        <div style={{ position: "relative", zIndex: 1, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0a0a0a", background: "var(--accent)", padding: "6px 16px", marginBottom: 20, fontFamily: "var(--font-dm-sans), sans-serif" }}>Founding Member Price</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 20, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
            <span style={{ fontSize: 72, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 28 }}>Regular {COURSE_REGULAR_PRICE_DISPLAY}. Founding member price.</p>
          <Link href="/checkout" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 72px" }}>
            Get Instant Access
          </Link>
          <p style={{ marginTop: 20, fontSize: 13, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            One-time payment. <strong style={{ color: "rgba(245,242,238,0.55)", fontWeight: 500 }}>No subscription.</strong> Keep the program, the videos, and the tracking system with no recurring fees, ever.
          </p>
        </div>
      </section>

      {/* FREE GUIDE — soft secondary CTA */}
      <section style={{ background: "#faf8f5", padding: "clamp(72px, 10vw, 120px) clamp(24px, 6vw, 80px)" }}>
        <style>{`
          .fg-home-inner { max-width: 560px; }
          @media (min-width: 769px) { .fg-home-inner { max-width: 520px; } }
        `}</style>
        <div className="fg-home-inner">
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Not ready to commit?
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 700, color: "#0a0a0a", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16, marginTop: 0 }}>
            Start with the free guide.
          </h2>
          <p style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)", color: "#6b6560", lineHeight: 1.72, marginBottom: 28, maxWidth: 460, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Get the 5 foundation movements, the exact cues I teach, and a look inside the program. Enter your email and I&apos;ll send it straight to you.
          </p>
          <FreeGuideSignupForm source="homepage" variant="compact" />
          <p style={{ fontSize: 12, color: "#b5afa8", marginTop: 14, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            No spam. Just the guide and the occasional training tip.
          </p>
        </div>
      </section>
    </main>
    </>
  )
}
