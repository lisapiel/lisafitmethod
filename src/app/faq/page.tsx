import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ | Beginner Strength Training Questions Answered | Lisa Fit Method",
  description:
    "Answers to the most common questions about Training Foundations: what equipment you need, whether it works for weight loss, how progressive overload works, what happens after the program ends, and more.",
  openGraph: {
    title: "FAQ | Beginner Strength Training Questions Answered | Lisa Fit Method",
    description:
      "Everything you want to know before starting a beginner strength training program. Equipment, schedules, results, refunds, and more.",
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

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What exactly is Training Foundations?",
    a: (
      <>
        Training Foundations is a complete online{" "}
        <Link href="/courses" style={linkStyle}>strength training course for beginners</Link>
        {" "}and people returning to exercise after a break. It teaches the five foundational movement patterns every strong body is built on: squat, hinge, push, pull, and carry. You get 50+ exercise videos with detailed form coaching, a fully structured 3-day weekly program with sets, reps, warm-ups, and progressive overload guidance built in, and a workout tracking system so you can log every session and see exactly how much stronger you are getting over time. One payment, lifetime access, no subscription.
      </>
    ),
    schemaA:
      "Training Foundations is a complete online strength training course for beginners and people returning to exercise after a break. It teaches the five foundational movement patterns every strong body is built on: squat, hinge, push, pull, and carry. You get 50+ exercise videos with detailed form coaching, a fully structured 3-day weekly program with sets, reps, warm-ups, and progressive overload guidance built in, and a workout tracking system so you can log every session and see exactly how much stronger you are getting over time. One payment, lifetime access, no subscription.",
  },
  {
    q: "Who is this program designed for?",
    a: (
      <>
        This program is built for people who are brand new to strength training, returning after a long break, or who have been exercising inconsistently and want to build a proper foundation. If you have tried random workout videos before but never felt like you were actually learning anything, or you have avoided the gym because you were not sure what to do, this is the program for you. It is also a strong fit for people rebuilding after an injury, postpartum, or after years of doing cardio-only workouts who now want to add real strength work. Read more{" "}
        <Link href="/about" style={linkStyle}>about Lisa and why she built this</Link>.
      </>
    ),
    schemaA:
      "This program is built for people who are brand new to strength training, returning after a long break, or who have been exercising inconsistently and want to build a proper foundation. If you have tried random workout videos before but never felt like you were actually learning anything, or you have avoided the gym because you were not sure what to do, this is the program for you. It is also a strong fit for people rebuilding after an injury, postpartum, or after years of doing cardio-only workouts who now want to add real strength work.",
  },
  {
    q: "What if I have never lifted weights before?",
    a: "That is exactly who this was built for. You do not need any prior experience with weights, machines, or the gym. The program starts with the foundational movement patterns: how to squat without knee pain, how to hinge properly for deadlifts, how to push and pull with good shoulder mechanics. Every exercise has a detailed video showing proper form, breathing, and what you should feel working. Most people say the form tutorials alone changed the way they move and think about training, even before they started the structured program.",
    schemaA:
      "That is exactly who this was built for. You do not need any prior experience with weights, machines, or the gym. The program starts with the foundational movement patterns: how to squat without knee pain, how to hinge properly for deadlifts, how to push and pull with good shoulder mechanics. Every exercise has a detailed video showing proper form, breathing, and what you should feel working. Most people say the form tutorials alone changed the way they move and think about training, even before they started the structured program.",
  },
  {
    q: "What equipment do I need?",
    a: "Most of the program can be done with a set of dumbbells and a resistance band. If you are training at a gym, you will have access to everything the program uses. If you are training at home, adjustable dumbbells and a couple of bands cover the vast majority of movements. The program notes equipment alternatives throughout so you can always find a workable substitute. You do not need a full home gym or any specialty equipment to get started.",
    schemaA:
      "Most of the program can be done with a set of dumbbells and a resistance band. If you are training at a gym, you will have access to everything the program uses. If you are training at home, adjustable dumbbells and a couple of bands cover the vast majority of movements. The program notes equipment alternatives throughout so you can always find a workable substitute. You do not need a full home gym or any specialty equipment to get started.",
  },
  {
    q: "Can I do this at home?",
    a: "Yes. The program was designed to work in both gym and home settings. Many of the exercises can be done with dumbbells and resistance bands, which you can easily have at home. The modules clearly note which variations work best at home versus at the gym. If you decide to transition to a gym later, the foundational movement patterns you built at home carry over directly.",
    schemaA:
      "Yes. The program was designed to work in both gym and home settings. Many of the exercises can be done with dumbbells and resistance bands, which you can easily have at home. The modules clearly note which variations work best at home versus at the gym. If you decide to transition to a gym later, the foundational movement patterns you built at home carry over directly.",
  },
  {
    q: "Is this program good for weight loss?",
    a: (
      <>
        Strength training is one of the most effective long-term tools for weight management, and here is why. Building muscle increases your resting metabolic rate, which means your body burns more calories even when you are not exercising. Training Foundations does not promise quick fat loss, but it builds the physical foundation that makes sustainable weight loss far more achievable. Your body composition changes when you gain muscle and reduce body fat at the same time, and that combination produces the results most people are actually after. If fat loss is a primary goal, pairing this program with the{" "}
        <Link href="/nutrition" style={linkStyle}>Nutrition Foundations course</Link>
        {" "}gives you the complete picture: a training system that builds strength alongside a nutrition framework that supports a healthy calorie deficit without obsessing over food.
      </>
    ),
    schemaA:
      "Strength training is one of the most effective long-term tools for weight management, and here is why. Building muscle increases your resting metabolic rate, which means your body burns more calories even when you are not exercising. Training Foundations does not promise quick fat loss, but it builds the physical foundation that makes sustainable weight loss far more achievable. If fat loss is a primary goal, pairing this program with Nutrition Foundations gives you the complete picture: a training system that builds strength alongside a nutrition framework that supports a healthy calorie deficit without obsessing over food.",
  },
  {
    q: "Will I build muscle with this program?",
    a: (
      <>
        Yes, if you follow the program consistently and eat enough protein to support recovery. Muscle building requires progressive overload, adequate training volume, and nutrition that gives your body what it needs to grow. Training Foundations is built around all three. The structured progressive overload guidance tells you exactly how and when to increase the challenge each week. If you want to optimize results on the nutrition side, the{" "}
        <Link href="/nutrition" style={linkStyle}>Nutrition Foundations course</Link>
        {" "}covers protein targets, calorie strategy, and how to build a meal plan that matches your training.
      </>
    ),
    schemaA:
      "Yes, if you follow the program consistently and eat enough protein to support recovery. Muscle building requires progressive overload, adequate training volume, and nutrition that gives your body what it needs to grow. Training Foundations is built around all three. The structured progressive overload guidance tells you exactly how and when to increase the challenge each week. If you want to optimize results on the nutrition side, the Nutrition Foundations course covers protein targets, calorie strategy, and how to build a meal plan that matches your training.",
  },
  {
    q: "What makes progressive overload so important?",
    a: "Progressive overload is the core principle behind any real strength or muscle-building progress. It means you are gradually increasing the demands on your body over time, whether by adding weight, completing more reps, or reducing rest time. Without it, your body adapts to the same workout and stops changing. This is why most people who follow random workout routines plateau after a few weeks and never actually get stronger. Training Foundations has progressive overload built directly into the program structure. You always know exactly what you should be working toward in the next session, which is what drives results over months, not just weeks.",
    schemaA:
      "Progressive overload is the core principle behind any real strength or muscle-building progress. It means you are gradually increasing the demands on your body over time, whether by adding weight, completing more reps, or reducing rest time. Without it, your body adapts to the same workout and stops changing. This is why most people who follow random workout routines plateau after a few weeks and never actually get stronger. Training Foundations has progressive overload built directly into the program structure. You always know exactly what you should be working toward in the next session, which is what drives results over months, not just weeks.",
  },
  {
    q: "What age group is this designed for?",
    a: "Training Foundations is designed for adults of all ages who want to build a proper strength foundation. The emphasis on movement quality, joint mechanics, and smart progression makes it a particularly good fit for people in their 30s, 40s, 50s, and beyond who want to train intelligently rather than grinding through high-intensity classes that leave them wrecked for days. Many of the people who get the most out of this program have dealt with past injuries, chronic back pain, or years of avoiding the gym because nothing they tried felt right for their body.",
    schemaA:
      "Training Foundations is designed for adults of all ages who want to build a proper strength foundation. The emphasis on movement quality, joint mechanics, and smart progression makes it a particularly good fit for people in their 30s, 40s, 50s, and beyond who want to train intelligently rather than grinding through high-intensity classes that leave them wrecked for days.",
  },
  {
    q: "What if I am intimidated by the gym?",
    a: "You are not alone in that. A lot of people feel exactly this way, especially at the start. What this program does is give you specific, clear knowledge about what to do when you walk in: which exercises, in what order, with what form, for how many sets and reps. That knowledge alone dramatically reduces the anxiety most beginners feel. When you walk in with a real program and know what each movement should look and feel like, the gym stops being overwhelming. You also have the option to start the first few weeks at home to build confidence before you ever walk into a gym.",
    schemaA:
      "You are not alone in that. A lot of people feel exactly this way, especially at the start. What this program does is give you specific, clear knowledge about what to do when you walk in: which exercises, in what order, with what form, for how many sets and reps. That knowledge alone dramatically reduces the anxiety most beginners feel. You also have the option to start the first few weeks at home to build confidence before you ever walk into a gym.",
  },
  {
    q: "Can I combine this with cardio?",
    a: "Yes. Strength training and cardio work well together when you plan them sensibly. The program runs 3 days per week, which leaves plenty of room for walking, cycling, swimming, or whatever form of cardio you enjoy. One practical note: doing a heavy cardio session immediately before a strength session tends to reduce your performance and slow recovery. Keeping them on separate days, or doing lighter cardio on your rest days, works best for most people just starting out.",
    schemaA:
      "Yes. Strength training and cardio work well together when you plan them sensibly. The program runs 3 days per week, which leaves plenty of room for walking, cycling, swimming, or whatever form of cardio you enjoy. One practical note: doing a heavy cardio session immediately before a strength session tends to reduce your performance and slow recovery. Keeping them on separate days, or doing lighter cardio on your rest days, works best for most people just starting out.",
  },
  {
    q: "How long do I have access?",
    a: "You keep it forever. One payment, no subscription, no expiry date. You can come back to the exercise videos, the workout tracker, and all the program content any time you want. This is intentional: most people run the 4-week program, take a short break, and then come back and run it again with heavier weights and sharper form. Having permanent access means you can treat this as your foundational training system for as long as it serves you.",
    schemaA:
      "You keep it forever. One payment, no subscription, no expiry date. You can come back to the exercise videos, the workout tracker, and all the program content any time you want. This is intentional: most people run the 4-week program, take a short break, and then come back and run it again with heavier weights and sharper form.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. If you go through the program and genuinely feel you did not get value from it, reach out within 30 days of your purchase. We review things case by case and will work something out. The program delivers results when you follow it, and the vast majority of people who complete it are glad they did. But we are not interested in keeping money from someone who tried in good faith and found it was not the right fit for them.",
    schemaA:
      "Yes. If you go through the program and genuinely feel you did not get value from it, reach out within 30 days of your purchase. We review things case by case and will work something out. We are not interested in keeping money from someone who tried in good faith and found it was not the right fit for them.",
  },
  {
    q: "What happens after I finish the program?",
    a: (
      <>
        Run it again. The 4-week structure is designed to be repeatable. The second time through, you will use heavier weights, your form will be sharper, and you will be able to see clearly how much stronger you have gotten. Many members run the program 3 or 4 times in a row before they need more complexity. When you are ready to go beyond the foundational structure,{" "}
        <Link href="/coaching" style={linkStyle}>1:1 coaching with Lisa</Link>
        {" "}gives you a fully custom program built around your specific goals, your schedule, and where your training currently stands.
      </>
    ),
    schemaA:
      "Run it again. The 4-week structure is designed to be repeatable. The second time through, you will use heavier weights, your form will be sharper, and you will be able to see clearly how much stronger you have gotten. Many members run the program 3 or 4 times in a row before they need more complexity. When you are ready to go beyond the foundational structure, 1:1 coaching with Lisa gives you a fully custom program built around your specific goals, your schedule, and where your training currently stands.",
  },
  {
    q: "How is this different from free YouTube workouts or fitness apps?",
    a: (
      <>
        Most free workouts are designed to make you feel tired, not to make you better. They do not teach you why you are doing each movement, how to progress over time, or how to connect what you do in the gym to how your body actually works. Training Foundations is a structured course built by{" "}
        <Link href="/about" style={linkStyle}>a certified personal trainer</Link>
        {" "}who rebuilt her own training from scratch after a serious back injury. You are learning foundational movement patterns with detailed coaching, following a program built around progressive overload, and developing the understanding that makes every workout you ever do more effective. People who follow random workout routines for months often look and feel the same at the end as at the beginning. Structure and progressive loading are what actually change things.
      </>
    ),
    schemaA:
      "Most free workouts are designed to make you feel tired, not to make you better. They do not teach you why you are doing each movement, how to progress over time, or how to connect what you do in the gym to how your body actually works. Training Foundations is a structured course built by a certified personal trainer who rebuilt her own training from scratch after a serious back injury. You are learning foundational movement patterns with detailed coaching, following a program built around progressive overload, and developing the understanding that makes every workout you ever do more effective. People who follow random workout routines for months often look and feel the same at the end as at the beginning. Structure and progressive loading are what actually change things.",
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
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
              .faq-cta-inner { flex-direction: column !important; gap: 20px !important; padding: 48px 28px !important; }
              .faq-cta-card { width: 100% !important; }
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
              Common questions about Training Foundations.
            </h1>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(15px, 2vw, 17px)",
              color: muted,
              lineHeight: 1.75,
              maxWidth: 640,
            }}>
              Training Foundations is a beginner strength training program for people who want to learn how to lift properly, follow a structured workout plan, and build real, lasting strength. Whether you are starting from scratch, returning after time away, or finally ready to stop guessing in the gym, this page covers everything people ask us before they sign up.
            </p>
          </div>
        </section>

        {/* FAQ ITEMS */}
        <section className="faq-content" style={{ padding: "72px 80px 100px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ maxWidth: 740, margin: "0 auto" }}>
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  paddingTop: i === 0 ? 0 : 40,
                  paddingBottom: 40,
                  borderBottom: i < FAQ_ITEMS.length - 1 ? `1px solid ${divider}` : "none",
                }}
              >
                <h2 style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  fontWeight: 600,
                  color: "#0a0a0a",
                  lineHeight: 1.35,
                  marginBottom: 16,
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
        </section>

        {/* BOTTOM CTA */}
        <section style={{ background: "#0a0a0a", padding: "80px 80px" }}>
          <div className="faq-cta-inner" style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: gold,
              marginBottom: 20,
              textAlign: "center",
            }}>
              Ready to get started?
            </p>
            <h2 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 700,
              color: "#f5f2ee",
              lineHeight: 1.15,
              textAlign: "center",
              marginBottom: 16,
            }}>
              Two courses. One complete foundation.
            </h2>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 15,
              color: "rgba(245,242,238,0.5)",
              lineHeight: 1.7,
              textAlign: "center",
              maxWidth: 540,
              margin: "0 auto 52px",
            }}>
              Start with the training, the nutrition, or both together. Every option is a one-time payment with lifetime access.
            </p>
            <div className="faq-cta-inner" style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>

              {/* Training card */}
              <div className="faq-cta-card" style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                padding: "36px 32px",
                borderTop: `3px solid ${gold}`,
                flex: "1",
                minWidth: 260,
                maxWidth: 360,
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
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 12,
                }}>
                  Learn to lift. Build real strength.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.6,
                  marginBottom: 28,
                }}>
                  50+ exercise videos, a structured 4-week program, progressive overload guidance, and built-in workout tracking.
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
                    padding: "14px 24px",
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
                    color: "rgba(245,242,238,0.35)",
                    textDecoration: "none",
                    textAlign: "center",
                    letterSpacing: "0.1em",
                    padding: "6px 0",
                  }}
                >
                  See what&apos;s included →
                </Link>
              </div>

              {/* Nutrition card */}
              <div className="faq-cta-card" style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                padding: "36px 32px",
                borderTop: `3px solid ${gold}`,
                flex: "1",
                minWidth: 260,
                maxWidth: 360,
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
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 12,
                }}>
                  Eat to match your training.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.6,
                  marginBottom: 28,
                }}>
                  TDEE calculator, 4-week meal plan, macro education, and real-world nutrition strategies for people who train.
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
                    padding: "14px 24px",
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
                    color: "rgba(245,242,238,0.35)",
                    textDecoration: "none",
                    textAlign: "center",
                    letterSpacing: "0.1em",
                    padding: "6px 0",
                  }}
                >
                  See what&apos;s included →
                </Link>
              </div>

              {/* Bundle card */}
              <div className="faq-cta-card" style={{
                background: "#141414",
                border: `1px solid rgba(200,169,126,0.3)`,
                padding: "36px 32px",
                borderTop: `3px solid ${gold}`,
                flex: "1",
                minWidth: 260,
                maxWidth: 360,
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
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#f5f2ee",
                  lineHeight: 1.3,
                  marginBottom: 12,
                }}>
                  Both courses together. Save $37.
                </p>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(245,242,238,0.4)",
                  lineHeight: 1.6,
                  marginBottom: 28,
                }}>
                  Everything in Training Foundations plus everything in Nutrition Foundations. The complete system at the best price.
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
                    padding: "14px 24px",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  Get Both Courses
                </Link>
                <p style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 11,
                  color: "rgba(245,242,238,0.25)",
                  textAlign: "center",
                  padding: "6px 0",
                }}>
                  One-time payment. Lifetime access.
                </p>
              </div>

            </div>

            <p style={{
              marginTop: 48,
              textAlign: "center",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 13,
              color: "rgba(245,242,238,0.3)",
              lineHeight: 1.6,
            }}>
              Still have a question that is not answered here?{" "}
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
