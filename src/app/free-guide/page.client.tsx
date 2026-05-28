"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
    what: "The single most important movement you will learn, and the one most responsible for back injuries when done wrong. Power comes from your hips, not your lower back. Get this right and every deadlift, kettlebell swing, and posterior chain exercise you ever do will feel completely different.",
    cues: [
      "Push the wall behind you with your hips — this forces the hinge without overthinking it.",
      "Soft bend in the knees, not a squat. Knees unlock slightly but do not drive forward.",
      "Pack your shoulders. Blades slightly down and back before you move.",
      "Keep the weight close. It should drag up your legs, not float away from your body.",
    ],
    watch: "if your lower back rounds at the bottom, the weight is too heavy. Drop it, do not push through.",
  },
  {
    name: "The Squat",
    pattern: "Knee-dominant",
    what: "One of the most fundamental human movements. Done well it builds your legs, glutes, and core. Start with the goblet squat — the safest way to learn the pattern before you ever touch a barbell. The counterbalance naturally pulls you into a better position and teaches you what upright actually feels like.",
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
    what: "Pressing builds your chest, shoulders, and triceps. Learn it correctly early, because poor pressing mechanics build up quietly until they become a real shoulder problem. Most of it comes down to elbow position and setting your shoulder blades before the bar ever moves.",
    cues: [
      "Elbows at 45 degrees. Not tucked all the way in, not flared straight out.",
      "Shoulder blades together and down before you press — set this before you lower, not after.",
      "Drive your feet into the floor. Full body tension makes the press stronger.",
      "Control the descent. Two to three seconds down, then press with intent.",
    ],
  },
  {
    name: "The Pull",
    pattern: "Upper-body row",
    what: "Most people press far more than they pull, and over time that builds a real imbalance — rounded shoulders, tight chest, a back that does not do its job protecting your spine. A strong back is directly protective of your spine. Match every push with a pull.",
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
    what: "Your core's real job is not to create movement — it is to resist it. Crunches miss the point entirely. Every squat, hinge, row, and press you do needs your core bracing to protect your spine. The farmer's carry is one of the most underused exercises in existence. Walking with heavy dumbbells sounds easy until you try to do it for 30 metres without your posture falling apart.",
    cues: [
      "360-degree brace. Breathe into your belly and create pressure all the way around — like bracing for a punch.",
      "Ribs down. This stops your lower back from overarching.",
      "Tall spine. Imagine a string pulling the crown of your head toward the ceiling.",
      "Brace before you move, not halfway through the rep.",
    ],
  },
]

const WARMUP_A = [
  {
    name: "90/90 Hip Mobility Stretch",
    protocol: "8–10 reps per side, alternating",
    why: "Opens hip rotation before you load anything heavy. Tight hips on a lower body day means your lower back compensates — and that is how people get hurt.",
    cue: "Move slowly between sides. Breathe into the stretch. You do not need to force the range at all — it will open up as you go.",
  },
  {
    name: "Cat-Cow",
    protocol: "10 reps",
    why: "Wakes up spinal mobility and gets the lower back ready to move through its full range without shock. Do not skip this even when you are short on time.",
    cue: "Inhale as you extend, exhale as you round. Slow and deliberate. This is not a speed drill.",
  },
  {
    name: "World's Greatest Stretch",
    protocol: "5 reps per side",
    why: "Opens the hips, thoracic spine, and hamstrings in one compound movement. If you only have time for one warmup exercise before lower body, this is the one to keep.",
    cue: "Move through every position with control. Your range does not need to match any video — go to where you can breathe comfortably.",
  },
  {
    name: "Glute Bridge (Activation)",
    protocol: "1 set × 15 reps",
    why: "Gets the glutes firing before you ask them to do serious work. The hip thrust only works as well as the glutes are already switched on going into it.",
    cue: "Squeeze hard at the top and hold for 1 second. Drive through your heels, not your toes. Ribs stay down throughout.",
  },
  {
    name: "Lateral Band Walk",
    protocol: "1 set × 15 steps each direction",
    why: "Activates the glute medius — the side glute responsible for knee stability and hip alignment. Most people underwork this and it shows up as knee caving under any real load.",
    cue: "Light band. Stay in a slight squat the whole time. Feet parallel. Control every step — do not let the band snap your legs back together.",
  },
  {
    name: "Leg Swing Front to Back",
    protocol: "10 reps per side",
    why: "Dynamic hip flexor and hamstring mobility through the range you are about to use. This is warmup movement, not passive stretching — you are waking the hips up, not cooling them down.",
    cue: "Hold a wall for balance. Let the swing be controlled. Start small and gradually increase the range over 4–5 reps.",
  },
  {
    name: "Lateral Lunge",
    protocol: "8 reps per side",
    why: "Opens the hips in the frontal plane — a direction most warmups completely miss. Sets the adductors and inner thighs up for the squatting and lunging work ahead.",
    cue: "Push your hips back as you lower. Keep the working knee over your toes. Only go as deep as you can control while keeping your chest lifted.",
  },
]

