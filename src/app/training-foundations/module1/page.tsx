import Link from "next/link"
import VideoEmbed from "@/components/training/VideoEmbed"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Module 1 — Foundation Movements | Lisa Fit Method",
}

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#b0a090"
const border = "#2a2a2a"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </div>
  )
}

function ExerciseBlock({ id, num, title, subtitle, children }: { id: string; num: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ marginBottom: "4rem", paddingBottom: "4rem", borderBottom: `1px solid ${border}` }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        {num}
      </div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 400, color: cream, marginBottom: "0.25rem", lineHeight: 1.2 }}>
        {title}
      </div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "1rem", color: gold, marginBottom: "2rem", opacity: 0.8 }}>
        {subtitle}
      </div>
      {children}
    </div>
  )
}

function ContentBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <h4 style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        {heading}
      </h4>
      {children}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.7, paddingLeft: "1.25rem", position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: gold, opacity: 0.6, fontSize: "0.75rem" }}>—</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Para({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.9 }}>{children}</p>
}

export default function Module1Page() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`@media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }`}</style>

      <SectionLabel>Module 1</SectionLabel>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem" }}>
        The Foundation Movements
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.9, maxWidth: 700, marginBottom: "3rem", paddingBottom: "2rem", borderBottom: `1px solid ${border}` }}>
        These are the five movement patterns that form the base of almost every effective training program. Before you add weight, add complexity, or follow any program including the one in this guide, you need to understand these movements and be able to perform them with clean form. Watch the video first, read the cues, then practice the movement with light or no weight before your first session.
      </p>

      {/* E1 */}
      <ExerciseBlock id="e1" num="Exercise 1" title="The Hip Hinge" subtitle="the most important movement you'll ever learn">
        <VideoEmbed videoId="AyY0C8s5scU" title="Hip Hinge" />
        <ContentBlock heading="Why it matters">
          <Para>The hip hinge is the foundation of deadlifts, Romanian deadlifts, kettlebell swings, and almost every posterior chain exercise you&apos;ll ever do. It is also the movement most responsible for lower back injuries when done incorrectly. Master this before anything else and every other exercise in this guide will feel more natural.</Para>
        </ContentBlock>
        <ContentBlock heading="What a hip hinge is">
          <Para>A hip hinge is a movement where you load your hamstrings and glutes by pushing your hips back, not bending your knees down. Your spine stays neutral throughout the entire movement, not rounded, not hyperextended. The power comes from your hips, not your lower back. It sounds simple but most people have never been taught to move this way deliberately, and it takes some practice before it clicks.</Para>
        </ContentBlock>
        <ContentBlock heading="What most people get wrong">
          <Para>The most common mistake is rounding the lower back under load, which is how discs get compressed over time. Most beginners also confuse the hinge with a squat, driving the knees forward instead of pushing the hips back. Looking up too aggressively is another one, forcing the neck and upper back into a compromised position. And the weight drifting away from the body is worth watching closely, because the further the weight travels from your center, the more stress lands directly on your spine.</Para>
        </ContentBlock>
        <ContentBlock heading="The cues that make it click">
          <BulletList items={[
            '"Push the wall behind you with your hips" — this forces the hinge pattern naturally without overthinking it',
            '"Soft bend in the knees, not a squat" — knees unlock slightly but don\'t drive forward',
            '"Pack your shoulders" — shoulder blades slightly down and back before you move',
            '"Bar stays close" — the weight should drag up your legs, not float away from your body',
          ]} />
        </ContentBlock>
        <ContentBlock heading="One thing to watch for">
          <Para>If your lower back is rounding at the bottom of the movement, the weight is too heavy or your hamstring flexibility needs work. Drop the weight, don&apos;t push through it. The warm-up routine at the start of each session in Module 3 will help with this directly.</Para>
        </ContentBlock>
      </ExerciseBlock>

      {/* E2 */}
      <ExerciseBlock id="e2" num="Exercise 2" title="The Squat Pattern" subtitle="knees, hips, and spine working together">
        <VideoEmbed videoId="NYf82VuzrQM" title="Goblet Squat" />
        <ContentBlock heading="Why it matters">
          <Para>Squatting is one of the most fundamental human movement patterns. Done well it builds leg strength, glute development, and core stability. Done poorly it creates knee pain, hip impingement, and lower back strain. The goal in this guide is to teach you the goblet squat first because it is the safest and most beginner-friendly way to learn the pattern before progressing to barbell variations.</Para>
        </ContentBlock>
        <ContentBlock heading="What a squat is">
          <Para>A squat is a movement where you bend at both the hips and knees simultaneously to lower your body toward the ground, then drive back up to standing. Unlike the hip hinge where the hips push back and the torso leans forward, a squat keeps your torso more upright while your knees travel forward over your toes. The depth you reach depends on your mobility, but the goal is always the same: controlled descent, neutral spine, and a strong drive back up.</Para>
        </ContentBlock>
        <ContentBlock heading="What most people get wrong">
          <Para>Knee caving is the most common issue. The knees collapse inward under load, putting serious stress on the knee joint over time. Heels rising off the floor usually points to ankle mobility limitations. Forward trunk lean is another one, where the squat starts turning into a hinge because the chest drops and the hips shoot back too early. And going too heavy before the movement pattern is solid is probably the most common mistake of all.</Para>
        </ContentBlock>
        <ContentBlock heading="The cues that make it click">
          <BulletList items={[
            '"Knees track over your second toe" — they follow the direction of your feet, they don\'t collapse inward',
            '"Chest up, proud posture" — keeps your torso upright throughout the movement',
            '"Sit between your heels, not behind them" — weight stays distributed across your full foot',
            '"Spread the floor with your feet" — creates external hip rotation that keeps the knees stable and the glutes engaged',
          ]} />
        </ContentBlock>
        <ContentBlock heading="Start here — the goblet squat">
          <Para>Hold a dumbbell or kettlebell at chest height. The counterbalance naturally pulls you into a better position, which makes it the ideal movement to learn the pattern with. Once you can do 3 sets of 10 with clean form and it feels controlled, you&apos;re ready to progress to the next variation.</Para>
        </ContentBlock>
      </ExerciseBlock>

      {/* E3 */}
      <ExerciseBlock id="e3" num="Exercise 3" title="The Push Pattern (horizontal)" subtitle="pressing without wrecking your shoulders">
        <VideoEmbed videoId="vZTUnLTRkOg" title="Dumbbell Bench Press" />
        <ContentBlock heading="Why it matters">
          <Para>Horizontal pressing builds chest, shoulder, and tricep strength and is one of the most satisfying patterns to get strong at over time. It is also one of the most important patterns to learn correctly early because shoulder issues from poor pressing mechanics tend to build up gradually and quietly until they become a real problem.</Para>
        </ContentBlock>
        <ContentBlock heading="What horizontal pressing is">
          <Para>Any movement where you push a load away from your body on a horizontal plane. On a bench that means pressing the weight away from your chest toward the ceiling. On a push-up it means pushing the floor away from you. The chest, shoulders, and triceps all contribute, but the movement works best when your entire body is engaged, not just your arms.</Para>
        </ContentBlock>
        <ContentBlock heading="What most people get wrong">
          <Para>Elbow position is the biggest one. Flaring the elbows out to 90 degrees feels natural at first but puts the shoulder joint under significant stress over time. The other common issue is skipping shoulder blade setup before the press, leaving the upper back slack and the shoulder in a vulnerable position before any load is applied. Your wrist should stay stacked directly over your elbow throughout the movement, not bent back under the load.</Para>
        </ContentBlock>
        <ContentBlock heading="The cues that make it click">
          <BulletList items={[
            '"Elbows at 45 degrees" — not tucked all the way in and not flared straight out',
            '"Shoulder blades together and down before you press" — set this position before you lower the weight, not after',
            '"Drive your feet into the floor" — full body tension makes the press stronger',
            '"Control the descent" — 2 to 3 seconds on the way down, then press with intent',
            '"Wrist over elbow" — check this before every set until it becomes automatic',
          ]} />
        </ContentBlock>
      </ExerciseBlock>

      {/* E4 */}
      <ExerciseBlock id="e4" num="Exercise 4" title="The Pull Pattern" subtitle="building the back that protects everything else">
        <VideoEmbed videoId="eKT-r-SV4x0" title="Dumbbell Row" />
        <VideoEmbed videoId="O6lwJdTd_K4" title="Lat Pulldown" />
        <ContentBlock heading="Why it matters">
          <Para>Most beginners spend a lot of time on pressing movements and not nearly enough on pulling. Over time this creates a real imbalance. A strong back is also directly protective of your spine. For every pushing exercise in your program, there should be at least one pulling exercise to match it.</Para>
        </ContentBlock>
        <ContentBlock heading="What pulling movements are">
          <Para>Any movement where you draw a load toward your body. Dumbbell rows, cable rows, lat pulldowns, and eventually pull-ups all fall into this category. They primarily train the lats, rhomboids, mid and lower traps, and rear delts. These are the muscles that keep your shoulders healthy, your posture strong, and your spine supported under load.</Para>
        </ContentBlock>
        <ContentBlock heading="What most people get wrong">
          <Para>Using momentum instead of muscle is the most common issue. Rows get swung, reps get rushed, and the back never actually does the work. Shrugging the shoulders up during the pull is another one. Most people also stop short of a full contraction, which means they are getting maybe half the value out of every rep.</Para>
        </ContentBlock>
        <ContentBlock heading="The cues that make it click">
          <BulletList items={[
            '"Pull your elbows to your back pockets" — activates the lats and stops the shrug',
            '"Shoulders down before you pull" — set the position first, then initiate',
            '"Squeeze at the end" — fully contract the back at the top of every rep',
            '"Chest to the bar, not head to the bar" — the chest leads the movement',
            '"Control the return" — lower the weight slowly, don\'t let it drop',
          ]} />
        </ContentBlock>
        <ContentBlock heading="Work toward this">
          <Para>Once you have built a solid base of pulling strength through rows and lat pulldowns, the pull-up becomes your benchmark movement. It is the ultimate test of relative upper body pulling strength and something genuinely worth working toward.</Para>
        </ContentBlock>
      </ExerciseBlock>

      {/* E5 */}
      <ExerciseBlock id="e5" num="Exercise 5" title="The Brace & Carry" subtitle="how your core actually works">
        <ContentBlock heading="Why it matters">
          <Para>Most people think core training means crunches and sit-ups. It doesn&apos;t. Your core&apos;s primary job is not to create movement, it is to resist it. It keeps your spine stable while the rest of your body produces force, and that capacity is one of the most important things you can build for long term back health and injury prevention. Every deadlift, squat, row, and press you do requires your core to be working.</Para>
        </ContentBlock>
        <ContentBlock heading="What your core actually is">
          <Para>Your core includes your deep abdominal muscles, your obliques, your lower back muscles, your diaphragm, and your pelvic floor. Together they form a cylinder of support around your spine. When this system is working correctly it creates intra-abdominal pressure that protects your spine under load. When it is not working correctly, your lower back compensates and that is where problems begin.</Para>
        </ContentBlock>
        <ContentBlock heading="What most people get wrong">
          <Para>Treating core work as an afterthought is the main issue. Crunches train your core to flex, but your spine needs to learn to resist flexion, resist rotation, and stay neutral under load. Your core should be actively engaged on every rep of every exercise in this guide, not just during dedicated core work.</Para>
        </ContentBlock>
        <ContentBlock heading="The cues that make it click">
          <BulletList items={[
            '"360 degree brace" — breathe into your belly and create pressure all the way around your trunk. Think of it as bracing for a punch',
            '"Ribs down" — prevents the lower back from hyperextending during standing and overhead movements',
            '"Tall spine" — imagine a string pulling the crown of your head toward the ceiling, especially during carries',
            '"Brace before you move" — create tension in your core before the rep begins, not halfway through it',
          ]} />
        </ContentBlock>
        <ContentBlock heading="What this looks like in practice">
          <Para>The exercises that train this directly are the dead bug, bird dog, farmer&apos;s carry, suitcase carry, and pallof press. All of them are covered in detail in Module 2. Before you get there, start practicing the brace on every exercise you do in this module.</Para>
        </ContentBlock>
      </ExerciseBlock>

      <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${border}` }}>
        <Link href="/training-foundations" style={{ display: "inline-block", background: "none", color: gold, border: `1px solid ${gold}`, padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          ← Introduction
        </Link>
        <Link href="/training-foundations/module2" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Module 2 →
        </Link>
      </div>
    </div>
  )
}
