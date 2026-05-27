"use client"

import { useState } from "react"
import Link from "next/link"
import { COURSE_PRICE_DISPLAY, COURSE_REGULAR_PRICE_DISPLAY } from "@/lib/pricing"
import { FreeGuideSignupForm } from "@/components/FreeGuideSignupForm"

const paper = "#faf8f5"
const panel = "#f0ebe2"
const ink = "#1a1a1a"
const muted = "#6b6560"
const gold = "#c8a97e"
const goldDeep = "#a8895e"
const line = "#ddd8cf"
const black = "#0a0a0a"
const dmSans = "var(--font-dm-sans), sans-serif"
const playfair = "var(--font-playfair), serif"

// ─── Data ─────────────────────────────────────────────────────────────────────

const MOVEMENTS = [
  {
    name: "The Hip Hinge",
    pattern: "Hip-dominant",
    what: "The single most important movement you will learn, and the one most responsible for back injuries when done wrong. Power comes from your hips, not your lower back.",
    cues: [
      "Push the wall behind you with your hips. This forces the hinge without overthinking it.",
      "Soft bend in the knees, not a squat. Knees unlock slightly but do not drive forward.",
      "Pack your shoulders. Shoulder blades slightly down and back before you move.",
      "Keep the weight close. It should drag up your legs, not float away from your body.",
    ],
    watch: "if your lower back rounds at the bottom, the weight is too heavy. Drop it, do not push through.",
  },
  {
    name: "The Squat",
    pattern: "Knee-dominant",
    what: "One of the most fundamental human movements. Done well it builds your legs, glutes, and core. Start with the goblet squat, the safest way to learn the pattern before you ever touch a barbell.",
    cues: [
      "Knees track over your second toe. They follow your feet, they do not collapse inward.",
      "Chest up, proud posture. This keeps your torso upright through the movement.",
      "Sit between your heels, not behind them. Weight stays across your whole foot.",
      "Spread the floor with your feet. This keeps the knees stable and the glutes switched on.",
    ],
  },
  {
    name: "The Push",
    pattern: "Horizontal press",
    what: "Pressing builds your chest, shoulders, and triceps. Learn it correctly early, because poor pressing mechanics build up quietly until they become a real shoulder problem.",
    cues: [
      "Elbows at 45 degrees. Not tucked all the way in, not flared straight out.",
      "Shoulder blades together and down before you press, not after.",
      "Drive your feet into the floor. Full body tension makes the press stronger.",
      "Control the descent. Two to three seconds down, then press with intent.",
    ],
  },
  {
    name: "The Pull",
    pattern: "Upper-body row",
    what: "Most beginners press far more than they pull, and over time that builds a real imbalance. A strong back directly protects your spine. Match every push with a pull.",
    cues: [
      "Pull your elbows to your back pockets. This activates the lats and stops the shrug.",
      "Shoulders down before you pull. Set the position first, then go.",
      "Squeeze at the end. Fully contract the back at the top of every rep.",
      "Control the return. Lower the weight slowly, do not let it drop.",
    ],
  },
  {
    name: "The Brace & Carry",
    pattern: "Core stability",
    what: "Your core's real job is not to create movement, it is to resist it. Crunches miss the point. Every squat, hinge, row, and press needs your core bracing to protect your spine.",
    cues: [
      "360 degree brace. Breathe into your belly and create pressure all the way around, like bracing for a punch.",
      "Ribs down. This stops your lower back from overarching.",
      "Tall spine. Imagine a string pulling the crown of your head toward the ceiling.",
      "Brace before you move, not halfway through the rep.",
    ],
  },
]

const MAIN_WORKOUT = [
  { name: "Hip Thrust", note: "drive through heels, ribs down", sets: "3 x 12" },
  { name: "Romanian Deadlift", note: "hips back, weight close", sets: "3 x 10" },
  { name: "Reverse Lunge", note: "front knee over toes", sets: "3 x 10 ea" },
  { name: "Goblet Squat", note: "chest up, sit between heels", sets: "3 x 10" },
  { name: "Dead Bug", note: "lower back glued to floor", sets: "3 x 8 ea" },
  { name: "Farmer's Carry", note: "tall spine, braced core", sets: "2 x 30m" },
]

