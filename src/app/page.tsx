import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl, getPublishedVideoUrl } from "@/lib/mediaClient"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Lisa Fit Method — Train the Right Way",
  description:
    "A 4-week beginner program built around what actually matters. Proper movement, a real foundation, and a body built to last.",
}

export default async function HomePage() {
  const [heroUrl, bannerUrl, testimonialsUrl, trailerUrl] = await Promise.all([
    getPublishedPhotoUrl("hero"),
    getPublishedPhotoUrl("banner"),
    getPublishedPhotoUrl("testimonials"),
    getPublishedVideoUrl("lp_trailer"),
  ])
  return (
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
          --accent: #c8a97e;
          --accent-dark: #a8895e;
          --text: #1a1a1a;
          --muted: #6b6560;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeUp 0.8s ease forwards 0.2s; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.8s ease forwards 0.4s; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.8s ease forwards 0.6s; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.8s ease forwards 0.8s; opacity: 0; }
        .fade-up-5 { animation: fadeUp 0.8s ease forwards 1.0s; opacity: 0; }
      `}</style>

      {/* HERO */}
      <section style={{ background: "var(--black)", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: "100vh",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          <style>{`
            @media (max-width: 768px) {
              .hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
              .hero-photo-wrap { height: 72vw; min-height: 300px; max-height: 480px; order: 1; }
              .hero-left-wrap { padding: 40px 24px 48px !important; order: 0; }
              .hero-line-deco { display: none !important; }
            }
          `}</style>
          <div
            className="hero-left-wrap"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "80px 60px 80px 80px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <p
              className="fade-up-1"
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 28,
              }}
            >
              Lisa Fit Method — Foundations
            </p>
            <h1
              className="fade-up-2"
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(48px, 5vw, 72px)",
                fontWeight: 900,
                color: "var(--off-white)",
                lineHeight: 1.05,
                marginBottom: 32,
              }}
            >
              Stop guessing.<br />
              Start training<br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>the right way.</em>
            </h1>
            <p
              className="fade-up-3"
              style={{
                fontSize: 17,
                color: "rgba(245,242,238,0.65)",
                lineHeight: 1.7,
                maxWidth: 420,
                marginBottom: 48,
              }}
            >
              A 4-week beginner program built around what actually matters. Proper movement, a real foundation, and a body built to last. No random workouts. No ego lifting. Just the method that changed everything for me.
            </p>
            <div className="fade-up-4" style={{ alignSelf: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{
                  fontSize: 16,
                  color: "rgba(245,242,238,0.35)",
                  textDecoration: "line-through",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}>$67</span>
                <span style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "var(--accent)",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  lineHeight: 1,
                }}>$45</span>
                <span style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  border: "1px solid rgba(200,169,126,0.4)",
                  padding: "4px 10px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}>Limited Time</span>
              </div>
              <Link
                href="/checkout"
                style={{
                  display: "inline-block",
                  background: "var(--accent)",
                  color: "var(--black)",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "18px 42px",
                  transition: "background 0.2s ease, transform 0.2s ease",
                }}
              >
                Get Instant Access
              </Link>
              <p style={{ marginTop: 14, fontSize: 12, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif" }}>
                One-time payment.{" "}
                <strong style={{ color: "rgba(245,242,238,0.6)", fontWeight: 500 }}>Yours forever.</strong>
              </p>
            </div>
          </div>

          <div
            className="hero-photo-wrap"
            style={{ position: "relative", overflow: "hidden", alignSelf: "stretch" }}
          >
            <Image
              src={heroUrl ?? "/hero.png"}
              alt="Lisa McPherson — Lisa Fit Method"
              fill
              style={{ objectFit: "cover", objectPosition: "center 15%" }}
              priority
            />
          </div>
        </div>

        <p
          className="hero-line-deco"
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "rgba(245,242,238,0.25)",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            zIndex: 2,
          }}
        >
          Certified Personal Trainer · @lisafitmethod
        </p>
      </section>

      {/* STORY */}
      <section
        style={{ background: "var(--off-white)", padding: "80px 80px" }}
        className="story-section"
      >
        <style>{`
          @media (max-width: 768px) {
            .story-section { padding: 80px 28px !important; }
            .story-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          }
        `}</style>
        <div
          className="story-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 24,
              }}
            >
              Why this exists
            </p>
            <h2
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(36px, 3.5vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--black)",
                marginBottom: 32,
              }}
            >
              I learned the hard way.<br />
              <em style={{ fontStyle: "italic", color: "var(--accent-dark)" }}>You don&apos;t have to.</em>
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "var(--muted)", marginBottom: 20 }}>
              A few years ago I was training consistently and doing everything I thought was right. I wasn&apos;t. I was skipping warm-ups, ignoring mobility, and following random programs with no structure. I thought pushing more weight was the path to results.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "var(--muted)", marginBottom: 20 }}>
              Then my back gave out. For almost a year I lived with serious back pain. Simple things became genuinely uncomfortable. That year taught me more about training than all the years before it combined.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "var(--muted)", marginBottom: 20 }}>
              I had to relearn everything from scratch. I became a certified personal trainer because I needed to actually understand what I&apos;d been doing wrong. I rebuilt my body the right way. Stronger than I&apos;d ever been. Pain-free. And I&apos;ve stayed that way.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "var(--muted)" }}>
              <strong style={{ color: "var(--text)", fontWeight: 500 }}>This guide is everything I wish someone had handed me before I started.</strong> The movements, structure, and habits that would have saved me a year of pain if I&apos;d learned them first.
            </p>
          </div>
          <div>
            <div
              style={{
                background: "var(--black)",
                color: "var(--off-white)",
                padding: "48px 40px",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 120,
                  color: "var(--accent)",
                  opacity: 0.3,
                  position: "absolute",
                  top: -20,
                  left: 28,
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                &ldquo;
              </span>
              <p
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 22,
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  color: "var(--off-white)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                You don&apos;t need to learn the hard way. That&apos;s already been done.
              </p>
              <cite
                style={{
                  display: "block",
                  marginTop: 24,
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 12,
                  fontStyle: "normal",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}
              >
                — Lisa McPherson, CPT
              </cite>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER */}
      {bannerUrl && (
        <section style={{ position: "relative", overflow: "hidden", height: "clamp(180px, 28vw, 400px)" }}>
          <Image
            src={bannerUrl}
            alt="Lisa Fit Method"
            fill
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
        </section>
      )}

      {/* WHAT YOU GET */}
      <section style={{ background: "var(--black)", padding: "120px 80px" }} className="wyg-section">
        <style>{`
          @media (max-width: 768px) {
            .wyg-section { padding: 80px 28px !important; }
            .modules-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 72,
            borderBottom: "1px solid rgba(245,242,238,0.1)",
            paddingBottom: 40,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 16,
              }}
            >
              What&apos;s inside
            </p>
            <h2
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(36px, 3.5vw, 52px)",
                fontWeight: 700,
                color: "var(--off-white)",
                lineHeight: 1.1,
              }}
            >
              Four modules.<br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>One foundation.</em>
            </h2>
          </div>
        </div>

        <div
          className="modules-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
            background: "rgba(245,242,238,0.06)",
          }}
        >
          <style>{`.module-card { background: var(--black); transition: background 0.3s ease; } .module-card:hover { background: #111; }`}</style>
          {[
            {
              num: "01",
              tag: "Module 1",
              title: "Foundation Movements",
              desc: "The five movement patterns every lifter needs before adding weight or complexity.",
              items: ["Hip Hinge — the most important movement you'll learn", "Squat Pattern — knees, hips, and spine working together", "Push Pattern — pressing without wrecking your shoulders", "Pull Pattern — building the back that protects everything", "Brace & Carry — how your core actually works"],
            },
            {
              num: "02",
              tag: "Module 2",
              title: "Core & Glute Priority",
              desc: "Targeted training for the muscles most responsible for lower back health and strength.",
              items: ["Dead Bug & Bird Dog — anti-extension stability", "Glute Bridge & Hip Thrust — the primary glute builders", "Glute Medius Circuit — the work most programs ignore", "Romanian Deadlift — posterior chain under load", "Pallof Press & Farmer's Carry — anti-rotation and bracing"],
            },
            {
              num: "03",
              tag: "Module 3",
              title: "The 4-Week Program",
              desc: "Three days a week. Warm-ups, working sets, and cool-downs. Every session structured with intent.",
              items: ["Day A — Lower body focus", "Day B — Upper body focus", "Day C — Movement quality & integration", "Weeks 3 & 4 — Progressive overload built in", "10-minute warm-ups and 5-minute cool-downs included"],
            },
            {
              num: "04",
              tag: "Module 4",
              title: "Nutrition Foundations",
              desc: "Five principles that support everything you do in the gym without obsessing over food.",
              items: ["Protein is your priority", "Eat enough to train", "Consistency beats perfection", "Hydration affects everything", "Don't complicate it until you've mastered the basics"],
            },
          ].map((mod) => (
            <div
              key={mod.num}
              className="module-card"
              style={{
                padding: "48px 40px",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 64,
                  fontWeight: 900,
                  color: "rgba(200,169,126,0.12)",
                  position: "absolute",
                  top: 24,
                  right: 32,
                  lineHeight: 1,
                }}
              >
                {mod.num}
              </span>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>
                {mod.tag}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--off-white)",
                  marginBottom: 16,
                  lineHeight: 1.3,
                }}
              >
                {mod.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(245,242,238,0.5)" }}>{mod.desc}</p>
              <ul style={{ listStyle: "none", marginTop: 20 }}>
                {mod.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      fontSize: 13,
                      color: "rgba(245,242,238,0.45)",
                      padding: "6px 0 6px 16px",
                      position: "relative",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: "var(--accent)",
                        fontSize: 11,
                      }}
                    >
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* TRAILER VIDEO */}
      {trailerUrl && (
        <section style={{ background: "#050505", padding: "100px 40px" }} className="trailer-section">
          <style>{`
            @media (max-width: 768px) {
              .trailer-section { padding: 72px 24px !important; }
            }
          `}</style>
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 20,
            }}>
              A look inside
            </p>
            <h2 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 700,
              color: "var(--off-white)",
              lineHeight: 1.15,
              marginBottom: 48,
            }}>
              See exactly what<br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>you&apos;re getting.</em>
            </h2>
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: 560,
              margin: "0 auto",
              aspectRatio: "1334 / 1080",
              background: "#0a0a0a",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}>
              <video
                src={trailerUrl}
                controls
                playsInline
                preload="metadata"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
              />
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonialsUrl && (
        <section style={{ background: "var(--off-white)", padding: "100px 40px" }} className="testimonials-section">
          <style>{`
            @media (max-width: 768px) {
              .testimonials-section { padding: 72px 20px !important; }
            }
          `}</style>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <p style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--accent-dark)",
              marginBottom: 20,
            }}>
              Real results
            </p>
            <h2 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 700,
              color: "var(--black)",
              lineHeight: 1.15,
              marginBottom: 48,
            }}>
              What people<br />
              <em style={{ fontStyle: "italic", color: "var(--accent-dark)" }}>are saying.</em>
            </h2>
            <div style={{ position: "relative", width: "100%", borderRadius: 0 }}>
              <Image
                src={testimonialsUrl}
                alt="Testimonials from Lisa Fit Method students"
                width={1800}
                height={1200}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </section>
      )}

      {/* WHO THIS IS FOR */}
      <section style={{ background: "var(--warm-white)", padding: "120px 80px" }} className="for-you-section">
        <style>{`
          @media (max-width: 768px) {
            .for-you-section { padding: 80px 28px !important; }
            .for-you-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
            .for-you-right-col { padding-top: 0 !important; }
          }
        `}</style>
        <div
          className="for-you-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--accent-dark)",
                marginBottom: 16,
              }}
            >
              Is this for me?
            </p>
            <h2
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(36px, 3.5vw, 52px)",
                fontWeight: 700,
                color: "var(--black)",
                lineHeight: 1.1,
              }}
            >
              This is for you
              <br />
              <em style={{ fontStyle: "italic", color: "var(--accent-dark)" }}>if you&apos;re serious.</em>
            </h2>
            <ul style={{ listStyle: "none", marginTop: 32 }}>
              {[
                "You&apos;re new to structured training or feel like you&apos;ve been winging it",
                "You want to understand the why behind every movement, not just follow a list",
                "You&apos;ve had nagging injuries or lower back pain and want to train around them",
                "You&apos;re tired of random workouts that don&apos;t build on each other",
                "You&apos;re ready to commit to 3 days a week for 4 weeks",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    fontSize: 15,
                    color: "var(--text)",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: "var(--accent-dark)", fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
          <div className="for-you-right-col" style={{ paddingTop: 80 }}>
            <h3
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--black)",
                marginBottom: 8,
              }}
            >
              This is not for you
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, letterSpacing: "0.05em" }}>
              (and that&apos;s okay)
            </p>
            <ul style={{ listStyle: "none" }}>
              {[
                "You&apos;re looking for a quick fix or a 7-day transformation",
                "You already have years of consistent structured training",
                "You&apos;re not willing to do warm-ups or cool-downs",
                "You want someone to tell you to push through bad form",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: "#999", fontWeight: 400, fontSize: 18, marginTop: 0, flexShrink: 0 }}>×</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          background: "var(--black)",
          padding: "140px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
        className="final-cta-section"
      >
        <style>{`
          @media (max-width: 768px) {
            .final-cta-section { padding: 100px 28px !important; }
          }
        `}</style>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 800,
            background: "radial-gradient(circle, rgba(200,169,126,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          Ready to start?
        </p>
        <h2
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(42px, 5vw, 68px)",
            fontWeight: 900,
            color: "var(--off-white)",
            lineHeight: 1.1,
            marginBottom: 24,
            position: "relative",
            zIndex: 1,
          }}
        >
          Build the foundation.<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Train for life.</em>
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "rgba(245,242,238,0.5)",
            maxWidth: 480,
            margin: "0 auto 48px",
            lineHeight: 1.7,
            position: "relative",
            zIndex: 1,
          }}
        >
          Four weeks. Three days a week. Everything you need to actually understand how to train and a body that shows it.
        </p>
        <div style={{ position: "relative", zIndex: 1, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <span style={{
              fontSize: 18,
              color: "rgba(245,242,238,0.3)",
              textDecoration: "line-through",
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}>$67</span>
            <span style={{
              fontSize: 48,
              fontWeight: 700,
              color: "var(--gold)",
              fontFamily: "var(--font-dm-sans), sans-serif",
              lineHeight: 1,
            }}>$45</span>
            <span style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--gold)",
              border: "1px solid rgba(201,169,110,0.4)",
              padding: "5px 12px",
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}>Limited Time Offer</span>
          </div>
          <Link
            href="/checkout"
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "var(--black)",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "20px 64px",
            }}
          >
            Get Instant Access
          </Link>
          <p style={{ marginTop: 18, fontSize: 14, color: "rgba(245,242,238,0.35)" }}>
            One-time payment.{" "}
            <strong style={{ color: "rgba(245,242,238,0.6)", fontWeight: 500 }}>Yours forever.</strong>
            {" · "}No subscription.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#050505",
          padding: "40px 80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
        className="site-footer"
      >
        <style>{`
          @media (max-width: 768px) {
            .site-footer { flex-direction: column !important; gap: 16px !important; text-align: center !important; padding: 40px 28px !important; }
          }
        `}</style>
        <div
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 18,
            color: "var(--off-white)",
            fontWeight: 700,
          }}
        >
          Lisa <span style={{ color: "var(--accent)" }}>Fit Method</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(245,242,238,0.2)", letterSpacing: "0.05em" }}>
          © {new Date().getFullYear()} Lisa Fit Method. All rights reserved.
        </p>
        <Link
          href="/training-foundations"
          style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          Member Login →
        </Link>
      </footer>
    </main>
  )
}
