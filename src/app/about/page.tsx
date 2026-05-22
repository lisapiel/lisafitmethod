import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "About Lisa McPherson — Certified Personal Trainer",
  description:
    "I trained wrong for years, my back gave out, and I had to relearn everything. Now I help women build a real foundation so they don't have to go through what I did.",
  openGraph: {
    title: "About Lisa McPherson — Certified Personal Trainer",
    description: "I trained wrong for years, my back gave out, and I had to relearn everything. Now I help women build a real foundation.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

export default async function AboutPage() {
  const [photoUrl, settings] = await Promise.all([
    getPublishedPhotoUrl("about_bio"),
    fetchSiteSettings(),
  ])

  const t = settings.text
  const sp = settings.spacing.about
  const accent = settings.colors.accent
  const hs = settings.typography.headingScale
  const bs = settings.typography.bodyScale

  const creds = [
    { label: t.aboutCred1Label, body: t.aboutCred1Body },
    { label: t.aboutCred2Label, body: t.aboutCred2Body },
    { label: t.aboutCred3Label, body: t.aboutCred3Body },
  ]

  return (
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
      <section style={{ background: "#0a0a0a", padding: `${Math.round(100 * sp.hero)}px 80px ${Math.round(80 * sp.hero)}px` }} className="about-hero">
        <style>{`
          @media (max-width: 768px) { .about-hero { padding: 72px 28px 60px !important; } }
        `}</style>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 24 }}>
            About
          </p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 5vw, 64px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 28 }}>
            {t.aboutHeroHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 ? <em style={{ fontStyle: "italic", color: accent }}><br /></em> : null}</span>
            ))}
          </h1>
          <p style={{ fontSize: `calc(18px * ${bs})`, color: "rgba(245,242,238,0.55)", lineHeight: 1.7, maxWidth: 600 }}>
            {t.aboutHeroSubtext}
          </p>
        </div>
      </section>

      {/* STORY + PHOTO */}
      <section style={{ padding: `${Math.round(100 * sp.story)}px 80px` }} className="about-story">
        <style>{`
          @media (max-width: 768px) { .about-story { padding: 72px 28px !important; } .about-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        `}</style>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              {t.aboutPara1}
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              {t.aboutPara2}
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              {t.aboutPara3}
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              {t.aboutPara4}
            </p>
            <p style={{ fontSize: `calc(16px * ${bs})`, lineHeight: 1.9, color: "#1a1a1a", marginBottom: 32 }}>
              <strong style={{ fontWeight: 500 }}>{t.aboutPara5}</strong>
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/courses" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 36px" }}>
                Get The Course
              </Link>
              <Link href="/coaching" style={{ display: "inline-block", border: "1px solid rgba(168,137,94,0.4)", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "16px 28px" }}>
                Work With Me
              </Link>
            </div>
          </div>

          <div>
            <div style={{ position: "relative", height: settings.imageSizes.about_bio, overflow: "hidden", background: "#e8e0d8" }}>
              <Image
                src={photoUrl ?? "/hero.png"}
                alt="Lisa McPherson — Certified Personal Trainer"
                fill
                style={{ objectFit: "cover", objectPosition: settings.crops.about_bio }}
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
      <section style={{ background: "#f0ebe3", padding: `${Math.round(80 * sp.credentials)}px 80px` }} className="creds-section">
        <style>{`
          @media (max-width: 768px) { .creds-section { padding: 60px 28px !important; } .creds-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>What I bring</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 40px) * ${hs})`, fontWeight: 700, color: "#1a1a1a", marginBottom: 48 }}>
            Not just a certification.<br />
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
          Training, tips, and the real stuff.<br />
          <em style={{ fontStyle: "italic", color: accent }}>No fluff.</em>
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
  )
}
