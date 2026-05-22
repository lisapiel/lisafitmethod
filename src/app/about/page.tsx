import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl } from "@/lib/mediaClient"
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
  const photoUrl = await getPublishedPhotoUrl("about_bio")

  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root { --accent: #c8a97e; --accent-dark: #a8895e; --muted: #6b6560; }
      `}</style>

      {/* HERO */}
      <section style={{ background: "#0a0a0a", padding: "100px 80px 80px" }} className="about-hero">
        <style>{`
          @media (max-width: 768px) { .about-hero { padding: 72px 28px 60px !important; } }
        `}</style>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 24 }}>
            About
          </p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 28 }}>
            I trained wrong for years.<br />
            <em style={{ fontStyle: "italic", color: "#c8a97e" }}>Then my back gave out.</em>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(245,242,238,0.55)", lineHeight: 1.7, maxWidth: 600 }}>
            Certified personal trainer. Back from the worst training injury of my life. Now building the foundation I wish I&apos;d had from the start.
          </p>
        </div>
      </section>

      {/* STORY + PHOTO */}
      <section style={{ padding: "100px 80px" }} className="about-story">
        <style>{`
          @media (max-width: 768px) { .about-story { padding: 72px 28px !important; } .about-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        `}</style>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              For years I was training consistently and doing what I thought was right. I wasn&apos;t. I was skipping warm-ups, ignoring mobility work, and jumping between random programs that had no real structure. I pushed heavier weights thinking that was the path to results.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              Then my back gave out. Not from one bad lift — from years of ignoring the fundamentals. For almost a year I lived with serious back pain. Getting off the couch was uncomfortable. The gym felt like something I might never go back to. That year changed everything.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              I became a certified personal trainer because I needed to actually understand what I&apos;d been doing wrong. Not just fix it — understand it. I rebuilt my body from scratch, this time with the right foundation: mobility, movement patterns, progressive structure, and real recovery.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: "#6b6560", marginBottom: 24 }}>
              I came back stronger than I&apos;d ever been. Pain-free. And I&apos;ve stayed that way. Not because I found some secret — because I finally stopped skipping the basics.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: "#1a1a1a", marginBottom: 32 }}>
              <strong style={{ fontWeight: 500 }}>Lisa Fit Method exists because I don&apos;t want you to spend a year learning what I learned the hard way.</strong> The movements, the structure, the habits — everything that would have changed my trajectory if I&apos;d had it from the beginning.
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/courses" style={{ display: "inline-block", background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 36px" }}>
                Get The Course
              </Link>
              <Link href="/coaching" style={{ display: "inline-block", border: "1px solid rgba(168,137,94,0.4)", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "16px 28px" }}>
                Work With Me
              </Link>
            </div>
          </div>

          <div>
            <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", background: "#e8e0d8" }}>
              <Image
                src={photoUrl ?? "/hero.png"}
                alt="Lisa McPherson — Certified Personal Trainer"
                fill
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
            <div style={{ marginTop: 24, padding: "24px 28px", background: "#f0ebe3", borderLeft: "3px solid #c8a97e" }}>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 18, fontStyle: "italic", color: "#1a1a1a", lineHeight: 1.6, marginBottom: 12 }}>
                &ldquo;The fundamentals aren&apos;t optional. They&apos;re the whole game.&rdquo;
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
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, color: "#1a1a1a", marginBottom: 48 }}>
            Not just a certification.<br />
            <em style={{ fontStyle: "italic", color: "#a8895e" }}>Experience from both sides.</em>
          </h2>
          <div className="creds-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {[
              { label: "Certified Personal Trainer", body: "Formally trained in movement, programming, and corrective exercise. I know the science and I live the practice." },
              { label: "Built from scratch", body: "Not just study — I rebuilt my own body after a serious injury. I know what it takes to train when things go wrong." },
              { label: "@lisafitmethod", body: "Building a community of women who train smart, not just hard. Real content, real movement, no gimmicks." },
            ].map((c) => (
              <div key={c.label}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>{c.label}</p>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "#6b6560" }}>{c.body}</p>
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
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 16 }}>Follow along</p>
        <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, color: "#f5f2ee", marginBottom: 20 }}>
          Training, tips, and the real stuff.<br />
          <em style={{ fontStyle: "italic", color: "#c8a97e" }}>No fluff.</em>
        </h2>
        <a
          href="https://instagram.com/lisafitmethod"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.5)", color: "#c8a97e", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", padding: "16px 40px", marginTop: 8 }}
        >
          @lisafitmethod on Instagram ↗
        </a>
      </section>
    </main>
  )
}