const MAIN_WORKOUT_A = [
  {
    name: "Hip Thrust",
    sets: "3 × 10–12",
    rest: "2 min rest",
    note: "Start with a dumbbell across your hips. Once that feels easy and controlled, progress to barbell or single-leg. The last few reps should be hard — but not at the expense of your form.",
    tip: "Drive through heels. Squeeze glutes hard at the top, hold 1 second. Chin tucked, ribs down. No lower back arch.",
  },
  {
    name: "Romanian Deadlift",
    sets: "3 × 10",
    rest: "2 min rest",
    note: "Push your hips back, not your hands down. The weight follows your hips. Stop before your lower back rounds — that is your real endpoint, not touching the floor.",
    tip: "Keep the dumbbells dragging close to your legs the entire way. Pause at the bottom and feel the hamstring stretch before driving back up.",
  },
  {
    name: "Reverse Lunge",
    sets: "3 × 10 per side",
    rest: "90 sec rest",
    note: "Step back into the lunge, not forward. It is easier to control and safer on the knee. Front knee stays over your toes, back knee hovers just above the floor.",
    tip: "Most of your weight should be in the front leg, not the back foot. Drive through the front heel to return to standing.",
  },
  {
    name: "Goblet Squat",
    sets: "3 × 10",
    rest: "2 min rest",
    note: "Hold a dumbbell at chest height. The counterbalance keeps your torso upright and teaches you what a proper squat position actually feels like.",
    tip: "Push your knees out gently as you lower — do not let them cave in. Go only as deep as you can while keeping your chest lifted and lower back stable.",
  },
  {
    name: "Dead Bug",
    sets: "3 × 8 per side",
    rest: "60 sec rest",
    note: "Lower back glued to the floor before you start. The moment it lifts, you have gone too far. Slow this down significantly — it is a control exercise, not a speed drill.",
    tip: "Exhale fully as you extend. If you cannot keep your back flat, reduce your range of motion, not your effort.",
  },
  {
    name: "Farmer's Carry",
    sets: "2 × 20–30 m",
    rest: "90 sec rest",
    note: "Grab heavy dumbbells, stand tall, and walk with full intention. This trains grip, core stability, and posture simultaneously. It looks simple. It is not.",
    tip: "Shoulders back and down. Brace your core as if someone is about to punch your stomach. Small, controlled steps. If your posture is falling apart, the weight is too heavy.",
  },
]

const COOLDOWN_A = [
  {
    name: "Kneeling Hip Flexor Stretch",
    protocol: "30 sec per side",
    note: "These muscles tighten after any lower body session. Skip this consistently and your lower back will let you know about it within a few weeks.",
    cue: "Tuck your pelvis slightly to deepen the stretch. Stay tall — no lower back arch. Breathe slowly and relax into the position.",
  },
  {
    name: "90/90 Hamstring Stretch",
    protocol: "30 sec per side",
    note: "You just loaded your hamstrings with hip thrusts and RDLs. This is how you close the loop so they are not locked up tomorrow.",
    cue: "Hold behind your thigh, not the knee. Keep a soft bend in the leg. Pull until you feel the stretch in the hamstring — not pain behind the knee.",
  },
  {
    name: "Figure 4 Stretch",
    protocol: "30 sec per side",
    note: "The glutes worked hard today. This targets deep into the glute and piriformis — the places a foam roller rarely reaches.",
    cue: "Flex the foot of the crossed leg to protect your knee. Gently pull the opposite leg toward you to deepen. Breathe and relax into it.",
  },
  {
    name: "Child's Pose",
    protocol: "30 sec",
    note: "Every session ends here. It decompresses the spine, slows the breathing, and gives you a moment to register what you just actually did.",
    cue: "Reach your arms forward. Let your chest sink toward the floor. Breathe into your lower back. You have nowhere to be for 30 seconds.",
  },
]

