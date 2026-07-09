import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl, getPublishedVideoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import VideoPlayer from "@/components/VideoPlayer.client"
import FreeGuideTeaser from "@/components/FreeGuideTeaser.client"
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
  title: "Lisa Fit Method | Train the Right Way",
  description:
    "A complete strength training foundation for beginners and returners. Learn proper form, follow a structured program, track your progress, and build a body that actually lasts.",
  openGraph: {
    title: "Lisa Fit Method | Train the Right Way",
    description: "A complete strength training foundation for beginners and returners. Proper movement, real structure, and a body built to last.",
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
      description: "A complete strength training foundation for beginners and returners. Learn proper form, follow a structured program, track your progress, and build a body that lasts.",
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
      description: "Online personal training and strength programming built around proper movement, real structure, and a foundation that lasts.",
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
      description: "Certified personal trainer and founder of Lisa Fit Method. Rebuilt training from scratch after a serious back injury. Now helps people build strength the right way.",
      sameAs: ["https://instagram.com/lisafitmethod"],
      worksFor: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      knowsAbout: ["Strength Training", "Beginner Weightlifting", "Movement Correction", "Corrective Exercise", "Progressive Overload", "Core Stability"],
      hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Certification", name: "Certified Personal Trainer (CPT)" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Training Foundations",
      description: "A complete strength training foundation for beginners and returners. Three days a week, built around five foundational movement patterns, progressive overload, and built-in workout tracking. Start with a structured 4-week program, then repeat it stronger.",
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
      description: "Personalized online coaching with Lisa McPherson: custom programming, form review, and weekly check-ins tailored to your goals and schedule.",
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
      }}
    >
      {accent !== "#c8a97e" && <style>{`:root { --accent: ${accent}; }`}</style>}

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
                1:1 Online Coaching
              </p>
              <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 4.5vw, 64px) * ${hs})`, fontWeight: 900, color: "var(--off-white)", lineHeight: 1.05, marginBottom: 20 }}>
                Build a stronger body<br />
                <em style={{ fontStyle: "italic", color: "var(--accent)" }}>with a plan that actually fits you.</em>
              </h1>
              <p style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.65)", lineHeight: 1.6, maxWidth: 500, marginBottom: 16 }}>
                Personalized coaching for people who want to get stronger, build muscle, improve their body composition, and move better, even with a few old injuries or limitations in the mix.
              </p>
              <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 12 }}>
                Your program starts with you. Your goals, your experience, your schedule, your equipment, and what your body has been through.
              </p>
              <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 12 }}>
                If you&apos;ve been training but not seeing the results you want, or you&apos;re working around an old injury and don&apos;t know how to adjust, this is exactly what this coaching is for.
              </p>
              <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 12 }}>
                You&apos;ll train from a clear plan inside my coaching platform, with video demos, progress tracking, weekly check-ins I review personally, form feedback, and direct access to me when you need it. As you progress, your plan adjusts with you, so you always know what to focus on next.
              </p>
              <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500 }}>
                My goal is to help you build a strong, capable body that looks good, moves well, and lasts.
              </p>
            </div>
            <div className="home-hero-cta-col">
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <Link href="/coaching#apply" style={{ display: "block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "18px 32px", textAlign: "center" }}>
                  Apply for Coaching
                </Link>
                <Link href="/checkout" style={{ display: "block", border: "1px solid rgba(200,169,126,0.3)", color: "rgba(245,242,238,0.55)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "14px 20px", textAlign: "center" }}>
                  Want to start on your own first? Check out the courses.
                </Link>
              </div>
              <p style={{ fontSize: 11, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6 }}>
                $1,497/month. 3-month minimum. Limited to 20 clients. Applications reviewed personally within 48 hours.
              </p>
            </div>
          </div>
        ) : (
          <div className="home-hero-fallback">
            <p className="fade-up-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>
              1:1 Online Coaching
            </p>
            <h1 className="fade-up-2" style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 4.5vw, 64px) * ${hs})`, fontWeight: 900, color: "var(--off-white)", lineHeight: 1.05, marginBottom: 24 }}>
              Build a stronger body<br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>with a plan that actually fits you.</em>
            </h1>
            <p className="fade-up-3" style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.65)", lineHeight: 1.6, maxWidth: 500, marginBottom: 16 }}>
              Personalized coaching for people who want to get stronger, build muscle, improve their body composition, and move better, even with a few old injuries or limitations in the mix.
            </p>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 12 }}>
              Your program starts with you. Your goals, your experience, your schedule, your equipment, and what your body has been through.
            </p>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 12 }}>
              If you&apos;ve been training but not seeing the results you want, or you&apos;re working around an old injury and don&apos;t know how to adjust, this is exactly what this coaching is for.
            </p>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 12 }}>
              You&apos;ll train from a clear plan inside my coaching platform, with video demos, progress tracking, weekly check-ins I review personally, form feedback, and direct access to me when you need it. As you progress, your plan adjusts with you, so you always know what to focus on next.
            </p>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "rgba(245,242,238,0.45)", lineHeight: 1.6, maxWidth: 500, marginBottom: 32 }}>
              My goal is to help you build a strong, capable body that looks good, moves well, and lasts.
            </p>
            <div className="fade-up-4" style={{ alignSelf: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <Link href="/coaching#apply" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "18px 42px", textAlign: "center" }}>
                  Apply for Coaching
                </Link>
                <Link href="/checkout" style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.3)", color: "rgba(245,242,238,0.55)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "14px 28px", textAlign: "center" }}>
                  Want to start on your own first? Check out the courses.
                </Link>
              </div>
              <p style={{ fontSize: 11, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
                $1,497/month. 3-month minimum. Limited to 20 clients. Applications reviewed personally within 48 hours.
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
              alt="Lisa McPherson, Lisa Fit Method"
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
              I learned the hard way so you don&apos;t have to.
            </h2>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.65, color: "var(--muted)", marginBottom: 20 }}>
              I trained for years chasing hard workouts, thinking more was better. I had no real system, no structure, just effort. And then I hurt my back.
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.65, color: "var(--muted)", marginBottom: 20 }}>
              Eight months of pain. I couldn&apos;t train at all. That forced me to actually study the things I had been skipping: movement quality, mobility, stability, progressive overload, how nutrition supports recovery. I rebuilt everything from scratch, slower and smarter, and came back stronger than before.
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.65, color: "var(--muted)" }}>
              What I figured out during that time is what this is all built on. If I had trained this way from the start, I would have gotten better results, avoided the injury, and understood my body a lot sooner.
            </p>
            <Link href="/about" style={{ display: "inline-block", marginTop: 28, fontSize: 12, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-dark)", textDecoration: "none" }}>
              My full story →
            </Link>
          </div>
          <div>
            <div style={{ background: "var(--black)", color: "var(--off-white)", padding: "48px 40px", position: "relative" }}>
              <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: 120, color: "var(--accent)", opacity: 0.3, position: "absolute", top: -20, left: 28, lineHeight: 1, userSelect: "none" }}>&ldquo;</span>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(22px * ${hs})`, fontStyle: "italic", lineHeight: 1.6, color: "var(--off-white)", position: "relative", zIndex: 1 }}>
                Your body isn&apos;t the problem. The plan is.
              </p>
              <cite style={{ display: "block", marginTop: 24, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontStyle: "normal", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)" }}>
                Lisa McPherson, CPT
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

      {/* COURSES */}
      <section style={{ background: "var(--off-white)", padding: "100px 80px" }} className="courses-section">
        <style>{`
          @media (max-width: 768px) {
            .courses-section { padding: 72px 24px !important; }
            .courses-cards-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent-dark)", marginBottom: 20, fontFamily: "var(--font-dm-sans), sans-serif" }}>
              The Courses
            </p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3.5vw, 48px) * ${hs})`, fontWeight: 700, color: "var(--black)", lineHeight: 1.15, marginBottom: 16 }}>
              Prefer to start on your own? Start here.
            </h2>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 18, fontStyle: "italic", color: "var(--accent-dark)", margin: 0 }}>
              Everything I had to learn the hard way, organized into a system.
            </p>
          </div>

          <div className="courses-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Training Foundations */}
            <div style={{ background: "#fff", padding: "40px 36px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent-dark)", marginBottom: 8, fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Training Foundations
              </p>
              <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, fontWeight: 700, color: "var(--black)", lineHeight: 1.25, marginBottom: 24 }}>
                Learn to train with structure, so your effort finally goes somewhere.
              </h3>
              <ul style={{ listStyle: "none", marginBottom: 32, flex: 1 }}>
                {[
                  "Foundation Movements",
                  "Core & Glute Priority",
                  "The Training Program: structured workouts with progress tracking",
                  "Works from home or gym",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: `calc(13px * ${bs})`, color: "var(--muted)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--accent-dark)", flexShrink: 0 }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, color: "rgba(0,0,0,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
                  <span style={{ fontSize: 44, fontWeight: 700, color: "var(--accent-dark)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>${t.coursePrice}</span>
                  <span style={{ fontSize: 9, color: "#fff", background: "var(--accent-dark)", padding: "3px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>LIMITED TIME</span>
                </div>
                <Link href="/checkout" style={{ display: "block", background: "var(--accent-dark)", color: "#fff", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 24px", textAlign: "center", marginBottom: 10 }}>
                  Get Instant Access
                </Link>
                <Link href="/courses" style={{ display: "block", border: "1px solid rgba(168,137,94,0.4)", color: "var(--accent-dark)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "14px 24px", textAlign: "center", marginBottom: 16 }}>
                  Explore the Course
                </Link>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6 }}>
                  Includes 50+ exercise videos, built-in workout and progress tracking, full warm-ups and cool-downs, progression guidance, and ongoing access.
                </p>
              </div>
            </div>

            {/* Nutrition Foundations */}
            <div style={{ background: "#fff", padding: "40px 36px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent-dark)", marginBottom: 8, fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Nutrition Foundations
              </p>
              <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 22, fontWeight: 700, color: "var(--black)", lineHeight: 1.25, marginBottom: 24 }}>
                Eat to match your training, without overthinking it.
              </h3>
              <ul style={{ listStyle: "none", marginBottom: 32, flex: 1 }}>
                {[
                  "Interactive calorie and macro calculator",
                  "4-week meal plan",
                  "Science-backed education",
                  "Eating out and supplements guides",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: `calc(13px * ${bs})`, color: "var(--muted)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--accent-dark)", flexShrink: 0 }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, color: "rgba(0,0,0,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
                  <span style={{ fontSize: 44, fontWeight: 700, color: "var(--accent-dark)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
                  <span style={{ fontSize: 9, color: "#fff", background: "var(--accent-dark)", padding: "3px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>LIMITED TIME</span>
                </div>
                <Link href="/checkout?product=nutrition" style={{ display: "block", background: "var(--accent-dark)", color: "#fff", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 24px", textAlign: "center", marginBottom: 10 }}>
                  Get Instant Access · {NUTRITION_COURSE_PRICE_DISPLAY}
                </Link>
                <Link href="/nutrition" style={{ display: "block", border: "1px solid rgba(168,137,94,0.4)", color: "var(--accent-dark)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "14px 24px", textAlign: "center", marginBottom: 16 }}>
                  Explore the Course
                </Link>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6 }}>
                  One-time payment. Buy once, access anytime.
                </p>
              </div>
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
                Both courses together. Training Foundations gives you the movement system. Nutrition Foundations gives you the eating strategy. And if you upgrade to 1:1 coaching within 90 days, your full $137 counts as a credit toward your first month.
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ padding: "14px 20px", background: "#161616", borderLeft: "2px solid rgba(200,169,126,0.4)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--off-white)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 2 }}>Training Foundations</p>
                  <p style={{ fontSize: 11, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>${t.coursePrice} value</p>
                </div>
                <div style={{ padding: "14px 20px", background: "#161616", borderLeft: "2px solid rgba(200,169,126,0.4)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--off-white)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 2 }}>Nutrition Foundations</p>
                  <p style={{ fontSize: 11, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_PRICE_DISPLAY} value</p>
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
                One-time payment · Buy once, access anytime
              </p>
            </div>
          </div>
          <p style={{ marginTop: 40, fontSize: 13, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", textAlign: "center" }}>
            Want it built around you instead?{" "}
            <Link href="/coaching" style={{ color: "rgba(200,169,126,0.6)", textDecoration: "underline" }}>
              That&apos;s 1:1 coaching.
            </Link>
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* COMMON QUESTIONS */}
      <section style={{ background: "var(--off-white)", padding: "100px 80px" }} className="faq-preview-section">
        <style>{`
          @media (max-width: 768px) {
            .faq-preview-section { padding: 72px 28px !important; }
            .faq-preview-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent-dark)", marginBottom: 16, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Common Questions
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, gap: 24, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3.5vw, 48px) * ${hs})`, fontWeight: 700, color: "var(--black)", lineHeight: 1.15, margin: 0 }}>
              Good questions.<br />
              <em style={{ fontStyle: "italic", color: "var(--accent-dark)" }}>Straight answers.</em>
            </h2>
            <Link href="/faq" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-dark)", textDecoration: "none", whiteSpace: "nowrap" }}>
              See all questions →
            </Link>
          </div>
          <div className="faq-preview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              {
                q: "How does 1:1 coaching actually work?",
                a: "You apply, I review, and if we are a good fit I build your program from scratch around your goals, schedule, equipment, and history. Every week you complete a check-in and I adjust based on what's working. You can message me anytime between check-ins.",
              },
              {
                q: "Do I need gym experience to start the courses?",
                a: "None at all. Training Foundations starts from the very beginning and builds from there. If you have been training for a while you will still find things here that fix how you move and change how you progress.",
              },
              {
                q: "Can I try the courses before committing to coaching?",
                a: "Yes, and most of my coaching clients did exactly that. Your course purchase counts as a $137 credit toward coaching if you upgrade within 90 days. It's also a good way to see how I teach before committing to 1:1 work.",
              },
              {
                q: "How available are you during coaching?",
                a: "Very. Weekly check-ins plus messaging anytime between them. I respond same day in most cases. That access is a big part of what makes this different from app-based coaching.",
              },
            ].map((item) => (
              <div key={item.q} style={{ background: "#fff", padding: "32px 36px", borderLeft: "3px solid var(--accent)" }}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 17, fontWeight: 700, color: "var(--black)", lineHeight: 1.3, marginBottom: 10 }}>{item.q}</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          Stop guessing.<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Start training with someone who actually knows your body.</em>
        </h2>
        <p style={{ fontSize: `calc(17px * ${bs})`, color: "rgba(245,242,238,0.5)", maxWidth: 500, margin: "0 auto 48px", lineHeight: 1.4, position: "relative", zIndex: 1 }}>
          Apply for 1:1 coaching and get a fully custom program, weekly check-ins, and real accountability from someone who will actually be there.
        </p>
        <div style={{ position: "relative", zIndex: 1, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <Link href="/coaching#apply" style={{ display: "inline-block", background: "var(--accent)", color: "var(--black)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 72px", marginBottom: 16 }}>
            Apply for Coaching
          </Link>
          <p style={{ fontSize: 12, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 28 }}>
            $1,497/month. 3-month minimum. Spots are limited. Applications reviewed personally within 48 hours.
          </p>
          <p style={{ fontSize: 12, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Prefer to start with the courses?{" "}
            <Link href="/checkout" style={{ color: "rgba(200,169,126,0.6)", textDecoration: "underline" }}>
              Training Foundations is ${t.coursePrice}.
            </Link>
          </p>
        </div>
      </section>

      {/* FREE GUIDES */}
      <FreeGuideTeaser />
    </main>
    </>
  )
}
