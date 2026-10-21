import Link from "next/link"
import type { Metadata } from "next"

import { FAQ_CATEGORIES, type FaqCategory } from "./content"
import { GOLD_LINK } from "./linkStyle"

const linkStyle = GOLD_LINK

export const metadata: Metadata = {
  title: "FAQ | Common Questions About The Lisa Fit Method",
  description:
    "Answers to the most common questions about The Lisa Fit Method: beginner strength training, nutrition for fat loss and muscle building, how courses and coaching work, and how to get started.",
  openGraph: {
    title: "FAQ | Common Questions About The Lisa Fit Method",
    description:
      "Everything you need to know before you start. Courses, coaching, training, nutrition, equipment, results, and access. Honest answers from a certified personal trainer.",
  },
}

const gold = "#c8a97e"
const ink = "#1a1a1a"
const muted = "#6b6560"
const divider = "#e8e4df"
const offWhite = "#f5f2ee"
const warmWhite = "#faf8f5"



const ALL_ITEMS = FAQ_CATEGORIES.flatMap((c) => c.items)

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALL_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.schemaA,
    },
  })),
}

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <main style={{ background: warmWhite, color: ink, fontFamily: "var(--font-dm-sans), sans-serif" }}>

        {/* PAGE HEADER */}
        <section style={{ background: offWhite, borderBottom: `1px solid ${divider}`, padding: "72px 80px 64px" }}>
          <style>{`
            @media (max-width: 768px) {
              .faq-header { padding: 56px 28px 48px !important; }
              .faq-content { padding: 56px 28px 80px !important; }
              .faq-cta-section { padding: 64px 28px !important; }
              .faq-cta-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
          <div className="faq-header" style={{ maxWidth: 740, margin: "0 auto" }}>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: gold,
              marginBottom: 20,
            }}>
              Frequently Asked Questions
            </p>
            <h1 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(34px, 4.5vw, 54px)",
              fontWeight: 700,
              color: "#0a0a0a",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 28,
            }}>
              Everything you need to know before you start.
            </h1>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(15px, 2vw, 17px)",
              color: muted,
              lineHeight: 1.75,
              maxWidth: 640,
            }}>
              The Lisa Fit Method is a fitness education platform built around evidence-based training and nutrition. Its goal is to help people build strength, improve their body composition, and understand the principles behind their results so they can keep progressing with confidence. These are the questions people ask most before getting started.
            </p>
          </div>
        </section>

        {/* FAQ ITEMS BY CATEGORY */}
        <section className="faq-content" style={{ padding: "72px 80px 100px" }}>
          <div style={{ maxWidth: 740, margin: "0 auto" }}>
            {FAQ_CATEGORIES.map((category, ci) => (
              <div key={category.label} style={{ marginBottom: ci < FAQ_CATEGORIES.length - 1 ? 64 : 0 }}>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: gold,
                  marginBottom: 32,
                  paddingBottom: 16,
                  borderBottom: `1px solid ${divider}`,
                }}>
                  {category.label}
                </p>
                {category.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: i === 0 ? 0 : 36,
                      paddingBottom: 36,
                      borderBottom: i < category.items.length - 1 ? `1px solid ${divider}` : "none",
                    }}
                  >
                    <h2 style={{
                      fontFamily: "var(--font-playfair), serif",
                      fontSize: "clamp(18px, 2vw, 22px)",
                      fontWeight: 600,
                      color: "#0a0a0a",
                      lineHeight: 1.35,
                      marginBottom: 14,
                    }}>
                      {item.q}
                    </h2>
                    <div style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: "clamp(14px, 1.5vw, 16px)",
                      color: muted,
                      lineHeight: 1.8,
                      fontWeight: 300,
                    }}>
                      {typeof item.a === "string" ? <p style={{ margin: 0 }}>{item.a}</p> : item.a}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="faq-cta-section" style={{ background: "#0a0a0a", padding: "80px 80px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: gold,
              marginBottom: 16,
              textAlign: "center",
            }}>
              Ready to start?
            </p>
            <h2 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 700,
              color: "#f5f2ee",
              lineHeight: 1.15,
              textAlign: "center",
              marginBottom: 14,
            }}>
              The right starting point depends on your goal.
            </h2>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 15,
              color: "rgba(245,242,238,0.45)",
              lineHeight: 1.7,
              textAlign: "center",
              maxWidth: 520,
              margin: "0 auto 52px",
            }}>
              Every option below is a one-time payment with lifetime access. Pick the one that matches where you are right now.
            </p>

            <div className="faq-cta-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>

              {/* Training Foundations */}
              <div style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                borderTop: `3px solid ${gold}`,
                padding: "32px 28px",
              }}>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: gold,
                  marginBottom: 10,
                }}>
                  Training Foundations
                </p>
                <p style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}>
                  Learn to train the right way.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}>
                  For people who want to build real strength, learn correct technique, and finally follow a program that makes sense. 50+ exercise videos, a structured 4-week program, progressive overload guidance, and built-in workout tracking.
                </p>
                <Link
                  href="/checkout?product=training"
                  style={{
                    display: "block",
                    background: gold,
                    color: "#0a0a0a",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    padding: "13px 20px",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  Get Training Foundations
                </Link>
                <Link
                  href="/courses"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 11,
                    color: "rgba(245,242,238,0.3)",
                    textDecoration: "none",
                    textAlign: "center",
                    letterSpacing: "0.08em",
                    padding: "4px 0",
                  }}
                >
                  See what&apos;s included →
                </Link>
              </div>

              {/* Nutrition Foundations */}
              <div style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                borderTop: `3px solid ${gold}`,
                padding: "32px 28px",
              }}>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: gold,
                  marginBottom: 10,
                }}>
                  Nutrition Foundations
                </p>
                <p style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}>
                  Learn to eat for your goals.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}>
                  For people who want to understand nutrition for fat loss, muscle building, or both. TDEE calculator, 4-week meal plan, macro education, and real-world strategies for eating well without obsessing over food.
                </p>
                <Link
                  href="/checkout?product=nutrition"
                  style={{
                    display: "block",
                    background: gold,
                    color: "#0a0a0a",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    padding: "13px 20px",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  Get Nutrition Foundations
                </Link>
                <Link
                  href="/nutrition"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 11,
                    color: "rgba(245,242,238,0.3)",
                    textDecoration: "none",
                    textAlign: "center",
                    letterSpacing: "0.08em",
                    padding: "4px 0",
                  }}
                >
                  See what&apos;s included →
                </Link>
              </div>

              {/* Coaching */}
              <div style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                borderTop: "3px solid #555",
                padding: "32px 28px",
              }}>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(245,242,238,0.35)",
                  marginBottom: 10,
                }}>
                  1:1 Coaching
                </p>
                <p style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}>
                  Personalized guidance, directly from Lisa.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}>
                  For people who want a fully custom program built around their specific goals, injury history, and schedule. Includes form review, weekly check-ins, and ongoing program adjustments as you progress.
                </p>
                <Link
                  href="/coaching"
                  style={{
                    display: "block",
                    border: "1px solid rgba(200,169,126,0.4)",
                    color: "rgba(245,242,238,0.65)",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    padding: "13px 20px",
                    textAlign: "center",
                  }}
                >
                  Learn About Coaching
                </Link>
              </div>

              {/* Bundle */}
              <div style={{
                background: "#141414",
                border: `1px solid rgba(200,169,126,0.3)`,
                borderTop: `3px solid ${gold}`,
                padding: "32px 28px",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  top: -1,
                  right: 20,
                  background: gold,
                  color: "#0a0a0a",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                }}>
                  Best Value
                </div>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: gold,
                  marginBottom: 10,
                }}>
                  Foundations Bundle
                </p>
                <p style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}>
                  The complete system.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}>
                  For people who want to address both training and nutrition at the same time. Both courses together at the best available price. One payment, lifetime access to everything.
                </p>
                <Link
                  href="/checkout?product=bundle"
                  style={{
                    display: "block",
                    background: gold,
                    color: "#0a0a0a",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    padding: "13px 20px",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  Get Both Courses
                </Link>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 11,
                  color: "rgba(245,242,238,0.2)",
                  textAlign: "center",
                  padding: "4px 0",
                }}>
                  One-time payment. Lifetime access.
                </p>
              </div>

            </div>

            <p style={{
              textAlign: "center",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 13,
              color: "rgba(245,242,238,0.3)",
              lineHeight: 1.6,
            }}>
              Still have a question not answered here?{" "}
              <Link href="/contact" style={{ color: gold, textDecoration: "none" }}>
                Get in touch.
              </Link>
            </p>
          </div>
        </section>

      </main>
    </>
  )
}
