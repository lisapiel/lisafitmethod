// The guide's data: the five movements, Day A's three blocks, and the course
// feature list. Lifted out of page.client.tsx unchanged so the Direction D
// page renders the same content from one source.

export const MOVEMENTS = [
  {
    name: "The Hip Hinge",
    pattern: "Hip-dominant",
    what: "The single most important movement you will learn, and the one most responsible for back injuries when done wrong. Power comes from your hips, not your lower back. Get this right and every deadlift, kettlebell swing, and posterior chain exercise you ever do will feel completely different.",
    cues: [
      "Push the wall behind you with your hips: forces the hinge without overthinking.",
      "Soft bend in the knees, not a squat. Knees unlock but do not drive forward.",
      "Pack your shoulders. Blades slightly down and back before you move.",
      "Keep the weight close: drag it up your legs, do not let it float away.",
    ],
    watch: "if your lower back rounds at the bottom, the weight is too heavy. Drop it, do not push through.",
  },
  {
    name: "The Squat",
    pattern: "Knee-dominant",
    what: "Start with the goblet squat: the safest way to learn the pattern before any barbell. The counterbalance keeps the torso upright and teaches you what proper position actually feels like.",
    cues: [
      "Knees track over your second toe: follow the feet, don't collapse inward.",
      "Chest up, proud posture: keeps torso upright through the movement.",
      "Sit between your heels, not behind them: weight across your whole foot.",
      "Spread the floor with your feet: keeps knees stable and glutes switched on.",
    ],
  },
  {
    name: "The Push",
    pattern: "Horizontal press",
    what: "Pressing builds chest, shoulders, and triceps. Poor mechanics build up quietly until they become a real shoulder problem. Most of it comes down to elbow position and setting your shoulder blades before anything moves.",
    cues: [
      "Elbows at 45 degrees: not tucked all the way in, not flared straight out.",
      "Shoulder blades together and down before you lower: not after.",
      "Drive feet into the floor: full body tension makes the press stronger.",
      "Control the descent: two to three seconds down, then press with intent.",
    ],
  },
  {
    name: "The Pull",
    pattern: "Upper-body row",
    what: "Most people press far more than they pull, and over time that builds a real imbalance. A strong back directly protects your spine. Match every push with a pull.",
    cues: [
      "Pull elbows to your back pockets: activates the lats, stops the shrug.",
      "Shoulders down before you pull: set the position first, then go.",
      "Squeeze at the end: fully contract the back at the top of every rep.",
      "Control the return: lower slowly, do not let it drop.",
    ],
  },
  {
    name: "The Brace & Carry",
    pattern: "Core stability",
    what: "Your core's real job is to resist movement, not create it. Crunches miss the point entirely. Every squat, hinge, row, and press needs your core bracing to protect your spine.",
    cues: [
      "360-degree brace: breathe into your belly and create pressure all the way around.",
      "Ribs down: this stops your lower back from overarching.",
      "Tall spine: imagine a string pulling the crown of your head toward the ceiling.",
      "Brace before you move: not halfway through the rep.",
    ],
  },
]

export const WARMUP_A = [
  { name: "90/90 Hip Mobility Stretch",   protocol: "8–10 reps per side" },
  { name: "Cat-Cow",                       protocol: "10 reps" },
  { name: "World's Greatest Stretch",      protocol: "5 reps per side" },
  { name: "Glute Bridge (Activation)",     protocol: "1 set × 15 reps" },
  { name: "Lateral Band Walk",             protocol: "15 steps each direction" },
  { name: "Leg Swing Front to Back",       protocol: "10 reps per side" },
  { name: "Lateral Lunge",                 protocol: "8 reps per side" },
]

export const MAIN_WORKOUT_A = [
  { name: "Hip Thrust",         sets: "3 × 10–12", note: "drive through heels, squeeze at the top" },
  { name: "Romanian Deadlift",  sets: "3 × 10",    note: "hips back, keep the weight close" },
  { name: "Reverse Lunge",      sets: "3 × 10 per side", note: "front knee over toes" },
  { name: "Goblet Squat",       sets: "3 × 10",    note: "chest up, sit between your heels" },
  { name: "Dead Bug",           sets: "3 × 8 per side", note: "lower back flat to the floor" },
  { name: "Farmer's Carry",     sets: "2 × 20–30 m", note: "tall spine, braced core" },
]

export const COOLDOWN_A = [
  { name: "Kneeling Hip Flexor Stretch", protocol: "30 sec per side" },
  { name: "90/90 Hamstring Stretch",     protocol: "30 sec per side" },
  { name: "Figure 4 Stretch",            protocol: "30 sec per side" },
  { name: "Child's Pose",                protocol: "30 sec" },
]

export const FEATURES: [string, string][] = [
  ["50+ exercise videos", " so your form is never a guess"],
  ["The full training program", ", three days a week, fully structured with sets, reps, rest, warm-ups and cooldowns"],
  ["Built-in tracking you keep for life", ", logging every set so you can watch your numbers climb"],
  ["Progressive overload built in", ", so you always know your next step instead of guessing"],
  ["Core, glute, and back work", " that actually protects your spine, the part most programs skip"],
  ["Simple nutrition foundations", " to fuel all of it, no calorie obsession"],
  ["Works at home with dumbbells and bands", ", and scales straight into the gym"],
]