const FEATURES: [string, string][] = [
  ["50+ exercise videos", " so your form is never a guess"],
  ["The full 4-week program", ", three days a week, fully structured with sets, reps, rest, warm ups and cooldowns"],
  ["Built-in tracking you keep for life", ", logging every set so you can watch your numbers climb"],
  ["Progressive overload built in", ", so you always know your next step instead of guessing"],
  ["Core, glute, and back work", " that actually protects your spine, the part most programs skip"],
  ["Simple nutrition foundations", " to fuel all of it, no calorie obsession"],
  ["Works at home with dumbbells and bands", ", and scales straight into the gym"],
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
      {children}
    </p>
  )
}

function Rule() {
  return <div style={{ height: 1, background: line, margin: "2.5rem 0" }} />
}

function MovementCard({ num, name, pattern, what, cues, watch }: {
  num: number
  name: string
  pattern: string
  what: string
  cues: string[]
  watch?: string
}) {
  return (
    <div style={{ marginBottom: "1.875rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.1rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: playfair,
          fontWeight: 700,
          fontSize: "0.92rem",
          color: goldDeep,
          border: `1.5px solid ${gold}`,
          width: 34,
          height: 34,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {num}
        </span>
        <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.2rem, 3.5vw, 1.45rem)", fontWeight: 700, color: ink, letterSpacing: "-0.01em", margin: 0 }}>
          {name}
        </h3>
        <span style={{ fontSize: "0.67rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: muted, marginLeft: "auto", fontFamily: dmSans, whiteSpace: "nowrap" }}>
          {pattern}
        </span>
      </div>
      <p style={{ fontSize: "0.9rem", margin: "0.2rem 0 0 46px", lineHeight: 1.68, color: muted, fontFamily: dmSans }}>
        {what}
      </p>
      <div style={{ margin: "0.75rem 0 0 46px", padding: "1rem 1.2rem", background: "#fff", border: `1px solid ${line}` }}>
        <p style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: goldDeep, fontWeight: 600, marginBottom: "0.5rem", fontFamily: dmSans }}>
          The cues that make it click
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {cues.map((c, i) => (
            <li key={i} style={{ fontSize: "0.87rem", padding: "0.28rem 0 0.28rem 1.1rem", position: "relative", color: ink, lineHeight: 1.55, fontFamily: dmSans }}>
              <span style={{ position: "absolute", left: 0, top: "0.55rem", width: 6, height: 6, background: gold, borderRadius: "50%", display: "block" }} />
              {c}
            </li>
          ))}
        </ul>
      </div>
      {watch && (
        <p style={{ margin: "0.6rem 0 0 46px", fontSize: "0.84rem", color: muted, fontStyle: "italic", fontFamily: dmSans, lineHeight: 1.55 }}>
          <strong style={{ color: goldDeep, fontStyle: "normal", fontWeight: 600 }}>Watch for:</strong> {watch}
        </p>
      )}
    </div>
  )
}

function ExRow({ name, note, sets }: { name: string; note: string; sets: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.6rem 0", borderBottom: "1px solid #2a2722", gap: "1rem" }}>
      <div>
        <p style={{ fontFamily: playfair, fontSize: "1rem", color: "#fff", margin: 0 }}>{name}</p>
        <p style={{ fontFamily: dmSans, fontSize: "0.76rem", color: "#5a544b", marginTop: "0.1rem", margin: 0 }}>{note}</p>
      </div>
      <span style={{ fontFamily: dmSans, fontSize: "0.8rem", color: gold, whiteSpace: "nowrap", fontWeight: 500, paddingTop: 2 }}>{sets}</span>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FreeGuideClient() {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <main style={{ background: paper, minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 480px) {
          .fg-move-offset { margin-left: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "clamp(36px, 6vw, 64px) clamp(20px, 5vw, 40px) 80px" }}>

        {!unlocked ? (
          /* ── Pre-email: teaser + form ── */
          <>
            <Label>Free Guide · Training Foundations</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              The 5 movements <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>every strong body is built on</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 580, marginBottom: "2rem", lineHeight: 1.72, fontFamily: dmSans }}>
              This is a real piece of my course, not a watered-down freebie. The five foundation movements, the coaching cues behind them, and a look inside one full day of the program.
            </p>

            <div style={{ marginBottom: "2rem" }}>
              {[
                ["The 5 movement patterns", " underneath almost every effective exercise you will ever do"],
                ["The coaching cues that fix bad form", " — the same ones I teach in the course"],
                ["A look inside Day A", " — a real structured workout, not a teaser"],
                ["Yours to keep", " — free, no credit card, no catch"],
              ].map(([bold, rest], i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: i < 3 ? `1px solid ${line}` : "none" }}>
                  <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.12rem" }}>&#8594;</span>
                  <p style={{ fontFamily: dmSans, fontSize: "0.93rem", color: ink, margin: 0, lineHeight: 1.55 }}>
                    <strong>{bold}</strong>{rest}
                  </p>
                </div>
              ))}
            </div>

            {/* Email form */}
            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
                Free · No credit card
              </p>
              <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.75rem)", color: "#fff", fontWeight: 700, marginBottom: "0.75rem", marginTop: 0, lineHeight: 1.15 }}>
                Enter your email to get the guide
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.5rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
                You will get the full guide instantly, plus a copy sent to your inbox so you can come back to it any time.
              </p>
              <FreeGuideSignupForm source="free-guide-page" onSuccess={() => setUnlocked(true)} formOnly />
            </div>

            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com
            </p>
          </>
        ) : (
          /* ── Post-email: full guide ── */
          <>
            {/* Confirmation banner */}
            <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "1rem 1.5rem", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: gold, fontSize: "1rem", flexShrink: 0 }}>&#10003;</span>
              <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: muted, margin: 0 }}>
                You are in. Check your inbox for a copy to keep.
              </p>
            </div>

            {/* Header */}
            <Label>Free Preview · Training Foundations</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              The 5 movements <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>every strong body is built on</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 600, marginBottom: 0, lineHeight: 1.72, fontFamily: dmSans }}>
              This is a real piece of my course, not a watered down freebie. Inside you get the five foundation movements with the exact cues I teach, plus a look at one full day of the actual 4-week program.{" "}
              <strong style={{ color: ink }}>Read it, practice the movements, and you will already be ahead of most people in the gym.</strong>
            </p>

            <Rule />

            {/* Story */}
            <div style={{ background: panel, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2.25rem)", marginBottom: "0.5rem", borderLeft: `2px solid ${gold}` }}>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                I started in fitness classes. Cardio, cycling, group workouts. I showed up, I worked hard, and nothing really changed. Then I followed a real strength program and finally started building something.{" "}
                <strong style={{ color: ink }}>So I pushed too hard, too fast.</strong> I loaded more weight before I had the foundation to support it. I rushed my warm ups. I treated mobility and recovery as optional.
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                Eventually my back gave out, and I spent almost a year in serious pain. That year taught me more than all the years before it combined. I had to relearn everything properly, and I became a certified trainer because I needed to truly understand what I had been skipping.
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.5rem", color: muted, fontFamily: dmSans }}>
                This preview is the part I wish someone had handed me on day one. You do not need to learn the hard way. That has already been done.
              </p>
              <p style={{ fontFamily: playfair, fontStyle: "italic", fontSize: "1.05rem", color: goldDeep, margin: 0 }}>
                Lisa McPherson, CPT
              </p>
            </div>

            <Rule />

            {/* Movements */}
            <Label>Module 1 · The Foundation</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              Learn these five.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Everything else gets easier.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "1.8rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              These are the patterns underneath almost every effective exercise you will ever do. Master them with clean form before you add weight, and the whole gym stops feeling like guesswork. In the full course, each one comes with its own video. Here are the cues that make them click.
            </p>

            {MOVEMENTS.map((m, i) => (
              <MovementCard key={i} num={i + 1} {...m} />
            ))}

            <Rule />

            {/* Look inside the program */}
            <Label>A look inside the program</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              This is one real day.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>There are twelve.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "1.5rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              The 4-week program runs three days a week. Every exercise links to a video, every set logs into your tracker, and weeks 3 and 4 build progressive overload right on top of it. Here is a taste of Day A so you can see how it actually fits together.
            </p>

            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginBottom: "0.5rem", color: "#cfc7b8" }}>
              <Label>Day A</Label>
              <h3 style={{ fontFamily: playfair, fontSize: "1.7rem", color: "#fff", fontWeight: 700, marginBottom: "0.4rem", marginTop: 0 }}>
                Lower Body Strength
              </h3>
              <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: gold, marginBottom: "1.5rem", fontFamily: dmSans }}>
                Glutes · Legs · Stability · 45-60 min
              </p>
              <p style={{ fontSize: "0.87rem", color: "#6a6058", lineHeight: 1.7, marginBottom: "1.25rem", fontFamily: dmSans, fontStyle: "italic" }}>
                Every session also comes with a full warm-up and cool-down flow built in. Videos, movement cues, and mobility work designed to keep your body moving pain-free and actually protect it long term. That part matters more than most people realize, and it is all in there.
              </p>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5a544b", margin: "0 0 0.75rem", fontWeight: 500, fontFamily: dmSans }}>
                Main Workout
              </p>
              {MAIN_WORKOUT.map((ex) => <ExRow key={ex.name} {...ex} />)}
              <p style={{ fontSize: "0.82rem", color: "#5a544b", marginTop: "1.25rem", fontStyle: "italic", lineHeight: 1.65, fontFamily: dmSans }}>
                Every exercise has a video, rest times, and a spot to log your sets. Days B and C, the warm ups, the cooldowns, and the full progression for weeks 3 and 4 are all waiting inside.
              </p>
            </div>

            <Rule />

            {/* Pitch */}
            <Label>Here&#39;s the honest part</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.8rem", marginTop: 0, lineHeight: 1.12 }}>
              Knowing the movements is the start.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>The system is what changes your body.</em>
            </h2>
            <p style={{ fontSize: "0.93rem", marginBottom: "1rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              You now have the five patterns and a glimpse of one workout. That alone puts you ahead. But a foundation is not a finished program, and reading about a movement is not the same as watching it done right and tracking yourself getting stronger at it week after week.
            </p>
            <p style={{ fontSize: "0.93rem", marginBottom: "1rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              That is the whole point of the full course, and right now it costs less than a single session with a trainer:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.25rem" }}>
              {FEATURES.map(([bold, rest], i) => (
                <li key={i} style={{ fontSize: "0.93rem", padding: "0.55rem 0 0.55rem 2rem", position: "relative", borderBottom: `1px solid ${line}`, color: ink, fontFamily: dmSans, lineHeight: 1.55 }}>
                  <span style={{ position: "absolute", left: 0, color: goldDeep, fontWeight: 500, fontSize: "1rem", lineHeight: "1.4rem" }}>&#8594;</span>
                  <strong>{bold}</strong>{rest}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginTop: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.875rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ color: "#5a544b", textDecoration: "line-through", fontFamily: playfair, fontSize: "1.5rem" }}>
                  {COURSE_REGULAR_PRICE_DISPLAY}
                </span>
                <span style={{ color: "#fff", fontFamily: playfair, fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 700, lineHeight: 1 }}>
                  {COURSE_PRICE_DISPLAY}
                </span>
                <span style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: black, background: gold, padding: "4px 10px", alignSelf: "center", fontFamily: dmSans }}>
                  Limited Time
                </span>
              </div>
              <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.7rem)", fontWeight: 700, margin: "1.1rem 0 0.75rem", color: "#fff", letterSpacing: "-0.01em" }}>
                Stop guessing.{" "}
                <em style={{ fontStyle: "italic", fontWeight: 600, color: gold }}>Start building.</em>
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.6rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
                One payment, lifetime access. Keep the videos, the program, and the tracker for good. Run it once, then run it again heavier. The price goes back to {COURSE_REGULAR_PRICE_DISPLAY} soon, so this is the moment to grab it.
              </p>
              <Link
                href="/checkout"
                style={{
                  display: "block",
                  background: gold,
                  color: black,
                  textAlign: "center",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "1rem",
                  textDecoration: "none",
                  fontFamily: dmSans,
                  maxWidth: 400,
                }}
              >
                Get Instant Access
              </Link>
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a544b", marginTop: "1rem", fontFamily: dmSans }}>
                One-time payment · Lifetime access · Reuse it, track it, keep building
              </p>
            </div>

            {/* Footer line */}
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com · @lisafitmethod
            </p>
          </>
        )}
      </div>
    </main>
  )
}
