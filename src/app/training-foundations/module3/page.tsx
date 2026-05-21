import Link from "next/link"
import VideoEmbed from "@/components/training/VideoEmbed"
import { getPublishedVideoUrls } from "@/lib/mediaClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Module 3 — The 4-Week Program | Lisa Fit Method",
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", marginBottom: "1.5rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${border}`, fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </div>
  )
}

function WarmupItem({ name, note, videoId, s3Url }: { name: string; note: string; videoId?: string; s3Url?: string }) {
  return (
    <>
      <div style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: `1px solid rgba(255,255,255,0.04)`, alignItems: "flex-start" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: gold, marginTop: "0.55rem", flexShrink: 0, opacity: 0.6 }} />
        <div>
          <div style={{ fontSize: "0.85rem", color: cream, fontWeight: 400 }}>{name}</div>
          <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "0.15rem" }}>{note}</div>
        </div>
      </div>
      {videoId && <VideoEmbed videoId={videoId} title={name} s3Url={s3Url} />}
    </>
  )
}

function ExerciseRow({ name, prescription, note, videoIds, s3Urls }: { name: string; prescription: string; note: string; videoIds?: string[]; s3Urls?: (string | undefined)[] }) {
  return (
    <>
      <div style={{ padding: "1.25rem 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
        <div style={{ fontSize: "0.9rem", color: cream, fontWeight: 400, marginBottom: "0.25rem" }}>{name}</div>
        <div style={{ fontSize: "0.75rem", color: gold, marginBottom: "0.25rem" }}>{prescription}</div>
        <div style={{ fontSize: "0.78rem", color: "#888", lineHeight: 1.6 }}>{note}</div>
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

function DayBlock({ id, day, title, children }: { id: string; day: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ background: cardBg, border: `1px solid ${border}`, marginBottom: "2.5rem", overflow: "hidden" }}>
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
    "m3a_wu_9090_hip", "m3a_wu_worlds_stretch", "m3a_wu_cat_cow", "m3a_wu_thoracic_rot",
    "m3a_wu_glute_bridge", "m3a_wu_lat_band_walk", "m3a_wu_leg_swing_fb", "m3a_wu_leg_swing_ss", "m3a_wu_lateral_lunge",
    // Day A working sets
    "m3a_goblet_squat", "m3a_rdl", "m3a_hip_thrust", "m3a_hip_thrust_var",
    "m3a_seated_band_abd", "m3a_dead_bug", "m3a_farmers_carry",
    // Day A cool-down
    "m3a_cd_hip_flexor", "m3a_cd_hamstring", "m3a_cd_figure4", "m3a_cd_childs_pose",
    // Day B warm-up
    "m3b_wu_cat_cow", "m3b_wu_thoracic_rot", "m3b_wu_worlds_stretch", "m3b_wu_arm_circles",
    "m3b_wu_band_pull_apart", "m3b_wu_ytw_raise", "m3b_wu_bird_dog", "m3b_wu_pushup",
    // Day B working sets
    "m3b_db_bench", "m3b_pushup", "m3b_ohp", "m3b_chest_row",
    "m3b_band_pullup", "m3b_db_curl", "m3b_tri_extension", "m3b_bird_dog", "m3b_pallof_press",
    // Day B cool-down
    "m3b_cd_open_book", "m3b_cd_band_lat", "m3b_cd_thread_needle", "m3b_cd_triceps",
    // Day C warm-up
    "m3c_wu_9090_hip", "m3c_wu_cat_cow", "m3c_wu_thoracic_rot", "m3c_wu_worlds_stretch",
    "m3c_wu_glute_bridge", "m3c_wu_bird_dog", "m3c_wu_scap_pushup", "m3c_wu_stand_band_abd",
    "m3c_wu_leg_swing_fb", "m3c_wu_leg_swing_ss", "m3c_wu_lateral_lunge",
    // Day C working sets
    "m3c_sl_glute_bridge", "m3c_rev_lunge", "m3c_band_monster_walk", "m3c_lateral_band_walk",
    "m3c_hip_abduction", "m3c_pushup", "m3c_inv_row", "m3c_dead_bug", "m3c_copenhagen", "m3c_stir_pot",
    // Day C cool-down
    "m3c_cd_hip_flexor", "m3c_cd_figure4", "m3c_cd_spinal_twist", "m3c_cd_childs_pose",
  ])

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`@media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }`}</style>

      <SectionLabel>Module 3</SectionLabel>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem" }}>
        The 4-Week Program
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.9, maxWidth: 700, marginBottom: "2rem" }}>
        Everything in Modules 1 and 2 was knowledge. This is where you apply it. The program runs 3 days per week with at least one rest day between sessions. Each session takes between 45 and 60 minutes including your warm-up and cool-down. They are not optional and not something to rush through.
      </p>

      <div style={{ padding: "1.5rem 2rem", background: cardBg, border: `1px solid ${border}`, marginBottom: "2rem" }}>
        <SectionLabel>How to read the program</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.8, marginBottom: "1rem" }}>
          Sets x Reps. So 3×10 means 3 sets of 10 repetitions. Rest 60 to 90 seconds between sets on most exercises. For heavier compound movements like the RDL, hip thrust, and goblet squat, take a full 2 minutes between sets.
        </p>
        <SectionLabel>How to progress</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.8 }}>
          If you complete all sets and reps with clean form and the last few reps feel challenging but controlled, add a small amount of weight next session. For dumbbells that usually means going up one size. If the form breaks down before you finish the reps, stay at the same weight until it doesn&apos;t.
        </p>
      </div>

      {/* DAY A */}
      <DayBlock id="daya" day="Day A" title="Lower Body">
        <SubLabel>Warm-Up — 10 minutes</SubLabel>
        <WarmupItem name="90/90 Hip Stretch" note="8 to 10 reps per side, alternating. Breathe into it, don't force the range." videoId="VbjfMt1C_y8" s3Url={urlMap["m3a_wu_9090_hip"]} />
        <WarmupItem name="World's Greatest Stretch" note="5 reps per side. Slow and controlled." videoId="FYWN63ij0bE" s3Url={urlMap["m3a_wu_worlds_stretch"]} />
        <WarmupItem name="Cat-Cow" note="10 reps. Full range, inhale to extend, exhale to round." videoId="SboCzGvi8RE" s3Url={urlMap["m3a_wu_cat_cow"]} />
        <WarmupItem name="Thoracic Rotation" note="8 reps per side. Keep your hips still and rotate through your upper back only." videoId="VYMF16KVAw8" s3Url={urlMap["m3a_wu_thoracic_rot"]} />
        <WarmupItem name="Glute Bridge (activation)" note="1 set of 15 reps. Squeeze at the top. Wake the glutes up, not to fatigue them." videoId="0mn6xjwzCvs" s3Url={urlMap["m3a_wu_glute_bridge"]} />
        <WarmupItem name="Lateral Band Walk (activation)" note="1 set of 15 steps each direction. Light band, activation only." videoId="4yr4bFNYX9w" s3Url={urlMap["m3a_wu_lat_band_walk"]} />
        <WarmupItem name="Leg Swing Front to Back" note="10 reps per side. Hold something for balance, keep it controlled." videoId="8BgLrTI2SO4" s3Url={urlMap["m3a_wu_leg_swing_fb"]} />
        <WarmupItem name="Leg Swing Side to Side" note="10 reps per side. Controlled, not sloppy." videoId="o0oRKIM1cTo" s3Url={urlMap["m3a_wu_leg_swing_ss"]} />
        <WarmupItem name="Lateral Lunge" note="8 reps per side. Slow and controlled, sit into the hip, keep the working knee tracking over the toes." videoId="EVKyneKe5w8" s3Url={urlMap["m3a_wu_lateral_lunge"]} />

        <SubLabel>Working Sets</SubLabel>
        <ExerciseRow name="Goblet Squat" prescription="3 sets × 10 reps — Rest 2 min" note="Chest up, knees tracking over toes, sit between your heels not behind them. Refer back to Module 1 Exercise 2." videoIds={["NYf82VuzrQM"]} s3Urls={[urlMap["m3a_goblet_squat"]]} />
        <ExerciseRow name="Romanian Deadlift" prescription="3 sets × 10 reps — Rest 2 min" note="Push your hips back, keep the weights close to your body, stop before your lower back rounds. Refer back to Module 2 Exercise 6." videoIds={["AyY0C8s5scU"]} s3Urls={[urlMap["m3a_rdl"]]} />
        <ExerciseRow name="Hip Thrust" prescription="3 sets × 12 reps — Rest 2 min" note="Drive through your heels, squeeze hard at the top, ribs down. Start with a barbell at a comfortable weight, progress to single leg when ready." videoIds={["Rxxd0gmzwFU", "8bSvHhnWVnE"]} s3Urls={[urlMap["m3a_hip_thrust"], urlMap["m3a_hip_thrust_var"]]} />
        <ExerciseRow name="Seated Band Abduction" prescription="3 sets × 15 reps — Rest 60 sec" note="Controlled the entire time. Feel the glute medius working on every rep, don't just push your knees out mindlessly." videoIds={["qVEzTP09HC0"]} s3Urls={[urlMap["m3a_seated_band_abd"]]} />
        <ExerciseRow name="Dead Bug" prescription="3 sets × 8 reps per side — Rest 60 sec" note="Lower back pressed into the floor the entire time. The moment it lifts, you have gone too far. Slow this down." videoIds={["tDG5Ln8XUo8"]} s3Urls={[urlMap["m3a_dead_bug"]]} />
        <ExerciseRow name="Farmer's Carry" prescription="3 sets × 20 to 30 meters — Rest 90 sec" note="Tall spine, shoulders back and down, core braced throughout. The moment your posture breaks, the set is over." videoIds={["vJIu3hgUYlg"]} s3Urls={[urlMap["m3a_farmers_carry"]]} />

        <SubLabel>Cool-Down — 5 minutes</SubLabel>
        <WarmupItem name="Kneeling Hip Flexor Stretch" note="60 seconds per side. These tighten up on lower body days and contribute directly to lower back discomfort if left unaddressed." videoId="cfqgjN8b2vg" s3Url={urlMap["m3a_cd_hip_flexor"]} />
        <WarmupItem name="90/90 Hamstring Stretch" note="60 seconds per side. Don't force the range, breathe into it." videoId="4vIoROvmLQM" s3Url={urlMap["m3a_cd_hamstring"]} />
        <WarmupItem name="Figure 4 Stretch" note="60 seconds per side. You just worked your glutes hard, they need this." videoId="5QdSahBkG20" s3Url={urlMap["m3a_cd_figure4"]} />
        <WarmupItem name="Child's Pose" note="60 seconds. Decompress the spine, breathe deeply, let everything release." videoId="NWUojZcToTE" s3Url={urlMap["m3a_cd_childs_pose"]} />
      </DayBlock>

      {/* DAY B */}
      <DayBlock id="dayb" day="Day B" title="Upper Body">
        <SubLabel>Warm-Up — 10 minutes</SubLabel>
        <WarmupItem name="Cat-Cow" note="10 reps. Full range, inhale to extend, exhale to round." videoId="SboCzGvi8RE" s3Url={urlMap["m3b_wu_cat_cow"]} />
        <WarmupItem name="Thoracic Rotation" note="8 reps per side. Upper back mobility makes a real difference in how your shoulders feel during pressing movements." videoId="VYMF16KVAw8" s3Url={urlMap["m3b_wu_thoracic_rot"]} />
        <WarmupItem name="World's Greatest Stretch" note="5 reps per side. Slow and controlled. Opens the hips and thoracic spine together." videoId="FYWN63ij0bE" s3Url={urlMap["m3b_wu_worlds_stretch"]} />
        <WarmupItem name="Arm Circles" note="10 forward, 10 backward. Start small and gradually increase the range as your shoulders loosen up." videoId="S1uYL7_nL00" s3Url={urlMap["m3b_wu_arm_circles"]} />
        <WarmupItem name="Band Pull-Apart" note="2 sets of 15 reps. Shoulders down throughout, squeeze at the back at the end of every rep." videoId="H-RxZVrZH2I" s3Url={urlMap["m3b_wu_band_pull_apart"]} />
        <WarmupItem name="YTW Raise" note="2 sets of 10 reps. Light band or no weight at all. Control every position and hold briefly at each letter." videoId="JYsBIb4R4xo" s3Url={urlMap["m3b_wu_ytw_raise"]} />
        <WarmupItem name="Bird Dog (activation)" note="1 set of 8 reps per side. Slow, hold 2 seconds at the top of each rep." videoId="Mr73_KR-fS8" s3Url={urlMap["m3b_wu_bird_dog"]} />
        <WarmupItem name="Push-Up (easy prep)" note="5 to 8 reps. Easy effort, just preparing the pressing pattern before you load it." videoId="oZmBz-BN7ZY" s3Url={urlMap["m3b_wu_pushup"]} />

        <SubLabel>Working Sets</SubLabel>
        <ExerciseRow name="Dumbbell Bench Press or Push-Up" prescription="3 sets × 10 reps — Rest 90 sec" note="Elbows at 45 degrees, shoulder blades set before you press, wrist stacked over elbow throughout. Refer back to Module 1 Exercise 3." videoIds={["vZTUnLTRkOg", "oZmBz-BN7ZY"]} s3Urls={[urlMap["m3b_db_bench"], urlMap["m3b_pushup"]]} />
        <ExerciseRow name="Overhead Press" prescription="3 sets × 10 reps — Rest 90 sec" note="Core braced throughout, ribs down, don't let your lower back arch as you press overhead. Press the weight up and slightly back." videoIds={["H8-O20oL3yc"]} s3Urls={[urlMap["m3b_ohp"]]} />
        <ExerciseRow name="Chest Supported Row" prescription="3 sets × 12 reps — Rest 90 sec" note="Because you are supported against the bench your lower back is completely out of the equation. No cheating the rep with momentum. Squeeze fully at the top of every rep and control the return." videoIds={["eKT-r-SV4x0"]} s3Urls={[urlMap["m3b_chest_row"]]} />
        <ExerciseRow name="Band Assisted Pull-Up" prescription="3 sets × 8 reps — Rest 90 sec" note="Loop the band around the bar and place your knees or feet in it. Pull your elbows down toward your back pockets, chest leads toward the bar, control the descent. This is your goal movement. Work toward doing it without the band." videoIds={["H-RxZVrZH2I"]} s3Urls={[urlMap["m3b_band_pullup"]]} />
        <Superset tag="Superset — Arms" note="No rest between the two exercises. Rest 60 seconds after both are done. 3 rounds.">
          <ExerciseRow name="Dumbbell Curl" prescription="10 to 12 reps" note="Keep your elbows pinned at your sides, control the return, don't swing the weight up." videoIds={["rPcp_rfWLRU"]} s3Urls={[urlMap["m3b_db_curl"]]} />
          <ExerciseRow name="Overhead Tricep Extension" prescription="10 to 12 reps" note="Keep your elbows pointing forward and close to your head, lower the weight slowly behind you, press back up to full extension." videoIds={["uht9IRmLvcQ"]} s3Urls={[urlMap["m3b_tri_extension"]]} />
        </Superset>
        <ExerciseRow name="Bird Dog" prescription="3 sets × 10 reps per side — Rest 60 sec" note="Hold 2 seconds at the top of every rep. Keep your pelvis level, don't let the hips rotate to get the leg higher." videoIds={["Mr73_KR-fS8"]} s3Urls={[urlMap["m3b_bird_dog"]]} />
        <ExerciseRow name="Pallof Press" prescription="3 sets × 10 reps per side — Rest 60 sec" note="Brace hard before you press, resist the rotation the entire time, hold 2 seconds at full extension." videoIds={["lae10X6yOII"]} s3Urls={[urlMap["m3b_pallof_press"]]} />

        <SubLabel>Cool-Down — 5 minutes</SubLabel>
        <WarmupItem name="Open Book Stretch" note="60 seconds per side. A thoracic rotation stretch that releases the upper back and chest after all the pressing and pulling." videoId="YJ92IS_RuRY" s3Url={urlMap["m3b_cd_open_book"]} />
        <WarmupItem name="Band Lat Stretch" note="60 seconds per side. Grab the band attached to something stable, shift your hips away and feel the entire side of your back release." videoId="lQuimKNJRWU" s3Url={urlMap["m3b_cd_band_lat"]} />
        <WarmupItem name="Thread the Needle Stretch" note="60 seconds per side. Gets deeper into the thoracic rotation and releases tension through the upper back and shoulders." videoId="GJGSah1mNWw" s3Url={urlMap["m3b_cd_thread_needle"]} />
        <WarmupItem name="Triceps Stretch" note="30 seconds per side. You just worked your triceps directly, give them a proper stretch before you leave." videoId="44rhonVBVRU" s3Url={urlMap["m3b_cd_triceps"]} />
      </DayBlock>

      {/* DAY C */}
      <DayBlock id="dayc" day="Day C" title="Movement Quality & Integration">
        <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.8, marginBottom: "2rem" }}>
          This day has a different feel to it. The loading is lighter, the focus is on movement quality, single leg stability, posture, and tying everything you have been building together. Think of it as the day you reinforce the patterns rather than push the intensity.
        </p>

        <SubLabel>Warm-Up — 10 minutes</SubLabel>
        <WarmupItem name="90/90 Hip Stretch" note="8 to 10 reps per side, alternating." videoId="VbjfMt1C_y8" s3Url={urlMap["m3c_wu_9090_hip"]} />
        <WarmupItem name="Cat-Cow" note="10 reps. Full range." videoId="SboCzGvi8RE" s3Url={urlMap["m3c_wu_cat_cow"]} />
        <WarmupItem name="Thoracic Rotation" note="8 reps per side." videoId="VYMF16KVAw8" s3Url={urlMap["m3c_wu_thoracic_rot"]} />
        <WarmupItem name="World's Greatest Stretch" note="5 reps per side. Slow and controlled." videoId="FYWN63ij0bE" s3Url={urlMap["m3c_wu_worlds_stretch"]} />
        <WarmupItem name="Glute Bridge (activation)" note="15 reps. Focus on the squeeze, slow tempo." videoId="0mn6xjwzCvs" s3Url={urlMap["m3c_wu_glute_bridge"]} />
        <WarmupItem name="Bird Dog (activation)" note="8 reps per side. Quality over speed, hold 2 seconds at the top." videoId="Mr73_KR-fS8" s3Url={urlMap["m3c_wu_bird_dog"]} />
        <WarmupItem name="Scapular Push-Up" note="10 reps. Protract and retract the shoulder blades with control. Elbows stay straight throughout." videoId="R5JZAA4tueY" s3Url={urlMap["m3c_wu_scap_pushup"]} />
        <WarmupItem name="Standing Band Abduction" note="12 reps per side. Light band, pure activation." videoId="bJ_Wanodamo" s3Url={urlMap["m3c_wu_stand_band_abd"]} />
        <WarmupItem name="Leg Swing Front to Back" note="10 reps per side." videoId="8BgLrTI2SO4" s3Url={urlMap["m3c_wu_leg_swing_fb"]} />
        <WarmupItem name="Leg Swing Side to Side" note="10 reps per side." videoId="o0oRKIM1cTo" s3Url={urlMap["m3c_wu_leg_swing_ss"]} />
        <WarmupItem name="Lateral Lunge" note="8 reps per side. Slow and controlled." videoId="EVKyneKe5w8" s3Url={urlMap["m3c_wu_lateral_lunge"]} />

        <SubLabel>Working Sets</SubLabel>
        <ExerciseRow name="Single Leg Glute Bridge" prescription="3 sets × 10 reps per side — Rest 60 sec" note="Drive through your heel, squeeze the glute hard at the top, and keep your hips level throughout. If your hips drop to one side that is a stability weakness worth noting and working on." videoIds={["95b9yp9kfEg"]} s3Urls={[urlMap["m3c_sl_glute_bridge"]]} />
        <ExerciseRow name="Reverse Lunge" prescription="3 sets × 10 reps per side — Rest 90 sec" note="Step back into the lunge rather than forward. Chest up, front knee tracks over toes, back knee hovers just above the floor. Drive through your front heel to return to standing." videoIds={["ysR2LxObJbo"]} s3Urls={[urlMap["m3c_rev_lunge"]]} />
        <Superset tag="Glute Medius Circuit — 3 rounds" note="Go through all three exercises back to back with minimal rest. Rest 45 seconds between rounds.">
          <ExerciseRow name="Band Monster Walk" prescription="20 steps forward, 20 steps backward" note="Slight squat position, chest up, core braced, constant tension on the band." videoIds={["cR8WIVDloo4"]} s3Urls={[urlMap["m3c_band_monster_walk"]]} />
          <ExerciseRow name="Lateral Band Walk" prescription="20 steps each direction" note="Keep your feet parallel, small controlled steps, constant tension throughout." videoIds={["4yr4bFNYX9w"]} s3Urls={[urlMap["m3c_lateral_band_walk"]]} />
          <ExerciseRow name="Side Lying Hip Abduction" prescription="12 to 15 reps per side" note="Foot flexed, toes pointing slightly down, control the return completely." videoIds={["efiJbMV-ZaE"]} s3Urls={[urlMap["m3c_hip_abduction"]]} />
        </Superset>
        <Superset tag="Superset — Push-Up + Inverted Row" note="No rest between the two exercises. Rest 90 seconds after both are done. 3 rounds.">
          <ExerciseRow name="Push-Up" prescription="10 reps" note="Elbows at 45 degrees, shoulder blades set before you lower, full range of motion. Drop to your knees if needed. Same form rules apply." videoIds={["oZmBz-BN7ZY"]} s3Urls={[urlMap["m3c_pushup"]]} />
          <ExerciseRow name="Inverted Row Overhand" prescription="10 reps" note="Set the bar at roughly hip height. Hang underneath it with straight arms, body in a straight line. Pull your chest toward the bar, squeeze at the top, lower with control." videoIds={["BKEfa9ixLuc"]} s3Urls={[urlMap["m3c_inv_row"]]} />
        </Superset>
        <Superset tag="Superset — Dead Bug + Copenhagen Plank" note="No rest between the two exercises. Rest 60 seconds after both are done. 3 rounds.">
          <ExerciseRow name="Dead Bug" prescription="8 reps per side" note="Lower back pressed into the floor the entire time. Slow and controlled, stop before your lower back lifts." videoIds={["tDG5Ln8XUo8"]} s3Urls={[urlMap["m3c_dead_bug"]]} />
          <ExerciseRow name="Copenhagen Plank Knee Variation" prescription="20 to 30 seconds per side" note="Place your bottom knee on a bench or chair, top leg straight. Squeeze your inner thigh into the bench and keep your hips level throughout." videoIds={["i1Ll-EnhYhQ"]} s3Urls={[urlMap["m3c_copenhagen"]]} />
        </Superset>
        <ExerciseRow name="Stability Ball Stir-the-Pot" prescription="3 sets × 8 circles each direction — Rest 60 sec" note="Place your forearms on the stability ball and assume a plank position. Make small controlled circles with your forearms. Keep your hips level and your lower back neutral throughout." videoIds={["WaOewOUic3c"]} s3Urls={[urlMap["m3c_stir_pot"]]} />

        <SubLabel>Cool-Down — 5 minutes</SubLabel>
        <WarmupItem name="Kneeling Hip Flexor Stretch" note="60 seconds per side. Single leg work and lunges tighten the hip flexors. This one is non-negotiable after Day C." videoId="cfqgjN8b2vg" s3Url={urlMap["m3c_cd_hip_flexor"]} />
        <WarmupItem name="Figure 4 Stretch" note="60 seconds per side. Your glutes have worked hard today." videoId="5QdSahBkG20" s3Url={urlMap["m3c_cd_figure4"]} />
        <WarmupItem name="Lying Spinal Twist" note="60 seconds per side. Releases the lower back and hips after all the single leg and stability work." videoId="3miActosoI8" s3Url={urlMap["m3c_cd_spinal_twist"]} />
        <WarmupItem name="Child's Pose" note="60 seconds. Decompress the spine, breathe deeply, let everything release." videoId="NWUojZcToTE" s3Url={urlMap["m3c_cd_childs_pose"]} />
      </DayBlock>

      {/* WEEKS 3 & 4 */}
      <div id="w34" style={{ padding: "2rem", background: cardBg, border: `1px solid ${border}`, marginBottom: "2rem" }}>
        <SectionLabel>Weeks 3 and 4 — Progressive Overload</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.9, marginBottom: "1rem" }}>
          The program structure stays exactly the same across all three days. What changes is the demand you place on your body within that structure. On every exercise where you completed all sets and reps with clean form in Weeks 1 and 2, add a small amount of weight. For dumbbells that usually means going up one size. For band exercises, move to a heavier band. For bodyweight exercises like the dead bug, bird dog, push-up, and inverted row, add 2 to 3 reps per set rather than rushing to a weighted variation.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.9 }}>
          If your form broke down on any exercise during Weeks 1 and 2, stay at the same weight in Weeks 3 and 4. Getting the pattern right is always the priority. The weight will come.
        </p>
      </div>

      <div style={{ padding: "2.5rem", background: cardBg, border: `1px solid ${border}`, borderLeft: `3px solid ${gold}`, marginBottom: "2rem" }}>
        <SectionLabel>You finished the program. Here&apos;s what that means.</SectionLabel>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.9, marginBottom: "1rem" }}>
          Four weeks ago you walked into the gym with a foundation to build. Now you have one. You know how to hinge, squat, push, pull, and brace. You have trained your glutes and core with real intention and structure. You have warmed up before every session. You have done the work that most people who exercise regularly have never done, and your body is more resilient because of it.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.9 }}>
          This is not the finish line. It is the starting point for everything that comes next.
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${border}` }}>
        <Link href="/training-foundations/module2" style={{ display: "inline-block", background: "none", color: gold, border: `1px solid ${gold}`, padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          ← Module 2
        </Link>
        <Link href="/training-foundations/module4" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Module 4 →
        </Link>
      </div>
    </div>
  )
}
