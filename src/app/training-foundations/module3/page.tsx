import Link from "next/link"
import VideoEmbed from "@/components/training/VideoEmbed"
import { getPublishedVideoUrls } from "@/lib/mediaClient"
import type { Metadata } from "next"
import DayWorkoutPanel, { DayStatusBadge, MarkCompleteButton } from "@/components/training/DayWorkoutPanel.client"
import { DayLogsProvider } from "@/components/training/DayLogsContext"
import InlineExerciseTracker from "@/components/training/InlineExerciseTracker.client"
import DayWeekSelector from "@/components/training/DayWeekSelector.client"
import QuickFormTips from "@/components/training/QuickFormTips.client"

const TIPS: Record<string, string[]> = {
  // ── Main exercises – Day A ───────────────────────────────────────────────
  hip_thrust: [
    "Drive through heels, not toes.",
    "Squeeze glutes hard at the top. Hold 1 second.",
    "Ribs stay down. No lower back arch.",
    "Chin tucked, eyes forward.",
    "Shoulder blades on the bench, not your neck.",
  ],
  rdl: [
    "Push your hips back, not your arms down.",
    "Keep the weights close to your legs the entire movement.",
    "Maintain a soft bend in your knees throughout.",
    "Lower the weight slowly and with control. Do not rush the movement.",
    "Pause briefly at the bottom and feel the stretch in your hamstrings and glutes.",
    "Drive your hips forward to return to the top.",
  ],
  reverse_lunge: [
    "Control the lowering phase instead of dropping into the movement.",
    "Keep most of your weight in the front leg, not the back foot.",
    "Take a long enough step back to feel stable and balanced.",
    "Pause briefly at the bottom before driving back up.",
    "Push through your full front foot, especially the heel, to stand back up.",
  ],
  goblet_squat: [
    "Keep the weight close to your chest throughout the movement.",
    "Control the lowering phase instead of dropping into the squat.",
    "Push your knees out gently as you lower. Do not let them cave inward.",
    "Go only as low as you can while keeping your chest lifted and lower back stable.",
    "Push evenly through your whole foot to stand back up.",
  ],
  dead_bug_a: [
    "Flatten your lower back into the floor before every rep.",
    "Keep your core braced the entire time. Do not let your back arch as you extend.",
    "Move slowly and with control. This is not a speed exercise.",
    "Exhale fully as you extend your arm and leg.",
    "If you cannot keep your back flat, reduce your range of motion.",
  ],
  dead_bug_c: [
    "Flatten your lower back into the floor before every rep.",
    "Keep your core braced the entire time. Do not let your back arch as you extend.",
    "Move slowly and with control. This is not a speed exercise.",
    "Exhale fully as you extend your arm and leg.",
    "If you cannot keep your back flat, reduce your range of motion.",
  ],
  farmers_carry: [
    "Stay tall through your spine. Do not lean side to side.",
    "Keep your shoulders down and away from your ears.",
    "Brace your core as if someone is about to punch your stomach.",
    "Take small, controlled steps. Do not rush the carry.",
    "If the weight pulls your posture out of position, it is too heavy.",
  ],
  // ── Main exercises – Day B ───────────────────────────────────────────────
  db_bench: [
    "Lower the weight slowly and under control.",
    "Keep your shoulders down and stable instead of shrugging forward.",
    "Press through your full hand, not just your wrists.",
    "Stop the rep before your shoulders roll forward.",
    "Focus on smooth, controlled reps instead of rushing the movement.",
  ],
  band_pullup: [
    "Start each rep by pulling your shoulders down, not by shrugging.",
    "Think about driving your elbows down instead of pulling with your hands.",
    "Control the descent instead of dropping back down.",
    "Keep your core lightly braced and avoid swinging.",
    "Use a band that allows full control and proper form throughout the set.",
  ],
  overhead_press: [
    "Brace your core before each rep.",
    "Keep your wrists stacked over your elbows as you press.",
    "Move the weight in a straight path instead of out in front of you.",
    "Lower the weight slowly and under control.",
    "If you feel your lower back taking over, reduce the weight and reset your posture.",
  ],
  chest_row: [
    "Pull your elbows back toward your hips, not straight out to the sides.",
    "Keep your chest connected to the bench throughout the set.",
    "Pause briefly at the top and squeeze through your upper back.",
    "Lower the weight slowly instead of letting it drop.",
    "Use a weight you can fully control without swinging or shrugging your shoulders.",
  ],
  bicep_curl: [
    "Keep your upper arms still throughout the movement.",
    "Lower the weight slowly instead of letting it drop.",
    "Squeeze the biceps briefly at the top of each rep.",
    "Keep your wrists neutral instead of bending them back.",
    "If you need to swing your body to lift the weight, it is too heavy.",
  ],
  tricep_ext: [
    "Keep your upper arms as still as possible throughout the movement.",
    "Lower the weight slowly and under control.",
    "Keep your core braced and avoid arching your lower back.",
    "Fully straighten your arms at the top without locking aggressively.",
    "If your elbows flare too much, reduce the weight and regain control.",
  ],
  pallof_press: [
    "Keep your ribs down and hips square throughout the movement.",
    "Press slowly straight out from your chest without twisting.",
    "The goal is to resist movement, not rotate with the cable or band.",
    "Breathe out as you press and keep your core tight.",
    "If you feel yourself rotating or losing posture, reduce the resistance.",
  ],
  // ── Main exercises – Day C ───────────────────────────────────────────────
  sl_glute_bridge: [
    "Keep your ribs down and core lightly braced throughout.",
    "Push through the heel of the working leg, not the toes.",
    "Pause briefly at the top and fully squeeze the glute.",
    "Do not overarch your lower back to lift higher.",
    "Focus on control and hip stability more than height.",
  ],
  pushup_c: [
    "Keep your body in a straight line from head to knees or heels.",
    "Lower yourself under control instead of dropping quickly.",
    "Keep your core braced and avoid letting your hips sag.",
    "Push the floor away at the top of each rep.",
    "Quality reps matter more than forcing full push-ups with poor form.",
  ],
  inverted_row: [
    "Keep your core braced and avoid letting your hips sag.",
    "Think about pulling your elbows toward your hips.",
    "Lead with your chest instead of reaching your chin toward the bar.",
    "Pause briefly at the top and squeeze through your upper back.",
    "Bend your knees slightly if you need to make the movement easier while learning proper control.",
  ],
  monster_walk: [
    "Take controlled steps without letting the band snap your legs back together.",
    "Keep your feet parallel instead of turning your toes outward.",
    "Stay low enough to feel the glutes working, but not so low that you lose posture.",
    "Keep tension on the band during both the forward and backward walk.",
    "You should feel this mostly in the glutes and outer hips, not the lower back.",
  ],
  hip_abduction_c: [
    "Keep your hips stacked instead of rolling backward.",
    "Lift only as high as you can without shifting your torso.",
    "Pause briefly at the top and squeeze the side glute.",
    "Lower the leg slowly instead of letting it drop.",
    "You should feel this in the side glute and outer hip, not the lower back.",
  ],
  copenhagen: [
    "Keep your body in a straight line from shoulders to knees.",
    "Brace your core and avoid letting your hips rotate or sag.",
    "Push firmly through the supporting arm to stay stable.",
    "Focus on squeezing the inner thigh of the elevated leg throughout the hold.",
    "If the full version is too difficult, shorten the hold time or reduce the lever length slightly.",
  ],
  stir_the_pot: [
    "Keep your core braced as if someone is about to punch your stomach.",
    "Move slowly and keep the circles small and controlled.",
    "Do not let your hips sway side to side as the ball moves.",
    "Push actively through your forearms to stay stable.",
    "If your lower back starts to arch, reset or make the circles smaller.",
  ],
  // ── Warm-up tips ────────────────────────────────────────────────────────
  wu_9090_hip: [
    "Stay tall through your torso instead of collapsing forward.",
    "Move slowly and with control between each side.",
    "Only rotate as far as your hips can move comfortably.",
    "Use your hands for support if needed.",
    "Focus on smooth movement and hip control, not forcing depth.",
  ],
  wu_cat_cow: [
    "Reach your chest forward during the extension phase.",
    "Tuck your chin slightly as you round your upper back.",
    "Focus on smooth spinal movement, not forcing range.",
    "Use your breathing to control the pace of each rep.",
  ],
  wu_worlds_greatest: [
    "Take your time transitioning through each position.",
    "Keep your front foot planted firmly on the floor.",
    "Rotate through your upper back, not your lower back.",
    "If you cannot touch your elbow to the floor comfortably, only go as low as your mobility allows.",
    "Breathe out as you rotate and open your chest.",
  ],
  wu_glute_bridge: [
    "Keep your ribs down and core lightly braced throughout.",
    "Drive through your heels to lift your hips.",
    "Pause briefly at the top and fully squeeze your glutes.",
    "Do not overarch your lower back to lift higher.",
    "Move slowly and with control instead of rushing the reps.",
  ],
  wu_lateral_band_walk: [
    "Stay low enough to keep tension on the band the entire time.",
    "Keep your feet parallel instead of letting them turn outward.",
    "Take controlled steps without letting the band snap your legs back in.",
    "Keep your core braced and avoid swaying side to side.",
    "You should feel this mostly in the side glutes, not the hips or lower back.",
  ],
  wu_leg_swing_fb: [
    "Keep your torso tall instead of leaning back.",
    "Start with a smaller range of motion and gradually increase it.",
    "Control the swing both forward and backward.",
    "Keep your core lightly braced throughout.",
    "Move smoothly without using momentum or jerking the leg.",
  ],
  wu_lateral_lunge: [
    "Push your hips back as you lower into the movement.",
    "Keep the opposite leg long and relaxed instead of forcing depth.",
    "Keep your foot fully planted on the working side.",
    "Drive through the heel to return to the starting position.",
    "If you feel pulling or discomfort, reduce the range of motion.",
  ],
  wu_thoracic_rot: [
    "Keep your hips stable as you rotate.",
    "Follow your hand with your eyes to encourage more upper back rotation.",
    "Breathe out as you open your chest.",
    "Move only through a range that feels controlled and comfortable.",
    "Do not force the rotation or compensate through your lower back.",
  ],
  wu_arm_circles: [
    "Keep your shoulders relaxed instead of shrugging upward.",
    "Move slowly and under control, not with momentum.",
    "Focus on smooth movement through the shoulders.",
    "Keep your ribs down and core lightly braced.",
    "Increase the size of the circles gradually as the movement feels more comfortable.",
  ],
  wu_band_pull_apart: [
    "Pull the band apart using your upper back, not your neck.",
    "Keep your arms at shoulder height throughout the movement.",
    "Control the return instead of letting the band snap back.",
    "Keep your ribs down and avoid arching your lower back.",
    "Pause briefly at the end of each rep and squeeze between your shoulder blades.",
  ],
  wu_ytw_raise: [
    "Move slowly and focus on shoulder control, not momentum.",
    "Keep your shoulders down and away from your ears.",
    "Squeeze gently through your upper back at each position.",
    "Use a smaller range of motion if you feel tension in your neck.",
    "Quality matters more than resistance on this exercise.",
  ],
  wu_scap_pushup: [
    "Push the floor away at the top to fully separate your shoulder blades.",
    "Let your chest sink slightly between your shoulders on the way down.",
    "Keep your core braced and body in a straight line throughout.",
    "Move slowly and focus on shoulder blade movement, not elbow bending.",
    "Start with a smaller range of motion if shoulder control is difficult at first.",
  ],
  // ── Cooldown tips – Day A ────────────────────────────────────────────────
  cd_hip_flexor: [
    "Tuck your pelvis slightly to increase the stretch in the front of the hip.",
    "Stay tall through your torso. Do not arch your lower back.",
    "Breathe slowly and relax into the position instead of forcing the stretch.",
    "You should feel a stretch through the front of the hip, not pain in the lower back.",
    "Hold the position continuously for the full 30 seconds per side.",
  ],
  cd_hamstring_9090: [
    "Keep the opposite leg relaxed on the floor.",
    "Hold behind your thigh or calf, not directly on the knee.",
    "Keep a soft bend in the stretching leg if needed.",
    "Pull gently until you feel a stretch through the hamstring, not pain behind the knee.",
    "Breathe slowly and hold the position continuously for the full 30 seconds per side.",
  ],
  cd_figure4: [
    "Keep your lower back relaxed against the floor.",
    "Gently pull the supporting leg toward you to deepen the stretch.",
    "Flex the foot of the crossed leg to protect the knee.",
    "You should feel the stretch deep in the glute and outer hip.",
    "Breathe slowly and relax into the position instead of forcing it.",
  ],
  cd_childs_pose: [
    "Reach your arms forward and let your chest sink toward the floor.",
    "Relax your shoulders and neck instead of holding tension.",
    "Breathe slowly into your stomach and lower back.",
    "Sit back only as far as feels comfortable for your hips and knees.",
    "Use this position to slow your breathing and fully decompress after training.",
  ],
  // ── Cooldown tips – Day B ────────────────────────────────────────────────
  cd_open_book: [
    "Rotate through your upper back, not your lower back.",
    "Keep the bottom knee anchored to the floor as much as possible.",
    "Open your chest slowly instead of forcing the range.",
    "Breathe out as you rotate into the stretch.",
    "Relax your shoulders and neck as you hold the position.",
  ],
  cd_band_lat: [
    "Reach long through the top arm without shrugging your shoulder.",
    "Shift your hips slightly away from the stretching side to deepen the stretch.",
    "Keep your ribs down instead of overextending your lower back.",
    "Breathe slowly and let the stretch open up gradually.",
    "You should feel the stretch along the side of your back and lat, not pain in the shoulder.",
  ],
  cd_thread_needle: [
    "Reach your arm as far through as feels comfortable without forcing the range.",
    "Keep your hips relatively stable as you rotate.",
    "Relax your neck and shoulders into the stretch.",
    "Breathe slowly and allow your upper back to open up with each exhale.",
    "You should feel the stretch through the upper back and back of the shoulder, not pain in the neck.",
  ],
  cd_triceps_stretch: [
    "Keep your chest tall instead of flaring your ribs forward.",
    "Gently pull the elbow inward until you feel the stretch through the back of the arm.",
    "Keep your neck and shoulders relaxed.",
    "Breathe slowly and let the stretch deepen naturally.",
    "You should feel this in the tricep and side of the shoulder, not pain in the elbow joint.",
  ],
  // ── Cooldown tips – Day C ────────────────────────────────────────────────
  cd_spinal_twist: [
    "Keep your shoulders relaxed and as close to the floor as possible.",
    "Let the knees fall only as far as feels comfortable.",
    "Breathe slowly and relax deeper into the stretch with each exhale.",
    "Focus on relaxing the lower back and hips instead of forcing rotation.",
    "If the stretch feels too intense, place a pillow or support under the knees.",
  ],
}

