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
        a: (
          <>
            The Lisa Fit Method is an evidence-based fitness education platform built around one idea: most people fail at training not because they lack willpower, but because no one ever properly taught them how.{" "}
            <Link href="/about" style={linkStyle}>Lisa McPherson</Link>
            {" "}is a certified personal trainer who rebuilt her own training from scratch after a serious back injury. That experience shaped everything here. The platform teaches you how your body works, how to move correctly, how to eat in a way that supports your goals, and how to train in a way that keeps working for years, not just weeks. Courses and coaching are the products, but the real goal is to give you the knowledge and confidence to train independently, for life.
          </>
        ),
        schemaA:
          "The Lisa Fit Method is an evidence-based fitness education platform built around one idea: most people fail at training not because they lack willpower, but because no one ever properly taught them how. Lisa McPherson is a certified personal trainer who rebuilt her own training from scratch after a serious back injury. That experience shaped everything here. The platform teaches you how your body works, how to move correctly, how to eat in a way that supports your goals, and how to train in a way that keeps working for years, not just weeks. Courses and coaching are the products, but the real goal is to give you the knowledge and confidence to train independently, for life.",
      },
      {
        q: "Who is The Lisa Fit Method for?",
        a: (
          <>
            It is built for adults who want to build strength, improve their body composition, and finally understand how training and nutrition actually work. The typical member falls somewhere between completely new to the gym and frustrated that nothing they have tried has produced consistent results. That includes people who have been going to the gym inconsistently for years without real progress, people returning after an injury or a long break, people who know they need to strength train but feel intimidated and do not know where to start, and people who are tired of workout videos that make them sweat without ever actually teaching them anything.{" "}
            <Link href="/about" style={linkStyle}>Read more about Lisa and why she built this.</Link>
          </>
        ),
        schemaA:
          "It is built for adults who want to build strength, improve their body composition, and finally understand how training and nutrition actually work. The typical member falls somewhere between completely new to the gym and frustrated that nothing they have tried has produced consistent results. That includes people who have been going to the gym inconsistently for years without real progress, people returning after an injury or a long break, people who know they need to strength train but feel intimidated and do not know where to start, and people who are tired of workout videos that make them sweat without ever actually teaching them anything.",
      },
      {
        q: "Which course should I start with?",
        a: (
          <>
            If you are new to strength training, returning after a break, or just want to finally learn how to lift correctly, start with{" "}
            <Link href="/courses" style={linkStyle}>Training Foundations</Link>
            . It is the core of the platform. It teaches the foundational movement patterns, gives you a structured program, and builds the strength base that everything else grows from. If your priority right now is understanding nutrition for fat loss or muscle building, start with{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            . The two courses complement each other and work well together, but neither requires the other as a starting point. If you want both, the{" "}
            <Link href="/checkout?product=bundle" style={linkStyle}>Foundations Bundle</Link>
            {" "}is the most cost-effective way to get the complete system.
          </>
        ),
        schemaA:
          "If you are new to strength training, returning after a break, or just want to finally learn how to lift correctly, start with Training Foundations. It is the core of the platform. It teaches the foundational movement patterns, gives you a structured program, and builds the strength base that everything else grows from. If your priority right now is understanding nutrition for fat loss or muscle building, start with Nutrition Foundations. The two courses complement each other and work well together, but neither requires the other as a starting point. If you want both, the Foundations Bundle is the most cost-effective way to get the complete system.",
      },
      {
        q: "Do I need gym experience to start?",
        a: "No. The courses are built from the ground up for people with no prior lifting experience. Training Foundations starts with the foundational movement patterns before any real weight is added. You learn how to squat correctly, how to hinge for deadlifts without lower back pain, how to push and pull with good shoulder mechanics, and how to brace your core under load. Many members say the movement education alone changed the way they think about exercise, even before the structured program begins.",
        schemaA:
          "No. The courses are built from the ground up for people with no prior lifting experience. Training Foundations starts with the foundational movement patterns before any real weight is added. You learn how to squat correctly, how to hinge for deadlifts without lower back pain, how to push and pull with good shoulder mechanics, and how to brace your core under load. Many members say the movement education alone changed the way they think about exercise, even before the structured program begins.",
      },
      {
        q: "What makes The Lisa Fit Method different from other fitness programs?",
        a: (
          <>
            Most fitness content tells you what to do. The Lisa Fit Method teaches you why. The difference matters because understanding the mechanics behind a movement makes you better at it, more consistent with it, and far less likely to get injured doing it. Lisa built this platform after a serious back injury that forced her to relearn movement from first principles. That experience gives the coaching a specificity you rarely find in general fitness content: precise form cues, clear explanations of what should be working and what should not, and honest guidance about what actually drives long-term progress. The goal is not to keep you dependent on a program. It is to give you enough understanding that you can train intelligently, independently, and confidently for the rest of your life.{" "}
            <Link href="/about" style={linkStyle}>Read more about the methodology.</Link>
          </>
        ),
        schemaA:
          "Most fitness content tells you what to do. The Lisa Fit Method teaches you why. The difference matters because understanding the mechanics behind a movement makes you better at it, more consistent with it, and far less likely to get injured doing it. Lisa built this platform after a serious back injury that forced her to relearn movement from first principles. That experience gives the coaching a specificity you rarely find in general fitness content: precise form cues, clear explanations of what should be working and what should not, and honest guidance about what actually drives long-term progress. The goal is not to keep you dependent on a program. It is to give you enough understanding that you can train intelligently, independently, and confidently for the rest of your life.",
      },
    ],
  },
  {
    label: "Training & Results",
    items: [
      {
        q: "Will I build muscle?",
        a: (
          <>
            Yes, if you train consistently, apply progressive overload, and eat enough to support recovery. All three matter. Our training courses are built around all three. Progressive overload is structured directly into the program so you always know what you should be working toward in the next session. For the nutrition side,{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            {" "}covers protein targets, calorie strategy, and how to build a meal plan aligned with a muscle-building goal.
          </>
        ),
        schemaA:
          "Yes, if you train consistently, apply progressive overload, and eat enough to support recovery. All three matter. Our training courses are built around all three. Progressive overload is structured directly into the program so you always know what you should be working toward in the next session. Nutrition Foundations covers protein targets, calorie strategy, and how to build a meal plan aligned with a muscle-building goal.",
      },
      {
        q: "Is this good for weight loss and fat loss?",
        a: (
          <>
            Strength training is one of the most effective long-term tools for body composition change. Building muscle raises your resting metabolic rate, which means your body burns more calories even at rest. Our training courses do not promise rapid fat loss, but they build the physical foundation that makes sustainable fat loss more achievable and the results more lasting. If reducing body fat is a primary goal, pairing a training program with{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            {" "}gives you the complete picture: a strength system alongside a nutrition framework that supports a healthy calorie deficit without obsessing over food.
          </>
        ),
        schemaA:
          "Strength training is one of the most effective long-term tools for body composition change. Building muscle raises your resting metabolic rate, which means your body burns more calories even at rest. Our training courses do not promise rapid fat loss, but they build the physical foundation that makes sustainable fat loss more achievable and the results more lasting. Pairing a training program with Nutrition Foundations gives you the complete picture: a strength system alongside a nutrition framework that supports a healthy calorie deficit without obsessing over food.",
      },
      {
        q: "What is progressive overload and why does it matter?",
        a: "Progressive overload is the principle that your body adapts to whatever you consistently ask it to do. If you repeat the same workout at the same weight every week, your body adapts to that demand and stops changing. Progress requires gradually increasing the challenge: more weight, more reps, less rest, or more volume over time. This is the mechanism behind every real strength or muscle-building result. It is also why most people who follow random workout routines plateau after a few weeks and stay stuck. Progressive overload is not an optional upgrade. It is the actual mechanism. All of our training programs are built around it from the first session.",
        schemaA:
          "Progressive overload is the principle that your body adapts to whatever you consistently ask it to do. If you repeat the same workout at the same weight every week, your body adapts to that demand and stops changing. Progress requires gradually increasing the challenge: more weight, more reps, less rest, or more volume over time. This is the mechanism behind every real strength or muscle-building result. It is also why most people who follow random workout routines plateau after a few weeks and stay stuck. All of our training programs are built around progressive overload from the first session.",
      },
      {
        q: "What age group is this designed for?",
        a: "Our courses and coaching work well for adults at any age. The emphasis on movement quality, joint mechanics, and intelligent progression makes them a particularly strong fit for people in their 30s, 40s, 50s, and beyond who want to train thoughtfully rather than grinding through high-intensity classes that leave them wrecked for days. A significant portion of the people who get the most out of our training course have dealt with past injuries, chronic back pain, or years of avoiding the gym because nothing they tried felt right for their body.",
        schemaA:
          "Our courses and coaching work well for adults at any age. The emphasis on movement quality, joint mechanics, and intelligent progression makes them a particularly strong fit for people in their 30s, 40s, 50s, and beyond who want to train thoughtfully rather than grinding through high-intensity classes that leave them wrecked for days. A significant portion of the people who get the most out of our training course have dealt with past injuries, chronic back pain, or years of avoiding the gym because nothing they tried felt right for their body.",
      },
      {
        q: "What if I am intimidated by the gym?",
        a: "That is a very common feeling, and the good news is that knowledge fixes most of it. Gym intimidation almost always comes down to not knowing what to do or whether you are doing it correctly. Our courses give you a specific plan: which exercises, in what order, with what form cues, for how many sets and reps. When you walk in with a real program and a clear understanding of what each movement should feel and look like, the environment stops feeling overwhelming. You also have the option to start the first few weeks at home to build confidence and movement quality before you ever step into a gym.",
        schemaA:
          "That is a very common feeling, and the good news is that knowledge fixes most of it. Gym intimidation almost always comes down to not knowing what to do or whether you are doing it correctly. Our courses give you a specific plan: which exercises, in what order, with what form cues, for how many sets and reps. When you walk in with a real program and a clear understanding of what each movement should feel and look like, the environment stops feeling overwhelming. You also have the option to start the first few weeks at home to build confidence and movement quality before you ever step into a gym.",
      },
      {
        q: "Can I combine training with cardio?",
        a: "Yes. Our training programs run three days per week, which leaves plenty of room for cardio on your other days. One practical note: doing a long or intense cardio session immediately before a strength session reduces your performance and slows recovery. Keeping cardio and strength work on separate days, or doing lighter cardio on rest days, tends to work better, especially when you are starting out. Walking, cycling, swimming, or whatever form of cardio you enjoy is a healthy complement to strength training.",
        schemaA:
          "Yes. Our training programs run three days per week, which leaves plenty of room for cardio on your other days. One practical note: doing a long or intense cardio session immediately before a strength session reduces your performance and slows recovery. Keeping cardio and strength work on separate days, or doing lighter cardio on rest days, tends to work better, especially when you are starting out.",
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
            {" "}is a standalone course and does not require you to be doing any specific training program at the same time. If improving your eating habits feels more urgent right now, or if you want to understand nutrition before tackling the gym, starting there is a perfectly reasonable approach. The two courses are designed to complement each other over time, but you do not have to start both at once.
          </>
        ),
        schemaA:
          "Yes. Nutrition Foundations is a standalone course and does not require you to be doing any specific training program at the same time. If improving your eating habits feels more urgent right now, or if you want to understand nutrition before tackling the gym, starting there is a perfectly reasonable approach. The two courses are designed to complement each other over time, but you do not have to start both at once.",
      },
      {
        q: "Do I need both Training Foundations and Nutrition Foundations?",
        a: (
          <>
            No. Each course works on its own.{" "}
            <Link href="/courses" style={linkStyle}>Training Foundations</Link>
            {" "}gives you the full strength training system.{" "}
            <Link href="/nutrition" style={linkStyle}>Nutrition Foundations</Link>
            {" "}gives you the full nutrition framework. You can follow either one independently and get real value. That said, training and nutrition reinforce each other significantly, and pairing them is the fastest path to body composition change. If both are relevant to your goals, the{" "}
            <Link href="/checkout?product=bundle" style={linkStyle}>Foundations Bundle</Link>
            {" "}is the most cost-effective way to get both, and neither course requires the other as a prerequisite.
          </>
        ),
        schemaA:
          "No. Each course works on its own. Training Foundations gives you the full strength training system. Nutrition Foundations gives you the full nutrition framework. You can follow either one independently and get real value. That said, training and nutrition reinforce each other significantly, and pairing them is the fastest path to body composition change. If both are relevant to your goals, the Foundations Bundle is the most cost-effective way to get both, and neither course requires the other as a prerequisite.",
      },
    ],
  },
  {
    label: "Programs & Access",
    items: [
      {
        q: "What equipment do I need?",
        a: "Most of the training program can be done with a set of dumbbells and a resistance band. If you train at a gym, everything the program calls for will be available. If you train at home, adjustable dumbbells and one or two resistance bands cover the vast majority of movements. Equipment alternatives are noted throughout the course so you can always find a workable substitute. You do not need a full home gym or specialty equipment to start.",
        schemaA:
          "Most of the training program can be done with a set of dumbbells and a resistance band. If you train at a gym, everything the program calls for will be available. If you train at home, adjustable dumbbells and one or two resistance bands cover the vast majority of movements. Equipment alternatives are noted throughout the course so you can always find a workable substitute. You do not need a full home gym or specialty equipment to start.",
      },
      {
        q: "Can I do this at home?",
        a: "Yes. Our training courses are designed to work in both gym and home settings. Most exercises have home-friendly variations using dumbbells and resistance bands. The program clearly notes which variations work best in each setting. If you decide to move from training at home to a gym at any point, the movement patterns and strength you built at home carry over directly.",
        schemaA:
          "Yes. Our training courses are designed to work in both gym and home settings. Most exercises have home-friendly variations using dumbbells and resistance bands. The program clearly notes which variations work best in each setting. If you decide to move from training at home to a gym at any point, the movement patterns and strength you built at home carry over directly.",
      },
      {
        q: "How long do I have access?",
        a: "Your access does not expire. One payment, no subscription, no end date. You can return to the exercise videos, the program structure, and all course materials at any time. This is intentional: our courses are designed to be used more than once. Most people run Training Foundations, take a short break, and then run it again with heavier weights and sharper form. Having permanent access means you can keep using the material for as long as it serves you.",
        schemaA:
          "Your access does not expire. One payment, no subscription, no end date. You can return to the exercise videos, the program structure, and all course materials at any time. Our courses are designed to be used more than once. Most people run Training Foundations, take a short break, and then run it again with heavier weights and sharper form. Having permanent access means you can keep using the material for as long as it serves you.",
      },
      {
        q: "Is there a refund policy?",
        a: "Yes. If you complete the program and genuinely feel it was not worth what you paid, reach out within 30 days of your purchase. We review situations individually and will work something out. The courses deliver results when followed, and the vast majority of people who complete them are glad they enrolled. But we are not in the business of keeping money from someone who made a genuine effort and found it was not the right fit.",
        schemaA:
          "Yes. If you complete the program and genuinely feel it was not worth what you paid, reach out within 30 days of your purchase. We review situations individually and will work something out. We are not in the business of keeping money from someone who made a genuine effort and found it was not the right fit.",
      },
      {
        q: "What happens after I finish the program?",
        a: (
          <>
            Run it again with more weight. The 4-week structure in Training Foundations is designed to be repeatable. The second and third time through, you will be lifting heavier, your form will be sharper, and your progress log will show you exactly how much stronger you have gotten. Most members run the program two or three times in a row before they want more complexity. When you are ready for individualized programming,{" "}
            <Link href="/coaching" style={linkStyle}>1:1 coaching with Lisa</Link>
            {" "}is the natural next step. She builds custom programs around your current level, your goals, your schedule, and how you have been progressing.
          </>
        ),
        schemaA:
          "Run it again with more weight. The 4-week structure in Training Foundations is designed to be repeatable. The second and third time through, you will be lifting heavier, your form will be sharper, and your progress log will show you exactly how much stronger you have gotten. Most members run the program two or three times in a row before they want more complexity. When you are ready for individualized programming, 1:1 coaching with Lisa is the natural next step.",
      },
    ],
  },
  {
    label: "Coaching",
    items: [
      {
        q: "What is the difference between courses and coaching?",
        a: (
          <>
            Our courses are structured self-paced education products. You access them on your own schedule, follow the program, and apply what you learn independently. Coaching is a direct, ongoing relationship with Lisa. She writes a fully custom program built around your specific situation, reviews your form, adjusts the plan as you progress, and checks in with you regularly.{" "}
            <Link href="/courses" style={linkStyle}>Courses</Link>
            {" "}are the right starting point for most people. Coaching is for people who want personalized programming, direct feedback, and accountability through something more specific than a general course can address.
          </>
        ),
        schemaA:
          "Our courses are structured self-paced education products. You access them on your own schedule, follow the program, and apply what you learn independently. Coaching is a direct, ongoing relationship with Lisa. She writes a fully custom program built around your specific situation, reviews your form, adjusts the plan as you progress, and checks in with you regularly. Courses are the right starting point for most people. Coaching is for people who want personalized programming, direct feedback, and accountability through something more specific than a general course can address.",
      },
      {
        q: "How do I know if 1:1 coaching is right for me?",
        a: (
          <>
            If you have a specific goal that needs a tailored approach, an injury history that requires individualized programming, or you simply want the accountability and direct feedback of working with a trainer, coaching is likely worth it. If you are newer to training and still building your foundation, starting with a course first usually makes more sense. The coursework teaches you enough that when you do start coaching, you and Lisa can have much more productive conversations about where you are and where you want to go.{" "}
            <Link href="/coaching" style={linkStyle}>Learn more about coaching.</Link>
          </>
        ),
        schemaA:
          "If you have a specific goal that needs a tailored approach, an injury history that requires individualized programming, or you simply want the accountability and direct feedback of working with a trainer, coaching is likely worth it. If you are newer to training and still building your foundation, starting with a course first usually makes more sense. The coursework teaches you enough that when you do start coaching, you and Lisa can have much more productive conversations about where you are and where you want to go.",
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
              The Lisa Fit Method is a fitness education platform built around evidence-based training and nutrition. It exists to teach people how to build strength, improve their body composition, and understand what they are doing well enough to keep progressing on their own. These are the questions people ask most before they start.
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
