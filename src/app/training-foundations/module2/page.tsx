import Link from "next/link"
import VideoEmbed from "@/components/training/VideoEmbed"
import { getPublishedVideoUrls } from "@/lib/mediaClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Module 2 — Core & Glute Priority | Lisa Fit Method",
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

function ExBlock({ id, num, title, subtitle, children }: { id: string; num: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ marginBottom: "4rem", paddingBottom: "4rem", borderBottom: `1px solid ${border}` }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>{num}</div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 400, color: cream, marginBottom: "0.25rem", lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "1rem", color: gold, marginBottom: "2rem", opacity: 0.8 }}>{subtitle}</div>
      {children}
    </div>
  )
}

function CB({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <h4 style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>{heading}</h4>
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.5 }}>{children}</p>
}

export default async function Module2Page() {
  const urlMap = await getPublishedVideoUrls([
    "m2_dead_bug", "m2_bird_dog", "m2_glute_bridge", "m2_band_monster_walk",
    "m2_lateral_band_walk", "m2_hip_abduction", "m2_hip_thrust", "m2_hip_thrust_var",
    "m2_rdl", "m2_pallof_press", "m2_farmers_carry",
  ])
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`@media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }`}</style>

      <SectionLabel>Module 2</SectionLabel>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem" }}>Core & Glute Priority</h2>
      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.5, maxWidth: 700, marginBottom: "3rem", paddingBottom: "2rem", borderBottom: `1px solid ${border}` }}>
        Weak glutes and a poorly trained core are two of the most common and most overlooked causes of lower back pain in people who exercise regularly. I know this because they were my problem. Work through them in order. The first four are corrective and foundational. The last four are builders. Don&apos;t skip ahead.
      </p>

      <ExBlock id="e1" num="Exercise 1" title="Dead Bug" subtitle="the safest core exercise you're not doing">
        <VideoEmbed videoId="tDG5Ln8XUo8" title="Dead Bug" s3Url={urlMap["m2_dead_bug"]} />
        <CB heading="What it trains"><P>Anti-extension core stability. It teaches your spine to stay neutral while your limbs move, which is exactly what happens during every compound lift you do.</P></CB>
        <CB heading="Why it's in here"><P>This was one of the first exercises I was given during my back pain recovery and it humbled me immediately. It looks easy. It is not easy when done correctly. Most people rush through it and miss the point entirely. Slow it down and you will feel exactly where your core is and isn&apos;t working.</P></CB>
        <CB heading="How to do it"><P>Lie on your back and press your lower back firmly into the floor. There should be no gap between your lower back and the ground at any point. Arms straight up toward the ceiling, knees bent at 90 degrees, shins parallel to the floor. Slowly lower your right arm overhead and your left leg toward the floor at the same time. Stop before your lower back lifts. Return and alternate sides. The moment it lifts, you have gone too far. Reduce your range of motion and rebuild from there.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 8 per side. Slow and controlled. This is not a cardio exercise.</P></CB>
      </ExBlock>

      <ExBlock id="e2" num="Exercise 2" title="Bird Dog" subtitle="spinal stability from the ground up">
        <VideoEmbed videoId="Mr73_KR-fS8" title="Bird Dog" s3Url={urlMap["m2_bird_dog"]} />
        <CB heading="What it trains"><P>Anti-rotation core stability and glute activation at the same time. Your core has to work to prevent your hips from rotating while your limbs extend, which directly translates to spinal stability during every standing exercise you do.</P></CB>
        <CB heading="Why it's in here"><P>The bird dog looks simple and gets dismissed because of it. Most people who skip it are the same people who complain about lower back tightness after every session. This movement teaches your body to extend the hip without compensating through the lower back.</P></CB>
        <CB heading="How to do it"><P>Start on all fours with your hands directly under your shoulders and your knees directly under your hips. Your back should be flat. Extend your right arm straight forward and your left leg straight back at the same time. Think about driving your heel toward the wall behind you rather than lifting your leg toward the ceiling. Hold for 2 seconds at the top, then return slowly. Alternate sides.</P></CB>
        <CB heading="What to watch for"><P>Your hips will want to rotate to lift the leg higher. Don&apos;t let them. Keep your pelvis level throughout. A useful trick when you&apos;re learning: place a water bottle on your lower back while you practice. If it falls, your hips are rotating.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 10 per side. Hold each rep at the top for a full 2 seconds before returning.</P></CB>
      </ExBlock>

      <ExBlock id="e3" num="Exercise 3" title="Glute Bridge" subtitle="activating the muscle that protects your spine">
        <VideoEmbed videoId="0mn6xjwzCvs" title="Glute Bridge" s3Url={urlMap["m2_glute_bridge"]} />
        <CB heading="What it trains"><P>Glute max activation and hip extension. This exercise teaches your body to actually use your glutes as the primary mover rather than defaulting to your lower back and hamstrings, which is a compensation pattern more common than most people realize.</P></CB>
        <CB heading="Why it's in here"><P>Most people&apos;s glutes are underactive. Even when they think they&apos;re using them, their lower back and hamstrings are doing the majority of the work. This is sometimes called gluteal amnesia and it is a direct contributor to lower back pain. The glute bridge is the most accessible way to start reestablishing that connection.</P></CB>
        <CB heading="How to do it"><P>Lie on your back with your knees bent and feet flat on the floor about hip width apart. Drive through your heels and squeeze your glutes to lift your hips off the floor. At the top your body should form a straight line from your knees to your shoulders. Squeeze hard at the top for 2 seconds, then lower with control. Do not hyperextend your lower back at the top. The height comes from the glutes, not from arching.</P></CB>
        <CB heading="Progression"><P>Once you can complete 15 clean reps with both legs and the movement feels easy, progress to the single leg glute bridge. Same movement, one leg extended, all the load on one side.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 12 to 15 reps.</P></CB>
      </ExBlock>

      <ExBlock id="e4" num="Exercise 4" title="Glute Medius Training" subtitle="the work most programs ignore">
        <CB heading="What it trains"><P>The glute medius is the side of the glute responsible for stabilizing your pelvis during walking, running, squatting, and lunging. Weakness here shows up as knee caving during squats, hip pain, and lower back instability.</P></CB>
        <CB heading="Why it's in here"><P>I was training this muscle, or at least I thought I was. What I was missing is that machine based isolation work doesn&apos;t translate the same way as functional movement patterns. Your glute medius needs to work while your body is moving, stabilizing, and under tension in real positions.</P></CB>
        <CB heading="How to do it"><P>All three exercises below train the same muscle from slightly different angles. Do them as a circuit, going through all three back to back with minimal rest, then repeating for 3 rounds.</P></CB>
        <CB heading="Band Monster Walk">
          <P>Place a resistance band just above your knees or around your ankles. Slight squat position, chest up, core braced. Walk forward and backward in small controlled steps. Keep tension on the band the entire time. Don&apos;t let your knees cave inward.</P>
        </CB>
        <VideoEmbed videoId="cR8WIVDloo4" title="Band Monster Walk" s3Url={urlMap["m2_band_monster_walk"]} />
        <CB heading="Lateral Band Walk">
          <P>Same band setup, same slight squat position. Walk side to side. Keep your feet parallel and maintain constant tension. Small controlled steps with real tension beat wide sloppy steps every time.</P>
        </CB>
        <VideoEmbed videoId="4yr4bFNYX9w" title="Lateral Band Walk" s3Url={urlMap["m2_lateral_band_walk"]} />
        <CB heading="Side Lying Hip Abduction">
          <P>Lie on your side, hips stacked, legs straight. Lift your top leg toward the ceiling with your foot flexed and toes pointing slightly down. Control the return. Add a band above the knee for more resistance when this gets easy.</P>
        </CB>
        <VideoEmbed videoId="efiJbMV-ZaE" title="Side Lying Hip Abduction" s3Url={urlMap["m2_hip_abduction"]} />
        <CB heading="Circuit"><P>3 rounds, 12 to 15 reps per side on the abduction, 20 steps each direction on the walks. Rest 30 to 45 seconds between rounds.</P></CB>
      </ExBlock>

      <ExBlock id="e5" num="Exercise 5" title="Hip Thrust" subtitle="the primary glute builder">
        <VideoEmbed videoId="Rxxd0gmzwFU" title="Hip Thrust" s3Url={urlMap["m2_hip_thrust"]} />
        <VideoEmbed videoId="8bSvHhnWVnE" title="Hip Thrust variation" s3Url={urlMap["m2_hip_thrust_var"]} />
        <CB heading="What it trains"><P>Glute max through a full range of hip extension. This is the most effective exercise for building glute strength and size and it belongs in almost every program regardless of your goal.</P></CB>
        <CB heading="Why it's in here"><P>The glute bridge in Exercise 3 teaches you the pattern and wakes up the muscle. The hip thrust is where you actually build it. The range of motion is greater, the load potential is higher, and the glute works harder through a longer stretch.</P></CB>
        <CB heading="How to do it"><P>Sit on the floor with your upper back resting against a bench. Your knees are bent and your feet are flat on the floor about hip width apart. Before you thrust, take a breath and brace your core. Drive through your heels, squeeze your glutes, and push your hips up until your body forms a straight line from your knees to your shoulders. Squeeze hard and hold for a full second. Then lower with control. Start with a barbell across your hips at a comfortable weight.</P></CB>
        <CB heading="The most common mistake"><P>Hyperextending the lower back at the top to get the hips higher. If your ribs are flaring and your back is arching, your glutes are not finishing the movement. Tuck your ribs down, squeeze harder, and let the height come from the hip extension rather than the lower back arch.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 10 to 12 reps. Add load when you can complete all reps with clean form and the top position feels fully controlled.</P></CB>
      </ExBlock>

      <ExBlock id="e6" num="Exercise 6" title="Romanian Deadlift" subtitle="building the posterior chain that keeps your back healthy">
        <VideoEmbed videoId="AyY0C8s5scU" title="Romanian Deadlift" s3Url={urlMap["m2_rdl"]} />
        <CB heading="What it trains"><P>The hamstrings, glutes, and lower back working together as a unit under load. This is your primary posterior chain builder in this program and one of the most valuable exercises you can learn early in your training.</P></CB>
        <CB heading="Why it's in here"><P>You learned the hip hinge pattern in Module 1. The Romanian deadlift is where you put that pattern to work with load. Get the pattern right first, then add the weight.</P></CB>
        <CB heading="How to do it"><P>Stand with your feet hip width apart and a soft bend in your knees. Hold a dumbbell in each hand in front of your thighs. Push your hips back as you lower the weights down the front of your legs. They should stay as close to your body as possible throughout. Lower until you feel a strong stretch in your hamstrings or until your lower back begins to round, whichever comes first. From the bottom, drive your hips forward to return to standing and squeeze your glutes at the top.</P></CB>
        <CB heading="What to watch for"><P>If you feel this more in your lower back than your hamstrings, you are likely rounding at the bottom or letting the weights drift too far from your body. Reduce the range of motion and revisit the hip hinge cues in Module 1 before adding any load.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 10 reps. Prioritize form over weight on this one every single time.</P></CB>
      </ExBlock>

      <ExBlock id="e7" num="Exercise 7" title="Pallof Press" subtitle="anti-rotation core strength">
        <VideoEmbed videoId="lae10X6yOII" title="Pallof Press" s3Url={urlMap["m2_pallof_press"]} />
        <CB heading="What it trains"><P>Your core&apos;s ability to resist rotational force. The Pallof press trains it in a standing position, which is much closer to how your core actually needs to function during real movements.</P></CB>
        <CB heading="Why it's in here"><P>Most core exercises train your abs to flex or your back to extend. The Pallof press does neither. It challenges your entire core to resist being pulled sideways. It is also one of the safest core exercises you can do because there is no spinal flexion involved at all.</P></CB>
        <CB heading="How to do it"><P>Attach a resistance band to a stable anchor point at chest height. Stand sideways to the anchor with your feet shoulder width apart and knees slightly bent. Hold the band at your chest with both hands. Brace your core fully before you move. Press the band straight out in front of you until your arms are fully extended, hold for 2 seconds, then bring it back to your chest. Your entire job is to prevent your body from rotating toward the anchor.</P></CB>
        <CB heading="What to watch for"><P>Your hips rotating toward the anchor is the most common compensation. If that is happening, step closer to the anchor and reduce the resistance until your core can genuinely control the movement.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 10 per side. Hold each rep at full extension for a full 2 seconds before returning.</P></CB>
      </ExBlock>

      <ExBlock id="e8" num="Exercise 8" title="Farmer's Carry" subtitle="full body stability you can build anywhere">
        <VideoEmbed videoId="vJIu3hgUYlg" title="Farmer's Carry" s3Url={urlMap["m2_farmers_carry"]} />
        <CB heading="What it trains"><P>Core bracing, grip strength, shoulder stability, glute activation, and postural endurance all at the same time. The farmer&apos;s carry trains your entire body to work together under load while you move, which is something no machine or isolated exercise can replicate.</P></CB>
        <CB heading="Why it's in here"><P>Carries are one of the most overlooked tools in beginner programming. The farmer&apos;s carry exposes postural weaknesses immediately. The moment your shoulders round, your core loses tension, or your gait gets uneven, the exercise is telling you something worth paying attention to.</P></CB>
        <CB heading="How to do it"><P>Pick up a dumbbell or kettlebell in each hand. Stand tall before you take a single step. Chest up, shoulders back and down, core braced, glutes slightly engaged. Now walk. Keep your steps controlled and your posture locked in for the entire distance. The challenge is not the walking, it is maintaining perfect posture while your body is under load and moving. The moment your posture breaks, the set is over.</P></CB>
        <CB heading="Progression"><P>Once the bilateral carry feels controlled, progress to the suitcase carry. Same movement but with a single weight on one side only. This creates a lateral demand on your core that forces your obliques to work hard to keep you upright. Alternate sides each set.</P></CB>
        <CB heading="Sets and reps"><P>3 sets of 20 to 30 meters. If you do not have space to walk, a 30 to 40 second hold in place works as an alternative.</P></CB>
      </ExBlock>

      <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${border}` }}>
        <Link href="/training-foundations/module1" style={{ display: "inline-block", background: "none", color: gold, border: `1px solid ${gold}`, padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          ← Module 1
        </Link>
        <Link href="/training-foundations/module3" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Module 3 →
        </Link>
      </div>
    </div>
  )
}