const FEATURES: [string, string][] = [
  ["50+ exercise videos", " so your form is never a guess"],
  ["The full 4-week program", ", three days a week, fully structured with sets, reps, rest, warm-ups and cooldowns"],
  ["Built-in tracking you keep for life", ", logging every set so you can watch your numbers climb week by week"],
  ["Progressive overload built in", ", so you always know your next step instead of guessing what to add"],
  ["Core, glute, and back work", " that actually protects your spine — the part most programs quietly skip"],
  ["Simple nutrition foundations", " to fuel all of it, no calorie obsession or food rules"],
  ["Works at home with dumbbells and bands", ", and scales straight into the gym when you are ready"],
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
  num: number; name: string; pattern: string; what: string; cues: string[]; watch?: string
}) {
  return (
    <div style={{ marginBottom: "1.875rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.1rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: playfair, fontWeight: 700, fontSize: "0.92rem", color: goldDeep,
          border: `1.5px solid ${gold}`, width: 34, height: 34, borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
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
      <p style={{ fontSize: "0.9rem", margin: "0.2rem 0 0 46px", lineHeight: 1.68, color: muted, fontFamily: dmSans }} className="fg-move-offset">
        {what}
      </p>
      <div style={{ margin: "0.75rem 0 0 46px", padding: "1rem 1.2rem", background: "#fff", border: `1px solid ${line}` }} className="fg-move-offset">
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
        <p style={{ margin: "0.6rem 0 0 46px", fontSize: "0.84rem", color: muted, fontStyle: "italic", fontFamily: dmSans, lineHeight: 1.55 }} className="fg-move-offset">
          <strong style={{ color: goldDeep, fontStyle: "normal", fontWeight: 600 }}>Watch for:</strong> {watch}
        </p>
      )}
    </div>
  )
}

