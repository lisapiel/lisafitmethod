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
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            I started in fitness classes. Cardio, cycling, group workouts — the kind of training that feels approachable when the weight room feels intimidating. I was consistent, I showed up, I worked hard. But nothing was really changing. I was burning calories without building anything. The shape I wanted wasn&apos;t coming from what I was doing.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            The moment I started following a real strength training program, everything shifted. For the first time I was actually building muscle. Week over week I could feel it. The squat moved more weight. The deadlift felt different. My body started changing in a way it never had from classes. I got hooked — and I pushed too hard, too fast.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            I kept loading more weight before I had the foundation to support it. Warm-ups were something I rushed through or skipped. Mobility and recovery weren&apos;t things I took seriously — they felt optional. I was making progress, which made it easy to ignore the warning signs. Eventually my back gave out.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            For almost a year I lived with serious back pain. Getting out of bed was uncomfortable. Tying my shoes was uncomfortable. The gym — something I had built my entire routine around — was suddenly out of reach. That year taught me more about training than all the years before it combined.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            I had to relearn everything properly. Movement mechanics. How to actually warm up. Why mobility and recovery are not optional. How to build a program with real structure and logic. I became a certified personal trainer because I needed to genuinely understand what I had been skipping — not just fix it, understand it.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            I rebuilt my body from scratch. Properly. I became pain-free. I became stronger than I had ever been. And I have maintained those habits consistently ever since — not through motivation, but through understanding why the right approach works.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            This guide is everything I wish someone had handed me before I started. The movements, the structure, the warm-up and recovery protocols I used to think were optional. Everything that would have changed my trajectory if I had learned it from the beginning.
          </p>
          <br />
          <p style={{ fontSize: "0.9rem", color: "#b0a090", lineHeight: 1.5 }}>
            You don&apos;t need to learn the hard way. That&apos;s already been done.
          </p>
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
                  lineHeight: 1.35,
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
            <p style={{ fontSize: "0.88rem", color: "#888888", lineHeight: 1.45 }}>
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
