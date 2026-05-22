import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "About Lisa McPherson — Certified Personal Trainer",
  description:
    "Certified personal trainer and founder of Lisa Fit Method. Spent years in classes before finding structured strength training — learned the foundation the hard way, now here to give it to you straight.",
  openGraph: {
    title: "About Lisa McPherson — Certified Personal Trainer",
    description: "Certified personal trainer and founder of Lisa Fit Method. Learned the foundation the hard way — now here to give it to you straight.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

export default async function AboutPage() {
  const [photoUrl, settings] = await Promise.all([
    getPublishedPhotoUrl("about_bio"),
    fetchSiteSettings(),
  ])

  const t = settings.text
  const accent = settings.colors.accent
  const hs = settings.typography.headingScale
  const bs = settings.typography.bodyScale

  const creds = [
    { label: t.aboutCred1Label, body: t.aboutCred1Body },
    { label: t.aboutCred2Label, body: t.aboutCred2Body },
    { label: t.aboutCred3Label, body: t.aboutCred3Body },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Lisa McPherson",
    jobTitle: "Certified Personal Trainer",
    url: "https://lisafitmethod.com/about",
    image: photoUrl ?? "https://lisafitmethod.com/hero.png",
    description: "Certified personal trainer and founder of Lisa Fit Method. Rebuilt her training from scratch after a serious back injury and now helps people build a real foundation.",
    sameAs: ["https://instagram.com/lisafitmethod"],
    worksFor: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
    knowsAbout: ["Strength Training", "Movement Correction", "Corrective Exercise", "Progressive Overload", "Hip Hinge", "Core Stability", "Intelligent Programming"],
    hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Certification", name: "Certified Personal Trainer (CPT)" },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root {
          --accent: ${accent};
          --accent-dark: #a8895e;
          --muted: #6b6560;
          --heading-scale: ${hs};
          --body-scale: ${bs};
        }
      `}</style>

      {/* HERO */}
      <section style={{ background: "#0a0a0a" }} className="about-hero">
        <style>{`
          @media (max-width: 768px) {
            .about-hero-grid { grid-template-columns: 1fr !important; }
            .about-hero-text { padding: 64px 28px 48px !important; }
            .about-hero-photo { max-height: 480px !important; overflow: hidden; }
          }
        `}</style>
        <div className="about-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 420px", alignItems: "stretch", maxWidth: 1200, margin: "0 auto" }}>
          <div className="about-hero-text" style={{ padding: "100px 64px 80px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 24 }}>
              About Me
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(36px, 4vw, 58px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 28 }}>
              {t.aboutHeroHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <em style={{ fontStyle: "italic", color: accent }}><br /></em> : null}</span>
              ))}
            </h1>
            <p style={{ fontSize: `calc(16px * ${bs})`, color: "rgba(245,242,238,0.55)", lineHeight: 1.75, maxWidth: 520 }}>
              {t.aboutHeroSubtext}
            </p>
          </div>
          <div className="about-hero-photo" style={{ position: "relative" }}>
            <Image
              src="/lisa-about-hero.jpg"
              alt="Lisa McPherson — Certified Personal Trainer"
              width={840}
              height={1200}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
              priority
            />
          </div>
        </div>
      </section>

      {/* STORY + PHOTO */}
      <section style={{ padding: "100px 80px" }} className="about-story">
        <style>{`
          @media (max-width: 768px) { .about-story { padding: 72px 28px !important; } .about-grid { grid-template-columns: 1fr !important; gap: 48px !important; } .about-photo { min-height: 640px !important; } }
        `}</style>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto", alignItems: "stretch" }}>
          <div>
            {[
              "I grew up in France and earned two master's degrees in engineering — one in France and one in Canada. For most of my twenties, I was building a career, not a body.",
              "When I moved to Australia and started my own business, I found the gym for the first time. Classes, cardio, group workouts. I was consistent, I worked hard, and I still had almost nothing to show for it. Years of effort without real progress.",
              "Everything changed when I moved to the United States.",
              "Seven years ago, I landed in Miami and started taking strength training seriously for the first time. Within months, I finally understood what had been missing: structure, progressive overload, and real programming. My body started changing in a way it never had before, and I became obsessed with understanding how fitness actually works.",
              "But I made the mistake a lot of people make once they start seeing progress. I pushed heavier weights before building the foundation to support them. Warm-ups felt optional. Mobility work wasn't on my radar. Eventually my back gave out.",
              "For almost a year, I lived with serious pain. That period forced me to slow down, relearn movement mechanics, and completely rethink the way I approached fitness.",
              "I rebuilt everything from the ground up: movement quality, mobility, recovery, warm-ups, and programming. I became a certified personal trainer because I needed to genuinely understand what I had been missing all along.",
              "I came back pain-free and stronger than I had ever been. And I realized a lot of people are going through the exact same thing I went through — training hard without understanding how to build a body that can actually support it long term.",
              "Some are already dealing with pain. Others are heading toward it without realizing it yet.",
              "Lisa Fit Method exists to help people build strength the right way from the beginning — through movement quality, intelligent programming, and training that lasts.",
              "I'm an engineer by training, and I naturally think in systems and structure. That mindset completely changed the way I approach fitness: the warm-up, the movements, the progression, the recovery — everything connects.",
              "Whether you're completely new to lifting or you've been winging it for years, this is the approach I wish someone had handed me from the beginning.",
            ].map((para, i) => (
              <p key={i} style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.9, color: "#6b6560", marginBottom: 20 }}>
                {para}
              </p>
            ))}

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
              <Link href="/courses" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 36px" }}>
                Get The Course
              </Link>
              <Link href="/coaching" style={{ display: "inline-block", border: "1px solid rgba(168,137,94,0.4)", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "16px 28px" }}>
                Work With Me
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="about-photo" style={{ background: "#e8e0d8", overflow: "hidden" }}>
              <Image
                src={photoUrl ?? "/hero.png"}
                alt="Lisa McPherson — Certified Personal Trainer"
                width={900}
                height={1200}
                style={{ width: "100%", height: "auto", display: "block" }}
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
            <div style={{ marginTop: 24, padding: "24px 28px", background: "#f0ebe3", borderLeft: "3px solid #c8a97e" }}>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(18px * ${hs})`, fontStyle: "italic", color: "#1a1a1a", lineHeight: 1.6, marginBottom: 12 }}>
                &ldquo;{t.aboutQuote}&rdquo;
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a8895e" }}>
                — Lisa McPherson, CPT
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section style={{ background: "#f0ebe3", padding: "80px 80px" }} className="creds-section">
        <style>{`
          @media (max-width: 768px) { .creds-section { padding: 60px 28px !important; } .creds-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>What I bring</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 40px) * ${hs})`, fontWeight: 700, color: "#1a1a1a", marginBottom: 48 }}>
            Not just certification.<br />
            <em style={{ fontStyle: "italic", color: "#a8895e" }}>Experience from both sides.</em>
          </h2>
          <div className="creds-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {creds.map((c) => (
              <div key={c.label}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(20px * ${hs})`, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>{c.label}</p>
                <p style={{ fontSize: `calc(14px * ${bs})`, lineHeight: 1.75, color: "#6b6560" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section style={{ background: "#0a0a0a", padding: "80px 80px", textAlign: "center" }} className="ig-section">
        <style>{`
          @media (max-width: 768px) { .ig-section { padding: 60px 28px !important; } }
        `}</style>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 16 }}>Follow along</p>
        <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 40px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 20 }}>
          Training, movement, and the real stuff.<br />
          <em style={{ fontStyle: "italic", color: accent }}>No gimmicks.</em>
        </h2>
        <a
          href="https://instagram.com/lisafitmethod"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.5)", color: accent, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", padding: "16px 40px", marginTop: 8 }}
        >
          @lisafitmethod on Instagram ↗
        </a>
      </section>
    </main>
    </>
  )
}
