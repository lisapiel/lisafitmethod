import Link from "next/link"
import type { Metadata } from "next"

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

const linkStyle: React.CSSProperties = {
  color: "#a8895e",
  textDecoration: "underline",
  textUnderlineOffset: 2,
}

type FaqItem = {
  q: string
  a: React.ReactNode
  schemaA: string
}

type FaqCategory = {
  label: string
  items: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    label: "Getting Started",
    items: [
      {
        q: "What is The Lisa Fit Method?",
        a: "The Lisa Fit Method is built around a simple belief: lasting results come from understanding the fundamentals. After a serious back injury forced me to rebuild my own training from the ground up, I became obsessed with learning what actually works and why. Today, The Lisa Fit Method combines evidence-based training, practical nutrition, and sustainable habits to help people build strength, improve their body composition, and feel confident in the gym. Through courses and coaching, the goal is not just to help you get results, but to understand how to keep creating them for years to come.",
        schemaA:
          "The Lisa Fit Method is built around a simple belief: lasting results come from understanding the fundamentals. After a serious back injury forced me to rebuild my own training from the ground up, I became obsessed with learning what actually works and why. Today, The Lisa Fit Method combines evidence-based training, practical nutrition, and sustainable habits to help people build strength, improve their body composition, and feel confident in the gym. Through courses and coaching, the goal is not just to help you get results, but to understand how to keep creating them for years to come.",
      },
      {
        q: "Who is The Lisa Fit Method for?",
        a: "I created The Lisa Fit Method for people who want to build strength, improve their body composition, and finally understand how training and nutrition actually work. Most people I work with are either completely new to the gym, returning after time away, or frustrated because they've spent years trying random workouts without seeing consistent results. If you've ever felt overwhelmed by fitness advice, intimidated by the gym, or unsure whether you're doing the right things, this is exactly who I built it for.",
        schemaA:
          "I created The Lisa Fit Method for people who want to build strength, improve their body composition, and finally understand how training and nutrition actually work. Most people I work with are either completely new to the gym, returning after time away, or frustrated because they've spent years trying random workouts without seeing consistent results. If you've ever felt overwhelmed by fitness advice, intimidated by the gym, or unsure whether you're doing the right things, this is exactly who I built it for.",
      },
      {
        q: "Which course should I start with?",
        a: (
          <>
            If your goal is to learn how to strength train properly, build confidence in the gym, and understand the fundamentals that drive results, start with{" "}
            <Link href="/courses" style={linkStyle}>Training Foundations</Link>
            . If your main focus is improving your eating habits, understanding calories and macros, or learning how nutrition supports fat loss and muscle building, start with{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            . Both courses work independently, but together they provide the complete framework I use to help people build sustainable results.
          </>
        ),
        schemaA:
          "If your goal is to learn how to strength train properly, build confidence in the gym, and understand the fundamentals that drive results, start with Training Foundations. If your main focus is improving your eating habits, understanding calories and macros, or learning how nutrition supports fat loss and muscle building, start with Nutrition Foundations. Both courses work independently, but together they provide the complete framework I use to help people build sustainable results.",
      },
      {
        q: "Do I need gym experience to start?",
        a: (
          <>
            Not at all. In fact, many people who join have never followed a structured strength training program before.{" "}
            <Link href="/courses" style={linkStyle}>Training Foundations</Link>
            {" "}was designed to teach you the fundamentals from the ground up, including movement mechanics, exercise form, and how to progress safely over time. You don&apos;t need experience, you just need a willingness to learn.
          </>
        ),
        schemaA:
          "Not at all. In fact, many people who join have never followed a structured strength training program before. Training Foundations was designed to teach you the fundamentals from the ground up, including movement mechanics, exercise form, and how to progress safely over time. You don't need experience, you just need a willingness to learn.",
      },
      {
        q: "What makes The Lisa Fit Method different from other fitness programs?",
        a: "Most fitness programs tell you what to do. I want you to understand why you're doing it. After a serious back injury forced me to rebuild my own training from scratch, I became obsessed with learning what actually drives results and what is mostly noise. That experience shaped everything I teach. Instead of relying on quick fixes or random workouts, you'll learn the principles behind strength training, nutrition, movement quality, and progressive overload so you can continue making progress long after a program ends.",
        schemaA:
          "Most fitness programs tell you what to do. I want you to understand why you're doing it. After a serious back injury forced me to rebuild my own training from scratch, I became obsessed with learning what actually drives results and what is mostly noise. That experience shaped everything I teach. Instead of relying on quick fixes or random workouts, you'll learn the principles behind strength training, nutrition, movement quality, and progressive overload so you can continue making progress long after a program ends.",
      },
    ],
  },
  {
    label: "Training & Results",
    items: [
      {
        q: "Will I build muscle?",
        a: "Yes, if you train consistently, challenge yourself over time, and support your training with proper nutrition. Building muscle doesn't require complicated workouts. It requires a structured plan, progressive overload, adequate recovery, and enough protein. The Lisa Fit Method is designed around those fundamentals because they're the things that actually produce results.",
        schemaA:
          "Yes, if you train consistently, challenge yourself over time, and support your training with proper nutrition. Building muscle doesn't require complicated workouts. It requires a structured plan, progressive overload, adequate recovery, and enough protein. The Lisa Fit Method is designed around those fundamentals because they're the things that actually produce results.",
      },
      {
        q: "Is this good for weight loss and fat loss?",
        a: "Yes, but my focus is body composition rather than simply making the number on the scale go down. Most people don't just want to lose weight. They want to lose fat, build lean muscle, feel stronger, and look better. Strength training plays a huge role in that process, and when combined with sound nutrition habits, it creates results that are far easier to maintain long term than extreme diets or endless cardio.",
        schemaA:
          "Yes, but my focus is body composition rather than simply making the number on the scale go down. Most people don't just want to lose weight. They want to lose fat, build lean muscle, feel stronger, and look better. Strength training plays a huge role in that process, and when combined with sound nutrition habits, it creates results that are far easier to maintain long term than extreme diets or endless cardio.",
      },
      {
        q: "What is progressive overload and why does it matter?",
        a: "Progressive overload is the principle that your body adapts to the demands you place on it. If you continue asking your muscles to do the exact same thing every week, eventually they stop changing. Real progress happens when you gradually increase the challenge through more weight, more reps, improved technique, or greater training volume. It's one of the most important concepts in fitness and the foundation of every effective strength training program.",
        schemaA:
          "Progressive overload is the principle that your body adapts to the demands you place on it. If you continue asking your muscles to do the exact same thing every week, eventually they stop changing. Real progress happens when you gradually increase the challenge through more weight, more reps, improved technique, or greater training volume. It's one of the most important concepts in fitness and the foundation of every effective strength training program.",
      },
      {
        q: "What age group is this designed for?",
        a: "The Lisa Fit Method is designed for adults of all ages who want to get stronger, move better, and build sustainable habits.",
        schemaA:
          "The Lisa Fit Method is designed for adults of all ages who want to get stronger, move better, and build sustainable habits.",
      },
      {
        q: "What if I am intimidated by the gym?",
        a: "You're not alone. Most people feel that way at some point. In my experience, gym anxiety usually comes from not knowing what to do or worrying about doing it wrong. That's why education is such a big part of what I teach. When you walk into a gym with a clear plan, understand the exercises, and know what you're trying to accomplish, confidence tends to follow naturally.",
        schemaA:
          "You're not alone. Most people feel that way at some point. In my experience, gym anxiety usually comes from not knowing what to do or worrying about doing it wrong. That's why education is such a big part of what I teach. When you walk into a gym with a clear plan, understand the exercises, and know what you're trying to accomplish, confidence tends to follow naturally.",
      },
      {
        q: "Can I combine training with cardio?",
        a: "Absolutely. Strength training and cardio complement each other very well when programmed intelligently. Walking, cycling, swimming, hiking, or any form of cardio you enjoy can be a great addition to your routine. I generally recommend treating strength training as the priority and using cardio to support your overall health, fitness, and recovery.",
        schemaA:
          "Absolutely. Strength training and cardio complement each other very well when programmed intelligently. Walking, cycling, swimming, hiking, or any form of cardio you enjoy can be a great addition to your routine. I generally recommend treating strength training as the priority and using cardio to support your overall health, fitness, and recovery.",
      },
    ],
  },
  {
    label: "Nutrition",
    items: [
      {
        q: "Can I start with nutrition before training?",
        a: (
          <>
            Yes.{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            {" "}is designed to stand on its own, so you can start there even if you&apos;re not currently following a training program. Many people choose to improve their nutrition habits first before focusing on strength training, while others work on both at the same time. There&apos;s no right answer. The best place to start is wherever you feel ready.
          </>
        ),
        schemaA:
          "Yes. Nutrition Foundations is designed to stand on its own, so you can start there even if you're not currently following a training program. Many people choose to improve their nutrition habits first before focusing on strength training, while others work on both at the same time. There's no right answer. The best place to start is wherever you feel ready.",
      },
      {
        q: "Do I need both Training Foundations and Nutrition Foundations?",
        a: (
          <>
            No. Each course provides value on its own and can help you make meaningful progress. That said, training and nutrition work best together. If your goal is to improve body composition, build muscle, lose fat, and create lasting habits, combining both gives you a more complete understanding of how the pieces fit together. The{" "}
            <Link href="/checkout?product=bundle" style={linkStyle}>Foundations Bundle</Link>
            {" "}is the most cost-effective way to get both.
          </>
        ),
        schemaA:
          "No. Each course provides value on its own and can help you make meaningful progress. That said, training and nutrition work best together. If your goal is to improve body composition, build muscle, lose fat, and create lasting habits, combining both gives you a more complete understanding of how the pieces fit together.",
      },
    ],
  },
  {
    label: "Programs & Access",
    items: [
      {
        q: "What equipment do I need?",
        a: "You don't need a fully equipped commercial gym to get started. Most exercises can be performed with a set of dumbbells and resistance bands, and alternatives are provided whenever possible. Whether you train at home or in a gym, the focus is on learning movement patterns and applying progressive overload, not chasing fancy equipment.",
        schemaA:
          "You don't need a fully equipped commercial gym to get started. Most exercises can be performed with a set of dumbbells and resistance bands, and alternatives are provided whenever possible. Whether you train at home or in a gym, the focus is on learning movement patterns and applying progressive overload, not chasing fancy equipment.",
      },
      {
        q: "Can I do this at home?",
        a: "Yes. Many people begin at home and get great results. The fundamental movement patterns don't change just because you're training outside a gym. As long as you have access to a few basic pieces of equipment, you can build strength, improve your technique, and develop confidence before ever stepping foot into a commercial gym.",
        schemaA:
          "Yes. Many people begin at home and get great results. The fundamental movement patterns don't change just because you're training outside a gym. As long as you have access to a few basic pieces of equipment, you can build strength, improve your technique, and develop confidence before ever stepping foot into a commercial gym.",
      },
      {
        q: "How long do I have access?",
        a: "Once you purchase a course, it's yours. There are no subscriptions, recurring fees, or expiration dates. You can revisit the lessons, exercise videos, and materials whenever you need them, whether that's next week or several years from now.",
        schemaA:
          "Once you purchase a course, it's yours. There are no subscriptions, recurring fees, or expiration dates. You can revisit the lessons, exercise videos, and materials whenever you need them, whether that's next week or several years from now.",
      },
      {
        q: "What happens after I finish the program?",
        a: "Run it again. Most people are surprised by how much stronger, more skilled, and more confident they feel the second time through. The goal was never to complete a short challenge and move on. The goal is to learn principles and habits you can continue applying for years. Many people repeat Training Foundations multiple times before they ever need something more advanced.",
        schemaA:
          "Run it again. Most people are surprised by how much stronger, more skilled, and more confident they feel the second time through. The goal was never to complete a short challenge and move on. The goal is to learn principles and habits you can continue applying for years. Many people repeat Training Foundations multiple times before they ever need something more advanced.",
      },
    ],
  },
  {
    label: "Coaching",
    items: [
      {
        q: "What is the difference between courses and coaching?",
        a: "The courses are designed to teach you the principles, systems, and habits that drive results so you can apply them independently. Coaching is much more personalized. I create a custom plan based on your goals, training history, lifestyle, and individual needs, then provide ongoing guidance, feedback, and accountability along the way.",
        schemaA:
          "The courses are designed to teach you the principles, systems, and habits that drive results so you can apply them independently. Coaching is much more personalized. I create a custom plan based on your goals, training history, lifestyle, and individual needs, then provide ongoing guidance, feedback, and accountability along the way.",
      },
      {
        q: "How do I know if 1:1 coaching is right for me?",
        a: (
          <>
            If you have a specific goal, an injury history, a unique situation that requires a customized approach, or simply want direct support and accountability, coaching may be the right fit. For most people, however, I recommend starting with a course first. It provides a strong foundation and helps you get far more value out of coaching if you decide to pursue it later.{" "}
            <Link href="/coaching" style={linkStyle}>Learn more about coaching.</Link>
          </>
        ),
        schemaA:
          "If you have a specific goal, an injury history, a unique situation that requires a customized approach, or simply want direct support and accountability, coaching may be the right fit. For most people, however, I recommend starting with a course first. It provides a strong foundation and helps you get far more value out of coaching if you decide to pursue it later.",
      },
    ],
  },
]

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