function WarmupRow({ item }: { item: typeof WARMUP_A[number] }) {
  return (
    <div style={{ padding: "0.875rem 0", borderBottom: `1px solid ${line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: playfair, fontSize: "1rem", color: ink, margin: "0 0 0.15rem" }}>{item.name}</p>
          <p style={{ fontFamily: dmSans, fontSize: "0.76rem", color: muted, margin: 0, lineHeight: 1.5 }}>{item.why}</p>
        </div>
        <span style={{ fontFamily: dmSans, fontSize: "0.72rem", color: goldDeep, whiteSpace: "nowrap", fontWeight: 500, paddingTop: 2 }}>{item.protocol}</span>
      </div>
      <div style={{ marginTop: "0.5rem", paddingLeft: "0.875rem", borderLeft: `2px solid ${line}` }}>
        <p style={{ fontFamily: dmSans, fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
          <strong style={{ color: goldDeep, fontStyle: "normal", fontWeight: 600 }}>Key cue:</strong> {item.cue}
        </p>
      </div>
    </div>
  )
}

function WorkoutRow({ ex }: { ex: typeof MAIN_WORKOUT_A[number] }) {
  return (
    <div style={{ padding: "1rem 0 0.75rem", borderBottom: "1px solid #2a2722" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: playfair, fontSize: "1.05rem", color: "#fff", margin: "0 0 0.2rem" }}>{ex.name}</p>
          <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: "#6a6058", margin: "0 0 0.35rem", lineHeight: 1.5 }}>{ex.note}</p>
          <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: "#5a5048", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
            <span style={{ color: gold, fontStyle: "normal", fontWeight: 500 }}>↳ </span>{ex.tip}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: dmSans, fontSize: "0.82rem", color: gold, fontWeight: 500, margin: "0 0 0.1rem", whiteSpace: "nowrap" }}>{ex.sets}</p>
          <p style={{ fontFamily: dmSans, fontSize: "0.68rem", color: "#5a5048", margin: 0, whiteSpace: "nowrap" }}>{ex.rest}</p>
        </div>
      </div>
    </div>
  )
}

function CooldownRow({ item }: { item: typeof COOLDOWN_A[number] }) {
  return (
    <div style={{ padding: "0.875rem 0", borderBottom: `1px solid ${line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: playfair, fontSize: "1rem", color: ink, margin: "0 0 0.15rem" }}>{item.name}</p>
          <p style={{ fontFamily: dmSans, fontSize: "0.76rem", color: muted, margin: 0, lineHeight: 1.5 }}>{item.note}</p>
        </div>
        <span style={{ fontFamily: dmSans, fontSize: "0.72rem", color: goldDeep, whiteSpace: "nowrap", fontWeight: 500, paddingTop: 2 }}>{item.protocol}</span>
      </div>
      <div style={{ marginTop: "0.5rem", paddingLeft: "0.875rem", borderLeft: `2px solid ${line}` }}>
        <p style={{ fontFamily: dmSans, fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
          <strong style={{ color: goldDeep, fontStyle: "normal", fontWeight: 600 }}>Key cue:</strong> {item.cue}
        </p>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FreeGuideClient() {
  const searchParams = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => searchParams.get("unlocked") === "1")

  useEffect(() => {
    if (!unlocked && sessionStorage.getItem("lfm_guide_unlocked") === "1") {
      setUnlocked(true)
    }
  }, [unlocked])

  function handleSuccess() {
    sessionStorage.setItem("lfm_guide_unlocked", "1")
    setUnlocked(true)
  }

  return (
    <main style={{ background: paper, minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 480px) { .fg-move-offset { margin-left: 0 !important; } }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "clamp(36px, 6vw, 64px) clamp(20px, 5vw, 40px) 80px" }}>

        {!unlocked ? (
          /* ── Pre-email gate ── */
          <>
            <Label>Free Guide · Training Foundations</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              The 5 movements <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>every strong body is built on</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 580, marginBottom: "2rem", lineHeight: 1.72, fontFamily: dmSans }}>
              This is a real piece of my course, not a watered-down freebie. The five foundation movements with the coaching cues behind them, the complete Day A workout with warm-up and cool-down, and a look at the full 4-week program structure.
            </p>

            <div style={{ marginBottom: "2rem" }}>
              {[
                ["The 5 movement patterns", " underneath almost every effective exercise you will ever do"],
                ["The coaching cues that fix bad form", " — the same ones I teach in the full course"],
                ["Complete Day A workout", " — warmup, 6 exercises, and cooldown"],
                ["The full 4-week program overview", " — all 3 days and how progressive overload works"],
                ["Yours to keep", " — free, no credit card, no catch"],
              ].map(([bold, rest], i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: i < 4 ? `1px solid ${line}` : "none" }}>
                  <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.12rem" }}>&#8594;</span>
                  <p style={{ fontFamily: dmSans, fontSize: "0.93rem", color: ink, margin: 0, lineHeight: 1.55 }}>
                    <strong>{bold}</strong>{rest}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
                Free · No credit card
              </p>
              <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.75rem)", color: "#fff", fontWeight: 700, marginBottom: "0.75rem", marginTop: 0, lineHeight: 1.15 }}>
                Enter your email to get the guide
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.5rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
                You will get the full guide instantly, plus a copy sent to your inbox with the PDF cheat sheet attached.
              </p>
              <FreeGuideSignupForm source="free-guide-page" onSuccess={handleSuccess} formOnly />
            </div>

            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com
            </p>
          </>
        ) : (
          /* ── Full guide ── */
          <>
            {/* Confirmation */}
            <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "1rem 1.5rem", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: gold, fontSize: "1rem", flexShrink: 0 }}>&#10003;</span>
              <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: muted, margin: 0 }}>
                You are in. Check your inbox — the guide and PDF cheat sheet are on their way.
              </p>
            </div>

            {/* Header */}
            <Label>Free Preview · Training Foundations</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              The 5 movements <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>every strong body is built on</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 600, marginBottom: 0, lineHeight: 1.72, fontFamily: dmSans }}>
              This is a real piece of my course, not a watered-down freebie. The five foundation movement patterns with the cues I teach, the complete Day A workout with warmup and cooldown, and a look at the full 4-week program structure.{" "}
              <strong style={{ color: ink }}>Read it, practice the movements, and you will already be ahead of most people in the gym.</strong>
            </p>

            <Rule />

            {/* Story */}
            <div style={{ background: panel, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2.25rem)", marginBottom: "0.5rem", borderLeft: `2px solid ${gold}` }}>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                I started in fitness classes. Cardio, cycling, group workouts. I showed up, I worked hard, and nothing really changed. Then I found a real strength program and finally started building something.{" "}
                <strong style={{ color: ink }}>So I pushed too hard, too fast.</strong> I loaded more weight before I had the foundation to support it. I rushed warmups. I treated mobility and recovery as optional.
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                Eventually my back gave out, and I spent almost a year in serious pain. That year taught me more than all the years before it combined. I had to relearn everything properly — and I became a certified trainer because I needed to truly understand what I had been skipping.
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.5rem", color: muted, fontFamily: dmSans }}>
                This guide is the part I wish someone had handed me on day one. You do not need to learn the hard way. That has already been done.
              </p>
              <p style={{ fontFamily: playfair, fontStyle: "italic", fontSize: "1.05rem", color: goldDeep, margin: 0 }}>
                Lisa McPherson, CPT
              </p>
            </div>

            <Rule />

            {/* ── Part 1: Foundation Movements ── */}
            <Label>Part 1 · The Foundation</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              Learn these five.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Everything else gets easier.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "1.8rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              These are the patterns underneath almost every effective exercise you will ever do. Master them with clean form before adding weight and the whole gym stops feeling like guesswork. In the full course, each one comes with its own video. Here are the cues that make them click.
            </p>

            {MOVEMENTS.map((m, i) => (
              <MovementCard key={i} num={i + 1} {...m} />
            ))}

            <Rule />

            {/* ── Part 2: Day A ── */}
            <Label>Part 2 · A Look Inside the Program</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              Day A — complete.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Warmup through cooldown.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "1.75rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              This is not a teaser. This is the real Day A of the program — every exercise, every set, every note, and the warmup and cooldown that bookend it. The warmup and cooldown are not optional. They are the part most people skip and then wonder why things hurt.
            </p>

            {/* Warmup */}
            <div style={{ background: "#fff", border: `1px solid ${line}`, marginBottom: "0.125rem" }}>
              <div style={{ background: panel, borderBottom: `1px solid ${line}`, padding: "0.75rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontFamily: dmSans, fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: goldDeep, margin: 0 }}>Warm-Up</p>
                <p style={{ fontFamily: dmSans, fontSize: "0.62rem", color: muted, margin: 0, letterSpacing: "0.08em" }}>~10 minutes</p>
              </div>
              <div style={{ padding: "0 1.5rem 0.25rem" }}>
                {WARMUP_A.map((item, i) => (
                  <WarmupRow key={i} item={item} />
                ))}
                <p style={{ fontFamily: dmSans, fontSize: "0.78rem", color: muted, fontStyle: "italic", padding: "0.875rem 0", lineHeight: 1.6 }}>
                  Do not rush this. The warmup is where you prepare your nervous system, not just your muscles. Ten minutes now is worth thirty minutes of lost training later.
                </p>
              </div>
            </div>

            {/* Main Workout */}
            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginBottom: "0.125rem", color: "#cfc7b8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <Label>Day A · Main Workout</Label>
                <span style={{ fontFamily: dmSans, fontSize: "0.62rem", color: "#5a5048", letterSpacing: "0.08em" }}>~35–40 minutes</span>
              </div>
              <h3 style={{ fontFamily: playfair, fontSize: "1.7rem", color: "#fff", fontWeight: 700, marginBottom: "0.2rem", marginTop: 0 }}>
                Lower Body Strength
              </h3>
              <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: gold, marginBottom: "1.25rem", fontFamily: dmSans }}>
                Glutes · Legs · Stability · Core
              </p>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
                <p style={{ fontFamily: dmSans, fontSize: "0.78rem", color: "#5a5048", lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: "#888", fontWeight: 500 }}>How to read this:</strong> sets × reps. So 3 × 10 means 3 sets of 10 reps. Rest 90–120 seconds between sets on compound movements. The last few reps of each set should feel genuinely hard — if they do not, the weight is too light.
                </p>
              </div>
              {MAIN_WORKOUT_A.map((ex, i) => (
                <WorkoutRow key={i} ex={ex} />
              ))}
              <p style={{ fontSize: "0.75rem", color: "#5a544b", marginTop: "1.25rem", fontStyle: "italic", lineHeight: 1.65, fontFamily: dmSans }}>
                In the full course, every exercise links to a coaching video, and you log your weights directly into the built-in tracker so you can see your progress week by week.
              </p>
            </div>

            {/* Cooldown */}
            <div style={{ background: "#fff", border: `1px solid ${line}`, marginBottom: "0.5rem" }}>
              <div style={{ background: panel, borderBottom: `1px solid ${line}`, padding: "0.75rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontFamily: dmSans, fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: goldDeep, margin: 0 }}>Cool-Down</p>
                <p style={{ fontFamily: dmSans, fontSize: "0.62rem", color: muted, margin: 0, letterSpacing: "0.08em" }}>~5 minutes</p>
              </div>
              <div style={{ padding: "0 1.5rem 0.25rem" }}>
                {COOLDOWN_A.map((item, i) => (
                  <CooldownRow key={i} item={item} />
                ))}
                <p style={{ fontFamily: dmSans, fontSize: "0.78rem", color: muted, fontStyle: "italic", padding: "0.875rem 0", lineHeight: 1.6 }}>
                  Stretching should feel controlled, not painful. Hold each position for the full time and breathe slowly. The point is not flexibility — it is recovery and decompression.
                </p>
              </div>
            </div>

            <Rule />

            {/* ── Part 3: Full Program Overview ── */}
            <Label>Part 3 · The Full 4-Week Program</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              Three days. Four weeks.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>One real structure.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "1.5rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              The program runs three days per week with at least one rest day between sessions. Each workout takes 45 to 60 minutes including warmup and cooldown — those are not optional, they are built into the program. Below is the full structure across all three days.
            </p>

            {/* Day A already shown */}
            <div style={{ background: "#fff", border: `1px solid ${line}`, marginBottom: "0.75rem" }}>
              <div style={{ background: panel, borderBottom: `1px solid ${line}`, padding: "0.875rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
                  <span style={{ fontFamily: dmSans, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: goldDeep }}>Day A</span>
                  <span style={{ fontFamily: playfair, fontSize: "1.05rem", color: ink }}>Lower Body Strength</span>
                  <span style={{ fontFamily: dmSans, fontSize: "0.62rem", color: muted, marginLeft: "auto" }}>Shown above ↑</span>
                </div>
              </div>
            </div>

            {/* Day B */}
            <div style={{ background: "#fff", border: `1px solid ${line}`, marginBottom: "0.75rem" }}>
              <div style={{ background: panel, borderBottom: `1px solid ${line}`, padding: "0.875rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: dmSans, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: goldDeep }}>Day B</span>
                  <span style={{ fontFamily: playfair, fontSize: "1.05rem", color: ink }}>Upper Body Strength</span>
                  <span style={{ fontFamily: dmSans, fontSize: "0.68rem", color: muted }}>Pressing · Pulling · Posture · Shoulder stability</span>
                </div>
              </div>
              <div style={{ padding: "1rem 1.5rem" }}>
                {[
                  { name: "Dumbbell Bench Press or Push-Up", sets: "3 × 10", note: "45-degree elbow angle, shoulder blades set before you lower." },
                  { name: "Band-Assisted Pull-Up or Lat Pulldown", sets: "3 × 8", note: "Elbows to back pockets. Control the descent." },
                  { name: "Overhead Press", sets: "3 × 10", note: "Core braced. Ribs down. Do not arch the lower back." },
                  { name: "Chest Supported Row", sets: "3 × 12", note: "Full contraction at the top. No momentum." },
                  { name: "Dumbbell Curl + Overhead Tricep Extension", sets: "3 rounds, superset", note: "No rest between the two. 60 sec rest after." },
                  { name: "Pallof Press", sets: "3 × 10 per side", note: "Resist rotation. Brace hard. Hold 2 sec at extension." },
                ].map((ex, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: i < arr.length - 1 ? `1px solid ${line}` : "none", gap: "1rem" }}>
                    <div>
                      <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: ink, margin: 0 }}>{ex.name}</p>
                      <p style={{ fontFamily: dmSans, fontSize: "0.74rem", color: muted, margin: 0, marginTop: "0.12rem" }}>{ex.note}</p>
                    </div>
                    <span style={{ fontFamily: dmSans, fontSize: "0.72rem", color: goldDeep, whiteSpace: "nowrap", paddingTop: 2, fontWeight: 500 }}>{ex.sets}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day C */}
            <div style={{ background: "#fff", border: `1px solid ${line}`, marginBottom: "1rem" }}>
              <div style={{ background: panel, borderBottom: `1px solid ${line}`, padding: "0.875rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: dmSans, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: goldDeep }}>Day C</span>
                  <span style={{ fontFamily: playfair, fontSize: "1.05rem", color: ink }}>Integration & Core</span>
                  <span style={{ fontFamily: dmSans, fontSize: "0.68rem", color: muted }}>Movement quality · Single-leg stability · Core control</span>
                </div>
              </div>
              <div style={{ padding: "1rem 1.5rem" }}>
                <p style={{ fontFamily: dmSans, fontSize: "0.82rem", color: muted, lineHeight: 1.6, marginBottom: "0.875rem", fontStyle: "italic" }}>
                  Day C has a different feel. The loading is lighter and the focus is on movement quality, single-leg stability, and tying everything you have been building together. Think of it as the day you reinforce the patterns rather than test them.
                </p>
                {[
                  { name: "Single-Leg Glute Bridge", sets: "3 × 10 per side", note: "Drive through heel, squeeze at the top, hips level." },
                  { name: "Reverse Lunge", sets: "3 × 10 per side", note: "Same cues as Day A. Single-leg stability focus." },
                  { name: "Push-Up + Inverted Row", sets: "3 rounds, superset", note: "90 sec rest after each round." },
                  { name: "Monster Walk + Side-Lying Hip Abduction", sets: "3 rounds, superset", note: "Glute medius work. Control every single rep." },
                  { name: "Dead Bug + Copenhagen Plank", sets: "2 rounds, superset", note: "20–30 sec hold on the Copenhagen." },
                  { name: "Stability Ball Stir-the-Pot", sets: "2 × 8 each direction", note: "Small circles. Hips level. Core braced the whole time." },
                ].map((ex, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: i < arr.length - 1 ? `1px solid ${line}` : "none", gap: "1rem" }}>
                    <div>
                      <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: ink, margin: 0 }}>{ex.name}</p>
                      <p style={{ fontFamily: dmSans, fontSize: "0.74rem", color: muted, margin: 0, marginTop: "0.12rem" }}>{ex.note}</p>
                    </div>
                    <span style={{ fontFamily: dmSans, fontSize: "0.72rem", color: goldDeep, whiteSpace: "nowrap", paddingTop: 2, fontWeight: 500 }}>{ex.sets}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weeks 3-4 */}
            <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "1.25rem 1.5rem", marginBottom: "0.5rem" }}>
              <p style={{ fontFamily: dmSans, fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: goldDeep, marginBottom: "0.6rem" }}>
                Weeks 3 &amp; 4 — Progressive Overload
              </p>
              <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: muted, lineHeight: 1.7, marginBottom: "0.65rem" }}>
                The program structure stays the same across all 4 weeks. What changes is the demand. On every exercise where you completed all sets and reps with clean form in Weeks 1 and 2, add a small amount of weight — usually one dumbbell size up. For bodyweight exercises like the dead bug and push-up, add 2–3 reps per set instead.
              </p>
              <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: muted, lineHeight: 1.7, margin: 0 }}>
                If your form broke down on anything in Weeks 1 and 2, stay at the same weight in Weeks 3 and 4. The movement pattern always comes before the load. The weight will come.
              </p>
            </div>

            <div style={{ background: panel, padding: "1.25rem 1.5rem", marginBottom: "0.5rem", border: `1px solid ${line}` }}>
              <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: muted, lineHeight: 1.7, marginBottom: 0, fontStyle: "italic" }}>
                This does not stop after Week 4. The point of the program is to teach you how to progressively overload correctly so you can keep building long after it ends. Run it again in Round 2 and go heavier. The full tracker logs every set across every week so you can see exactly where to push next time.
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
              You now have the five patterns, the complete Day A session, and the full program structure. That alone puts you ahead. But a foundation is not a finished program, and reading about a movement is not the same as watching it done right, logging yourself getting stronger at it, and following a system that tells you exactly what to do next.
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
                One payment, lifetime access. Keep the videos, the program, and the tracker for good. Run it once, then run it again heavier. The price goes back to {COURSE_REGULAR_PRICE_DISPLAY} soon.
              </p>
              <Link
                href="/checkout"
                style={{
                  display: "block", background: gold, color: black, textAlign: "center",
                  fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
                  padding: "1rem", textDecoration: "none", fontFamily: dmSans, maxWidth: 400,
                }}
              >
                Get Instant Access
              </Link>
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a544b", marginTop: "1rem", fontFamily: dmSans }}>
                One-time payment · Lifetime access · Reuse it, track it, keep building
              </p>
            </div>

            {/* Footer */}
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com · @lisafitmethod
            </p>
          </>
        )}
      </div>
    </main>
  )
}