export const metadata: Metadata = {
  title: "Module 3: The 4-Week Program | Lisa Fit Method",
}

const gold = "#c9a96e"
const cream = "#f0e6d3"
const border = "#2a2a2a"
const cardBg = "#161616"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </div>
  )
}

function SubLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", marginBottom: "1.5rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${border}`, fontFamily: "var(--font-montserrat), sans-serif", scrollMarginTop: "80px" }}>
      {children}
    </div>
  )
}

function WarmupItem({ name, note, videoId, s3Url, tips }: { name: string; note: string; videoId?: string; s3Url?: string; tips?: string[] }) {
  return (
    <div style={{ paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
      <div style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", alignItems: "flex-start" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: gold, marginTop: "0.55rem", flexShrink: 0, opacity: 0.6 }} />
        <div>
          <div style={{ fontSize: "0.85rem", color: cream, fontWeight: 400 }}>{name}</div>
          <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.15rem" }}>{note}</div>
        </div>
      </div>
      {videoId && <VideoEmbed videoId={videoId} title={name} s3Url={s3Url} />}
      {tips && <QuickFormTips tips={tips} />}
    </div>
  )
}

function ExerciseRow({ name, prescription, note, videoIds, s3Urls }: { name: string; prescription: string; note: string; videoIds?: string[]; s3Urls?: (string | undefined)[] }) {
  return (
    <>
      <div style={{ padding: "1.25rem 0 0.75rem" }}>
        <div style={{ fontSize: "0.9rem", color: cream, fontWeight: 400, marginBottom: "0.25rem" }}>{name}</div>
        <div style={{ fontSize: "0.75rem", color: gold, marginBottom: "0.25rem" }}>{prescription}</div>
        <div style={{ fontSize: "0.78rem", color: "#888", lineHeight: 1.3 }}>{note}</div>
      </div>
      {videoIds?.map((id, i) => <VideoEmbed key={i} videoId={id} title={name} s3Url={s3Urls?.[i]} />)}
    </>
  )
}

function Superset({ tag, note, children }: { tag: string; note: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.2)", padding: "1.25rem", margin: "1rem 0" }}>
      <div style={{ display: "inline-block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0a0a0a", background: gold, padding: "0.2rem 0.5rem", marginBottom: "0.75rem" }}>
        {tag}
      </div>
      <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "1rem" }}>{note}</p>
      {children}
    </div>
  )
}

function ExerciseDivider() {
  return <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem", marginTop: "0.5rem" }} />
}

function BeginnerNote() {
  return (
    <div style={{ background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.2)", borderLeft: "3px solid rgba(201,169,110,0.4)", padding: "1.25rem 1.5rem", marginBottom: "2.5rem" }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
        Beginner Note
      </div>
      <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.65, margin: 0 }}>
        You do not need to use weight right away or match my exact depth or range of motion in the videos. Focus first on understanding the movement, controlling your body, and using proper form. Move within a range that feels safe for you. You should feel muscle effort and activation, but you should not feel sharp pain, joint pain, pulling, or anything that feels wrong. Do not force depth, speed, or heavier weight before your body is ready.
      </p>
    </div>
  )
}

function DayBlock({ id, day, title, children }: { id: string; day: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ background: cardBg, border: `1px solid ${border}`, marginBottom: "2.5rem", overflow: "hidden", scrollMarginTop: "80px" }}>
      <div style={{ padding: "1.5rem 2rem", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "baseline", gap: "1rem" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>{day}</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 400, color: cream }}>{title}</div>
      </div>
      <div style={{ padding: "2rem" }}>
        {children}
      </div>
    </div>
  )
}

export default async function Module3Page() {
  const urlMap = await getPublishedVideoUrls([
    // Day A warm-up
    "m3a_wu_9090_hip", "m3a_wu_cat_cow", "m3a_wu_worlds_stretch",
    "m3a_wu_glute_bridge", "m3a_wu_lat_band_walk", "m3a_wu_leg_swing_fb", "m3a_wu_lateral_lunge",
    // Day A working sets
    "m3a_hip_thrust", "m3a_hip_thrust_var", "m3a_rdl", "m3c_rev_lunge",
    "m3a_goblet_squat", "m3a_dead_bug", "m3a_farmers_carry",
    // Day A cool-down
    "m3a_cd_hip_flexor", "m3a_cd_hamstring", "m3a_cd_figure4", "m3a_cd_childs_pose",
    // Day B warm-up
    "m3b_wu_cat_cow", "m3b_wu_thoracic_rot", "m3b_wu_worlds_stretch", "m3b_wu_arm_circles",
    "m3b_wu_band_pull_apart", "m3b_wu_ytw_raise",
    // Day B working sets
    "m3b_db_bench", "m3b_pushup", "m3b_band_pullup", "m3b_ohp", "m3b_chest_row",
    "m3b_db_curl", "m3b_tri_extension", "m3b_pallof_press",
    // Day B cool-down
    "m3b_cd_open_book", "m3b_cd_band_lat", "m3b_cd_thread_needle", "m3b_cd_triceps",
    // Day C warm-up
    "m3c_wu_9090_hip", "m3c_wu_cat_cow", "m3c_wu_thoracic_rot", "m3c_wu_worlds_stretch",
    "m3c_wu_glute_bridge", "m3c_wu_scap_pushup", "m3c_wu_leg_swing_fb",
    // Day C working sets
    "m3c_sl_glute_bridge", "m3c_rev_lunge", "m3c_pushup", "m3c_inv_row",
    "m3c_band_monster_walk", "m3c_hip_abduction", "m3c_dead_bug", "m3c_copenhagen", "m3c_stir_pot",
    // Day C cool-down
    "m3c_cd_hip_flexor", "m3c_cd_figure4", "m3c_cd_spinal_twist", "m3c_cd_childs_pose",
  ])

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`@media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }`}</style>

      <SectionLabel>Module 3</SectionLabel>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1.25rem" }}>
        The 4-Week Program
      </h2>

      <p style={{ fontSize: "0.95rem", color: cream, lineHeight: 1.55, marginBottom: "1rem", fontStyle: "italic" }}>
        Everything in Modules 1 and 2 was preparation. Now it&apos;s time to apply it.
      </p>
      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.6, marginBottom: "0.85rem" }}>
        This program is built around the exact principles you just learned: movement quality, controlled progression, proper recovery, and building strength with intention instead of just chasing exhaustion.
      </p>
      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.6, marginBottom: "1.75rem" }}>
        The program runs 3 days per week with at least one rest day between sessions. Each workout takes roughly 45 to 60 minutes including your warm-up and cooldown. Those are not optional. They are part of the program.
      </p>

      {/* Program structure card */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          Program Structure
        </div>
        <div style={{ background: cardBg, border: `1px solid ${border}` }}>
          {[
            { day: "Day A", name: "Lower Body Strength",  desc: "Glutes, legs, stability, and foundational strength" },
            { day: "Day B", name: "Upper Body Strength",   desc: "Pressing, pulling, posture, and shoulder stability" },
            { day: "Day C", name: "Integration & Core",    desc: "Full-body control, core stability, and movement integration" },
          ].map(({ day, name, desc }, i, arr) => (
            <div key={day} style={{ display: "flex", alignItems: "stretch", borderBottom: i < arr.length - 1 ? `1px solid ${border}` : "none" }}>
              <div style={{ width: 3, background: gold, flexShrink: 0 }} />
              <div style={{ padding: "0.9rem 1.25rem", width: 68, flexShrink: 0, display: "flex", alignItems: "center", borderRight: `1px solid ${border}` }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", color: gold, textTransform: "uppercase", fontFamily: "var(--font-montserrat), sans-serif" }}>{day}</span>
              </div>
              <div style={{ padding: "0.9rem 1.25rem", flex: 1 }}>
                <div style={{ fontSize: "0.82rem", color: cream, fontWeight: 400, marginBottom: "0.2rem" }}>{name}</div>
                <div style={{ fontSize: "0.7rem", color: "#888", lineHeight: 1.35 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.6, marginBottom: "0.6rem" }}>
        The goal is not to destroy yourself every session. The goal is to move well, progress consistently, recover properly, and build a body that gets stronger over time.
      </p>
      <p style={{ fontSize: "0.9rem", color: cream, lineHeight: 1.55, marginBottom: "2rem", fontStyle: "italic" }}>
        Now let&apos;s get started.
      </p>

      <div style={{ padding: "1.5rem 2rem", background: cardBg, border: `1px solid ${border}`, marginBottom: "2rem" }}>
        <SectionLabel>How to read the program</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.45, marginBottom: "1rem" }}>
          Sets x Reps. So 3x10 means 3 sets of 10 repetitions. Rest 60 to 90 seconds between sets on most exercises. For heavier compound movements like the hip thrust, Romanian deadlift, and goblet squat, take a full 2 minutes between sets.
        </p>
        <SectionLabel>How to progress</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.45, marginBottom: "1rem" }}>
          If you complete all sets and reps with clean form and the last few reps feel challenging but controlled, add a small amount of weight next session. For dumbbells that usually means going up one size. If the form breaks down before you finish the reps, stay at the same weight until it does not.
        </p>
        <SectionLabel>Track your progress</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.45 }}>
          Log your sets right under each exercise as you go, or use the full tracker panel at the bottom of each day. Both are linked so entering data in one updates the other. Use the sidebar links to jump straight to any day&apos;s tracker.
        </p>
      </div>

      <BeginnerNote />

      {/* ── DAY A ──────────────────────────────────────────────── */}
      <DayBlock id="daya" day="Day A" title="Lower Body Strength">

        <SubLabel id="daya-warmup">Warm-Up · 10 minutes</SubLabel>
        <WarmupItem
          name="90/90 Hip Mobility Stretch"
          note="8-10 reps per side, alternating. Move slowly between sides and breathe into the stretch. Do not force the range of motion."
          videoId="VbjfMt1C_y8"
          s3Url={urlMap["m3a_wu_9090_hip"]}
          tips={TIPS["wu_9090_hip"]}
        />
        <WarmupItem
          name="Cat-Cow"
          note="10 reps. Move slowly through the full range of motion. Inhale as you extend, exhale as you round."
          videoId="SboCzGvi8RE"
          s3Url={urlMap["m3a_wu_cat_cow"]}
          tips={TIPS["wu_cat_cow"]}
        />
        <WarmupItem
          name="World's Greatest Stretch"
          note="5 reps per side. Move slowly and with control. Focus on opening the hips, thoracic spine, and hamstrings through the full movement."
          videoId="FYWN63ij0bE"
          s3Url={urlMap["m3a_wu_worlds_stretch"]}
          tips={TIPS["wu_worlds_greatest"]}
        />
        <WarmupItem
          name="Glute Bridge (Activation)"
          note="1 set x 15 reps. Squeeze hard at the top and focus on feeling your glutes working. This is to activate the muscles, not to fatigue them."
          videoId="0mn6xjwzCvs"
          s3Url={urlMap["m3a_wu_glute_bridge"]}
          tips={TIPS["wu_glute_bridge"]}
        />
        <WarmupItem
          name="Lateral Band Walk (Activation)"
          note="1 set x 15 steps each direction. Use a light band and focus on controlled movement. This is to activate the glutes, not to burn them out."
          videoId="4yr4bFNYX9w"
          s3Url={urlMap["m3a_wu_lat_band_walk"]}
          tips={TIPS["wu_lateral_band_walk"]}
        />
        <WarmupItem
          name="Leg Swing Front to Back"
          note="10 reps per side. Hold onto something for balance and keep the movement controlled. This is to loosen up the hips, not to swing as hard as possible."
          videoId="8BgLrTI2SO4"
          s3Url={urlMap["m3a_wu_leg_swing_fb"]}
          tips={TIPS["wu_leg_swing_fb"]}
        />
        <WarmupItem
          name="Lateral Lunge"
          note="8 reps per side. Move slowly and with control. Sit into the hip, keep the working knee tracking over the toes, and only go as low as you can control. You do not need to match the depth shown in the video."
          videoId="EVKyneKe5w8"
          s3Url={urlMap["m3a_wu_lateral_lunge"]}
          tips={TIPS["wu_lateral_lunge"]}
        />

        <DayStatusBadge day="a" />

        <DayLogsProvider day="a">
          <div id="daya-tracker" style={{ scrollMarginTop: "80px" }}>
            <DayWeekSelector />

            <SubLabel>Main Workout</SubLabel>
            <ExerciseRow
              name="Hip Thrust"
              prescription="3 sets x 10-12 reps, 2 min rest"
              note="Drive through your heels, squeeze hard at the top, ribs down. Start with a dumbbell first, then progress to a barbell or single-leg variation when you feel comfortable. The last few reps should feel challenging without losing form."
              videoIds={["Rxxd0gmzwFU", "8bSvHhnWVnE"]}
              s3Urls={[urlMap["m3a_hip_thrust"], urlMap["m3a_hip_thrust_var"]]}
            />
            <QuickFormTips tips={TIPS["hip_thrust"]} />
            <InlineExerciseTracker day="a" exerciseId="hip_thrust" />
            <ExerciseDivider />
            <ExerciseRow
              name="Romanian Deadlift"
              prescription="3 sets x 10 reps, 2 min rest"
              note="Push your hips back, not your arms down. Keep the weights close to your body, maintain a straight back, and stop before your lower back rounds."
              videoIds={["AyY0C8s5scU"]}
              s3Urls={[urlMap["m3a_rdl"]]}
            />
            <QuickFormTips tips={TIPS["rdl"]} />
            <InlineExerciseTracker day="a" exerciseId="rdl" />
            <ExerciseDivider />
            <ExerciseRow
              name="Reverse Lunge"
              prescription="3 sets x 10 reps per side, 90 sec rest"
              note="Step back into the lunge rather than forward. Keep your chest up, front knee tracking over your toes, and back knee hovering just above the floor. Drive through your front heel to return to standing."
              videoIds={["ysR2LxObJbo"]}
              s3Urls={[urlMap["m3c_rev_lunge"]]}
            />
            <QuickFormTips tips={TIPS["reverse_lunge"]} />
            <InlineExerciseTracker day="a" exerciseId="reverse_lunge" />
            <ExerciseDivider />
            <ExerciseRow
              name="Goblet Squat"
              prescription="3 sets x 10 reps, 2 min rest"
              note="Keep your chest up, knees tracking over your toes, and sit between your heels rather than behind them."
              videoIds={["NYf82VuzrQM"]}
              s3Urls={[urlMap["m3a_goblet_squat"]]}
            />
            <QuickFormTips tips={TIPS["goblet_squat"]} />
            <InlineExerciseTracker day="a" exerciseId="goblet_squat" />
            <ExerciseDivider />
            <ExerciseRow
              name="Dead Bug"
              prescription="3 sets x 8 reps per side, 60 sec rest"
              note="Brace your core and press your entire lower back into the floor before you start. The moment your back lifts or arches, you've gone too far. Slow this down. You can add a light dumbbell overhead once the movement feels controlled and easy."
              videoIds={["tDG5Ln8XUo8"]}
              s3Urls={[urlMap["m3a_dead_bug"]]}
            />
            <QuickFormTips tips={TIPS["dead_bug_a"]} />
            <InlineExerciseTracker day="a" exerciseId="dead_bug_a" />
            <ExerciseDivider />
            <ExerciseRow
              name="Farmer's Carry"
              prescription="2 sets x 20 to 30 meters, 90 sec rest"
              note="Keep a tall spine, shoulders back and down, and your core braced the entire time. Walk slowly and under control."
              videoIds={["vJIu3hgUYlg"]}
              s3Urls={[urlMap["m3a_farmers_carry"]]}
            />
            <QuickFormTips tips={TIPS["farmers_carry"]} />
            <InlineExerciseTracker day="a" exerciseId="farmers_carry" />
            <ExerciseDivider />

            <SubLabel id="daya-cooldown">Cool-Down · 5 minutes</SubLabel>
            <p style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6, marginBottom: "1.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(201,169,110,0.2)" }}>
              Cooldowns are not about forcing flexibility. Hold each stretch for around 30 seconds, breathe slowly, and only move into a range that feels comfortable. The video shows the movement, but your range may look different, and that is completely fine. Stretching should feel controlled, not painful.
            </p>
            <WarmupItem
              name="Kneeling Hip Flexor Stretch"
              note="Hold the stretch position for the full 30 seconds per side. These muscles tend to tighten up on lower body days and can contribute directly to lower back discomfort if left unaddressed."
              videoId="cfqgjN8b2vg"
              s3Url={urlMap["m3a_cd_hip_flexor"]}
              tips={TIPS["cd_hip_flexor"]}
            />
            <WarmupItem
              name="90/90 Hamstring Stretch"
              note="Hold the stretch for the full 30 seconds per side. Do not force the range. Breathe slowly and relax into the stretch over time."
              videoId="4vIoROvmLQM"
              s3Url={urlMap["m3a_cd_hamstring"]}
              tips={TIPS["cd_hamstring_9090"]}
            />
            <WarmupItem
              name="Figure 4 Stretch"
              note="Hold the stretch for the full 30 seconds per side. You just worked your glutes hard, they need this."
              videoId="5QdSahBkG20"
              s3Url={urlMap["m3a_cd_figure4"]}
              tips={TIPS["cd_figure4"]}
            />
            <WarmupItem
              name="Child's Pose"
              note="Hold the position for the full 30 seconds. Focus on breathing deeply and letting your body relax into the stretch."
              videoId="NWUojZcToTE"
              s3Url={urlMap["m3a_cd_childs_pose"]}
              tips={TIPS["cd_childs_pose"]}
            />

            <MarkCompleteButton />
            <div id="daya-log" style={{ scrollMarginTop: "80px" }}>
              <DayWorkoutPanel day="a" />
            </div>
          </div>
        </DayLogsProvider>
      </DayBlock>

      {/* ── DAY B ──────────────────────────────────────────────── */}
      <DayBlock id="dayb" day="Day B" title="Upper Body Strength">

        <SubLabel id="dayb-warmup">Warm-Up · 10 minutes</SubLabel>
        <WarmupItem
          name="Cat-Cow"
          note="10 reps. Move slowly through the full range of motion. Inhale as you extend, exhale as you round."
          videoId="SboCzGvi8RE"
          s3Url={urlMap["m3b_wu_cat_cow"]}
          tips={TIPS["wu_cat_cow"]}
        />
        <WarmupItem
          name="Thoracic Rotation"
          note="8 reps per side. Move slowly and focus on rotating through your upper back, not your lower back. Good thoracic mobility can make a real difference in how your shoulders feel during pressing movements."
          videoId="VYMF16KVAw8"
          s3Url={urlMap["m3b_wu_thoracic_rot"]}
          tips={TIPS["wu_thoracic_rot"]}
        />
        <WarmupItem
          name="World's Greatest Stretch"
          note="5 reps per side. Move slowly and with control. Focus on opening the hips, thoracic spine, and hamstrings through the full movement."
          videoId="FYWN63ij0bE"
          s3Url={urlMap["m3b_wu_worlds_stretch"]}
          tips={TIPS["wu_worlds_greatest"]}
        />
        <WarmupItem
          name="Arm Circles"
          note="10 forward, 10 backward. Start with small circles and gradually increase the range as your shoulders loosen up."
          videoId="S1uYL7_nL00"
          s3Url={urlMap["m3b_wu_arm_circles"]}
          tips={TIPS["wu_arm_circles"]}
        />
        <WarmupItem
          name="Band Pull-Apart"
          note="2 sets x 15 reps. Keep your shoulders down throughout the movement and squeeze your upper back at the end of every rep."
          videoId="H-RxZVrZH2I"
          s3Url={urlMap["m3b_wu_band_pull_apart"]}
          tips={TIPS["wu_band_pull_apart"]}
        />
        <WarmupItem
          name="YTW Raise"
          note="2 sets x 10 reps. Use a light band or no weight at all. Control every position and pause briefly at each letter instead of rushing through the movement."
          videoId="JYsBIb4R4xo"
          s3Url={urlMap["m3b_wu_ytw_raise"]}
          tips={TIPS["wu_ytw_raise"]}
        />

        <DayStatusBadge day="b" />

        <DayLogsProvider day="b">
          <div id="dayb-tracker" style={{ scrollMarginTop: "80px" }}>
            <DayWeekSelector />

            <SubLabel>Main Workout</SubLabel>
            <ExerciseRow
              name="Dumbbell Bench Press or Push-Up"
              prescription="3 sets x 10 reps, 90 sec rest"
              note="Keep your elbows at roughly 45 degrees, set your shoulder blades before you press, and keep your wrists stacked over your elbows throughout the movement."
              videoIds={["vZTUnLTRkOg", "oZmBz-BN7ZY"]}
              s3Urls={[urlMap["m3b_db_bench"], urlMap["m3b_pushup"]]}
            />
            <QuickFormTips tips={TIPS["db_bench"]} />
            <InlineExerciseTracker day="b" exerciseId="db_bench" />
            <ExerciseDivider />
            <ExerciseRow
              name="Band Assisted Pull-Up or Lat Pulldown"
              prescription="3 sets x 8 reps, 90 sec rest"
              note="Loop the band securely around the bar and place your knee into it. Pull your elbows down toward your back pockets, lead with your chest, and control the lowering phase. Over time, work toward using less assistance and eventually performing the movement without the band."
              videoIds={["H-RxZVrZH2I"]}
              s3Urls={[urlMap["m3b_band_pullup"]]}
            />
            <QuickFormTips tips={TIPS["band_pullup"]} />
            <InlineExerciseTracker day="b" exerciseId="band_pullup" />
            <ExerciseDivider />
            <ExerciseRow
              name="Overhead Press"
              prescription="3 sets x 10 reps, 90 sec rest"
              note="Core braced throughout, ribs down, do not let your lower back arch as you press overhead. Press the weight up and slightly back."
              videoIds={["H8-O20oL3yc"]}
              s3Urls={[urlMap["m3b_ohp"]]}
            />
            <QuickFormTips tips={TIPS["overhead_press"]} />
            <InlineExerciseTracker day="b" exerciseId="overhead_press" />
            <ExerciseDivider />
            <ExerciseRow
              name="Chest Supported Row"
              prescription="3 sets x 12 reps, 90 sec rest"
              note="Because your chest is supported against the bench, your lower back stays out of the movement. Do not use momentum to cheat the rep. Squeeze fully at the top of every rep and control the lowering phase."
              videoIds={["eKT-r-SV4x0"]}
              s3Urls={[urlMap["m3b_chest_row"]]}
            />
            <QuickFormTips tips={TIPS["chest_row"]} />
            <InlineExerciseTracker day="b" exerciseId="chest_row" />
            <ExerciseDivider />
            <Superset tag="Superset: Arms" note="No rest between the two exercises. Rest 60 seconds after both are done. 3 rounds.">
              <ExerciseRow
                name="Dumbbell Curl"
                prescription="10 to 12 reps"
                note="Keep your elbows pinned at your sides, control the lowering phase, and do not swing the weight up."
                videoIds={["rPcp_rfWLRU"]}
                s3Urls={[urlMap["m3b_db_curl"]]}
              />
              <QuickFormTips tips={TIPS["bicep_curl"]} />
              <InlineExerciseTracker day="b" exerciseId="bicep_curl" />
              <ExerciseDivider />
              <ExerciseRow
                name="Overhead Tricep Extension"
                prescription="10 to 12 reps"
                note="Keep your elbows pointing forward and close to your head, lower the weight slowly behind you, press back up to full extension."
                videoIds={["uht9IRmLvcQ"]}
                s3Urls={[urlMap["m3b_tri_extension"]]}
              />
              <QuickFormTips tips={TIPS["tricep_ext"]} />
              <InlineExerciseTracker day="b" exerciseId="tricep_ext" />
            </Superset>
            <ExerciseDivider />
            <ExerciseRow
              name="Pallof Press"
              prescription="3 sets x 10 reps per side, 60 sec rest"
              note="Brace hard before you press, resist the rotation the entire time, hold 2 seconds at full extension."
              videoIds={["lae10X6yOII"]}
              s3Urls={[urlMap["m3b_pallof_press"]]}
            />
            <QuickFormTips tips={TIPS["pallof_press"]} />
            <InlineExerciseTracker day="b" exerciseId="pallof_press" />
            <ExerciseDivider />

            <SubLabel id="dayb-cooldown">Cool-Down · 5 minutes</SubLabel>
            <p style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6, marginBottom: "1.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(201,169,110,0.2)" }}>
              Cooldowns are not about forcing flexibility. Hold each stretch for around 30 seconds, breathe slowly, and only move into a range that feels comfortable. The video shows the movement, but your range may look different, and that is completely fine. Stretching should feel controlled, not painful.
            </p>
            <WarmupItem
              name="Open Book Stretch"
              note="Hold the stretch for the full 30 seconds per side. This thoracic rotation stretch helps release tension through the upper back and chest after pressing and pulling movements."
              videoId="YJ92IS_RuRY"
              s3Url={urlMap["m3b_cd_open_book"]}
              tips={TIPS["cd_open_book"]}
            />
            <WarmupItem
              name="Band Lat Stretch"
              note="Hold the band with both hands and gently shift your hips away until you feel the stretch through the side of your back and lats."
              videoId="lQuimKNJRWU"
              s3Url={urlMap["m3b_cd_band_lat"]}
              tips={TIPS["cd_band_lat"]}
            />
            <WarmupItem
              name="Thread the Needle Stretch"
              note="Hold the position for the full 30 seconds per side. This stretch helps improve thoracic rotation and release tension through the upper back and shoulders."
              videoId="GJGSah1mNWw"
              s3Url={urlMap["m3b_cd_thread_needle"]}
              tips={TIPS["cd_thread_needle"]}
            />
            <WarmupItem
              name="Triceps Stretch"
              note="Hold the stretch for the full 30 seconds per side. You just worked your triceps directly, so give them a proper stretch before finishing the session."
              videoId="44rhonVBVRU"
              s3Url={urlMap["m3b_cd_triceps"]}
              tips={TIPS["cd_triceps_stretch"]}
            />

            <MarkCompleteButton />
            <div id="dayb-log" style={{ scrollMarginTop: "80px" }}>
              <DayWorkoutPanel day="b" />
            </div>
          </div>
        </DayLogsProvider>
      </DayBlock>

      {/* ── DAY C ──────────────────────────────────────────────── */}
      <DayBlock id="dayc" day="Day C" title="Integration & Core">
        <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.45, marginBottom: "2rem" }}>
          This day has a different feel to it. The loading is lighter, the focus is on movement quality, single leg stability, posture, and tying everything you have been building together. Think of it as the day you reinforce the patterns rather than push the intensity.
        </p>

        <SubLabel id="dayc-warmup">Warm-Up · 10 minutes</SubLabel>
        <WarmupItem
          name="90/90 Hip Mobility Stretch"
          note="8-10 reps per side, alternating. Move slowly between sides and breathe into the stretch. Do not force the range of motion."
          videoId="VbjfMt1C_y8"
          s3Url={urlMap["m3c_wu_9090_hip"]}
          tips={TIPS["wu_9090_hip"]}
        />
        <WarmupItem
          name="Cat-Cow"
          note="10 reps. Move slowly through the full range of motion. Inhale as you extend, exhale as you round."
          videoId="SboCzGvi8RE"
          s3Url={urlMap["m3c_wu_cat_cow"]}
          tips={TIPS["wu_cat_cow"]}
        />
        <WarmupItem
          name="Thoracic Rotation"
          note="8 reps per side. Move slowly and focus on rotating through your upper back, not your lower back. Good thoracic mobility can make a real difference in how your shoulders feel during pressing movements."
          videoId="VYMF16KVAw8"
          s3Url={urlMap["m3c_wu_thoracic_rot"]}
          tips={TIPS["wu_thoracic_rot"]}
        />
        <WarmupItem
          name="World's Greatest Stretch"
          note="5 reps per side. Move slowly and with control. Focus on opening the hips, thoracic spine, and hamstrings through the full movement."
          videoId="FYWN63ij0bE"
          s3Url={urlMap["m3c_wu_worlds_stretch"]}
          tips={TIPS["wu_worlds_greatest"]}
        />
        <WarmupItem
          name="Glute Bridge (Activation)"
          note="1 set x 15 reps. Squeeze hard at the top and focus on feeling your glutes working. This is to activate the muscles, not to fatigue them."
          videoId="0mn6xjwzCvs"
          s3Url={urlMap["m3c_wu_glute_bridge"]}
          tips={TIPS["wu_glute_bridge"]}
        />
        <WarmupItem
          name="Scapular Push-Up"
          note="10 reps. Keep your elbows straight the entire time and move only through your shoulder blades. Protract and retract with control instead of rushing the movement."
          videoId="R5JZAA4tueY"
          s3Url={urlMap["m3c_wu_scap_pushup"]}
          tips={TIPS["wu_scap_pushup"]}
        />
        <WarmupItem
          name="Leg Swing Front to Back"
          note="10 reps per side. Hold onto something for balance and keep the movement controlled. This is to loosen up the hips, not to swing as hard as possible."
          videoId="8BgLrTI2SO4"
          s3Url={urlMap["m3c_wu_leg_swing_fb"]}
          tips={TIPS["wu_leg_swing_fb"]}
        />

        <DayStatusBadge day="c" />

        <DayLogsProvider day="c">
          <div id="dayc-tracker" style={{ scrollMarginTop: "80px" }}>
            <DayWeekSelector />

            <SubLabel>Main Workout</SubLabel>
            <ExerciseRow
              name="Single Leg Glute Bridge"
              prescription="3 sets x 10 reps per side, 60 sec rest"
              note="Drive through your heel, squeeze the glute hard at the top, and keep your hips level throughout the movement. If one hip drops or rotates, that is a stability weakness worth paying attention to and improving over time."
              videoIds={["95b9yp9kfEg"]}
              s3Urls={[urlMap["m3c_sl_glute_bridge"]]}
            />
            <QuickFormTips tips={TIPS["sl_glute_bridge"]} />
            <InlineExerciseTracker day="c" exerciseId="sl_glute_bridge" />
            <ExerciseDivider />
            <ExerciseRow
              name="Reverse Lunge"
              prescription="3 sets x 10 reps per side, 90 sec rest"
              note="Step back into the lunge rather than forward. Keep your chest up, front knee tracking over your toes, and back knee hovering just above the floor. Drive through your front heel to return to standing."
              videoIds={["ysR2LxObJbo"]}
              s3Urls={[urlMap["m3c_rev_lunge"]]}
            />
            <QuickFormTips tips={TIPS["reverse_lunge"]} />
            <InlineExerciseTracker day="c" exerciseId="reverse_lunge" />
            <ExerciseDivider />

            <Superset tag="Superset" note="No rest between the two exercises. Rest 90 seconds after both are done. 3 rounds.">
              <ExerciseRow
                name="Push-Up"
                prescription="10 reps"
                note="Keep your elbows at roughly 45 degrees, set your shoulder blades before lowering, and use a full range of motion. If needed, drop to your knees while keeping the same form standards."
                videoIds={["oZmBz-BN7ZY"]}
                s3Urls={[urlMap["m3c_pushup"]]}
              />
              <QuickFormTips tips={TIPS["pushup_c"]} />
              <InlineExerciseTracker day="c" exerciseId="pushup_c" />
              <ExerciseDivider />
              <ExerciseRow
                name="Inverted Row"
                prescription="10 reps"
                note="Set the bar at roughly hip height. Hang underneath it with straight arms and keep your body in a straight line throughout. Pull your chest toward the bar, squeeze at the top, then lower yourself slowly with control."
                videoIds={["BKEfa9ixLuc"]}
                s3Urls={[urlMap["m3c_inv_row"]]}
              />
              <QuickFormTips tips={TIPS["inverted_row"]} />
              <InlineExerciseTracker day="c" exerciseId="inverted_row" />
            </Superset>
            <ExerciseDivider />

            <Superset tag="Glute Medius Superset" note="No rest between the two exercises. Rest 45 seconds after both are done. 3 rounds.">
              <ExerciseRow
                name="Monster Walk"
                prescription="20 steps forward, 20 steps backward"
                note="Stay in a slight squat position with your chest up, core braced, and constant tension on the band the entire time."
                videoIds={["cR8WIVDloo4"]}
                s3Urls={[urlMap["m3c_band_monster_walk"]]}
              />
              <QuickFormTips tips={TIPS["monster_walk"]} />
              <InlineExerciseTracker day="c" exerciseId="monster_walk" />
              <ExerciseDivider />
              <ExerciseRow
                name="Side Lying Hip Abduction"
                prescription="12 to 15 reps per side"
                note="Keep your foot flexed, toes slightly pointed down, and control the lowering phase completely. Focus on feeling the side glute working instead of swinging the leg up."
                videoIds={["efiJbMV-ZaE"]}
                s3Urls={[urlMap["m3c_hip_abduction"]]}
              />
              <QuickFormTips tips={TIPS["hip_abduction_c"]} />
              <InlineExerciseTracker day="c" exerciseId="hip_abduction_c" />
            </Superset>
            <ExerciseDivider />

            <Superset tag="Superset" note="No rest between the two exercises. Rest 60 seconds after both are done. 2 rounds.">
              <ExerciseRow
                name="Dead Bug"
                prescription="8 reps per side"
                note="Brace your core and press your entire lower back into the floor before you start. The moment your back lifts or arches, you've gone too far. Slow this down. You can add a light dumbbell overhead once the movement feels controlled and easy."
                videoIds={["tDG5Ln8XUo8"]}
                s3Urls={[urlMap["m3c_dead_bug"]]}
              />
              <QuickFormTips tips={TIPS["dead_bug_c"]} />
              <InlineExerciseTracker day="c" exerciseId="dead_bug_c" />
              <ExerciseDivider />
              <ExerciseRow
                name="Copenhagen Plank"
                prescription="20 to 30 seconds per side"
                note="Place your bottom knee on a bench or chair with your top leg straight. Squeeze your inner thigh into the bench and keep your hips level throughout the hold."
                videoIds={["i1Ll-EnhYhQ"]}
                s3Urls={[urlMap["m3c_copenhagen"]]}
              />
              <QuickFormTips tips={TIPS["copenhagen"]} />
              <InlineExerciseTracker day="c" exerciseId="copenhagen" />
            </Superset>
            <ExerciseDivider />

            <ExerciseRow
              name="Stability Ball Stir-the-Pot"
              prescription="2 sets x 8 circles each direction, 60 sec rest"
              note="Place your forearms on the stability ball and assume a plank position. Make small, controlled circles with your forearms while keeping your hips level and lower back neutral throughout."
              videoIds={["WaOewOUic3c"]}
              s3Urls={[urlMap["m3c_stir_pot"]]}
            />
            <QuickFormTips tips={TIPS["stir_the_pot"]} />
            <InlineExerciseTracker day="c" exerciseId="stir_the_pot" />
            <ExerciseDivider />

            <SubLabel id="dayc-cooldown">Cool-Down · 5 minutes</SubLabel>
            <p style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6, marginBottom: "1.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(201,169,110,0.2)" }}>
              Cooldowns are not about forcing flexibility. Hold each stretch for around 30 seconds, breathe slowly, and only move into a range that feels comfortable. The video shows the movement, but your range may look different, and that is completely fine. Stretching should feel controlled, not painful.
            </p>
            <WarmupItem
              name="Kneeling Hip Flexor Stretch"
              note="Hold the stretch position for the full 30 seconds per side. These muscles tend to tighten up on lower body days and can contribute directly to lower back discomfort if left unaddressed."
              videoId="cfqgjN8b2vg"
              s3Url={urlMap["m3c_cd_hip_flexor"]}
              tips={TIPS["cd_hip_flexor"]}
            />
            <WarmupItem
              name="Figure 4 Stretch"
              note="Hold the stretch for the full 30 seconds per side. You just worked your glutes hard, they need this."
              videoId="5QdSahBkG20"
              s3Url={urlMap["m3c_cd_figure4"]}
              tips={TIPS["cd_figure4"]}
            />
            <WarmupItem
              name="Lying Spinal Twist"
              note="Hold the stretch for the full 30 seconds per side. This helps release tension through the lower back and hips after all the single-leg and stability work."
              videoId="3miActosoI8"
              s3Url={urlMap["m3c_cd_spinal_twist"]}
              tips={TIPS["cd_spinal_twist"]}
            />
            <WarmupItem
              name="Child's Pose"
              note="Hold the position for the full 30 seconds. Focus on breathing deeply and letting your body relax into the stretch."
              videoId="NWUojZcToTE"
              s3Url={urlMap["m3c_cd_childs_pose"]}
              tips={TIPS["cd_childs_pose"]}
            />

            <MarkCompleteButton />
            <div id="dayc-log" style={{ scrollMarginTop: "80px" }}>
              <DayWorkoutPanel day="c" />
            </div>
          </div>
        </DayLogsProvider>
      </DayBlock>

      {/* WEEKS 3 & 4 */}
      <div id="w34" style={{ padding: "2rem", background: cardBg, border: `1px solid ${border}`, marginBottom: "2rem" }}>
        <SectionLabel>Weeks 3 and 4: Progressive Overload</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          The program structure stays exactly the same across all three days. What changes is the demand you place on your body within that structure.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          On every exercise where you completed all sets and reps with clean form in Weeks 1 and 2, add a small amount of weight. For dumbbells, that usually means going up one size. For band exercises, move to a heavier band. For bodyweight exercises like the dead bug, push-up, and inverted row, add 2 to 3 reps per set rather than rushing into weighted variations.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          If your form broke down on any exercise during Weeks 1 and 2, stay at the same weight in Weeks 3 and 4. Getting the movement pattern right is always the priority. The weight will come.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          And remember: this does not stop after Week 4.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          The goal is to teach you how to progressively overload correctly so you can continue building strength and seeing results long after the program ends. If you keep tracking your workouts, improving your form, and gradually increasing the challenge over time, your body will keep adapting with you.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5 }}>
          That is why the tracking system matters. The more consistently you use it, the easier it becomes to see your progress, push intelligently, and keep building momentum over the long term.
        </p>
      </div>

      <div style={{ padding: "2.5rem", background: cardBg, border: `1px solid ${border}`, borderLeft: `3px solid ${gold}`, marginBottom: "2rem" }}>
        <SectionLabel>You finished the program. Here&apos;s what that means.</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          Four weeks ago you walked into the gym and started building something. Now you have it. You know how to hinge, squat, push, pull, and brace. You have trained your glutes and core with real intention. You have done the work most people who exercise regularly have never done.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.5 }}>
          This is not the finish line. It is the starting point. The program is designed to be run again and the second time, you go heavier. The third time, heavier still. Open your training log and look at Week 1 versus Week 4. That gap is what Round 2 will build on.
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${border}` }}>
        <Link href="/training-foundations/module2" style={{ display: "inline-block", background: "none", color: gold, border: `1px solid ${gold}`, padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Back to Module 2
        </Link>
        <Link href="/training-foundations/module4" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Module 4
        </Link>
      </div>
    </div>
  )
}
