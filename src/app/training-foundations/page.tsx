import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Introduction — Training Foundations | Lisa Fit Method",
}

export default function TrainingFoundationsIntroPage() {
  return (
    <>
      <div style={{ width: "100%", overflow: "hidden" }}>
        <Image
          src="/hero.png"
          alt="Lisa Fit Method — Foundations"
          width={1200}
          height={500}
          style={{ width: "100%", display: "block", objectFit: "cover" }}
        />
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
        <style>{`
          @media (max-width: 768px) {
            .course-body { padding: 2rem 1rem 6rem !important; }
          }
        `}</style>

        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#c9a96e",
            marginBottom: "0.75rem",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          Introduction
        </div>
        <h2
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 300,
            color: "#f0e6d3",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}
        >
          Why this guide exists
        </h2>

        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            A few years ago I was training hard, going to the gym consistently, and doing everything I thought was right.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>I wasn&apos;t.</p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            I was always cautious about my form, but I realize now that intent, tempo, and structure were just as important. I was skipping warm-ups because they felt like a waste of time. Stretching after workouts wasn&apos;t a priority either. My mobility work was inconsistent at best, and most of my training came from random workouts I found online with no real structure or logic behind them. I thought pushing more weight and working harder was the path to results. I was wrong about all of it.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>Then my back gave out.</p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            For almost a year I lived with serious back pain. I couldn&apos;t train the way I wanted to. Simple things like getting out of bed, sitting at a desk, or tying my shoes became genuinely uncomfortable. I had built my routine around the gym, and suddenly that was gone. That year taught me more about training than all the years before it combined.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            I had to relearn everything. Proper movement mechanics. How to actually warm up. Why mobility and recovery are not optional extras. How to eat in a way that supports training rather than works against it. How to build a program that makes sense. I became a certified personal trainer not just to help others, but because I needed to truly understand what I had been doing wrong.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            I rebuilt my body from the ground up. I became pain-free. I became stronger than I had ever been before. And I have maintained healthier habits consistently ever since, not through motivation or willpower, but through genuinely understanding why the right approach works.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            This guide is everything I wish someone had handed me before I started. It is not a shortcut. It is a foundation. The movements, the structure, the habits, and the knowledge that would have saved me a year of pain if I had learned them first.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>
            You don&apos;t need to learn the hard way. That&apos;s already been done.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.9 }}>Let&apos;s build something that lasts.</p>
          <br />
          <p
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontStyle: "italic",
              fontSize: "1.1rem",
              color: "#f0e6d3",
            }}
          >
            — Lisa McPherson
          </p>
        </div>

        <div
          style={{
            padding: "2rem",
            background: "#161616",
            border: "1px solid #2a2a2a",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: 500,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#c9a96e",
              marginBottom: "1rem",
              fontFamily: "var(--font-montserrat), sans-serif",
            }}
          >
            What you&apos;ll have by the end
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              "A clear understanding of the 5 foundational movements every lifter needs",
              "A targeted core and glute training approach that protects your back",
              "A complete 4-week beginner program with sets, reps, and rest",
              "A warm-up and mobility routine you'll actually use",
              "Simple nutrition principles that support everything above",
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: "0.88rem",
                  color: "#b0a090",
                  lineHeight: 1.7,
                  paddingLeft: "1.25rem",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    color: "#c9a96e",
                    opacity: 0.6,
                    fontSize: "0.75rem",
                  }}
                >
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #2a2a2a",
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#c9a96e",
                marginBottom: "0.5rem",
                fontFamily: "var(--font-montserrat), sans-serif",
              }}
            >
              How to use this guide
            </div>
            <p style={{ fontSize: "0.88rem", color: "#888888", lineHeight: 1.8 }}>
              Read Module 1 and 2 before touching the program. Watch every video. The form knowledge is the product, the program is what you do with it.
            </p>
          </div>
        </div>

        <Link
          href="/training-foundations/module1"
          style={{
            display: "inline-block",
            marginTop: "2rem",
            background: "#c9a96e",
            color: "#0a0a0a",
            padding: "0.85rem 2rem",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          Start Module 1 →
        </Link>
      </div>
    </>
  )
}
