"use client"
import { useState, useEffect, useCallback } from "react"

// ─── Brand tokens ──────────────────────────────────────────────────────────────

const C = {
  bg: "#0a0a0a",
  card: "#111111",
  border: "#1e1e1e",
  gold: "#c9a96e",
  goldLight: "#e8c98a",
  cream: "#f0e6d3",
  muted: "#666666",
  mutedLight: "#888888",
  error: "#c97e7e",
  green: "#9ec9a9",
  blue: "#7bb3c9",
} as const

const FONT_SERIF = "var(--font-cormorant), 'Cormorant Garamond', serif"
const FONT_SANS = "var(--font-montserrat), 'Montserrat', sans-serif"

// ─── Types ─────────────────────────────────────────────────────────────────────

type EpisodeFormat = "talking-head" | "gym-footage" | "b-roll-demo" | "do-with-me" | "voiceover" | "text-broll"
type EpisodeStatus = "idea" | "filmed" | "edited" | "posted"
type CoachingTier = "founding" | "foundation" | "premium" | "elite"
type Tab = "home" | "ideas" | "edit" | "calendar" | "stats" | "sales"

interface Episode {
  id: string
  seriesId: string
  title: string
  hook: string
  format: EpisodeFormat
  targetLength: string
  filmingNote: string
  captionIdea: string
  cta?: string
  tags: string[]
}

interface Series {
  id: string
  name: string
  description: string
  color: string
}

interface PostedEntry {
  id: string
  episodeId: string
  postedDate: string
  starRating?: 1 | 2 | 3 | 4 | 5
  views?: number
  likes?: number
  comments?: number
  saves?: number
  note?: string
}

interface WeeklySales {
  id: string
  weekOf: string
  amount: number
  note?: string
}

interface Client {
  id: string
  name: string
  startDate: string
  nextCall: string
  tier: CoachingTier
  monthlyFee: number
  status: "active" | "paused" | "completed"
  notes: string
}

interface PlanState {
  version: 3
  startDate: string | null
  episodeStatuses: Record<string, EpisodeStatus>
  postedEntries: PostedEntry[]
  weeklySales: WeeklySales[]
  clients: Client[]
  completedTasks: Record<string, boolean>
}

// ─── State helpers ─────────────────────────────────────────────────────────────

function defaultState(): PlanState {
  return {
    version: 3,
    startDate: null,
    episodeStatuses: {},
    postedEntries: [],
    weeklySales: [],
    clients: [],
    completedTasks: {},
  }
}

function loadState(): PlanState {
  if (typeof window === "undefined") return defaultState()
  try {
    const raw = localStorage.getItem("lfm_plan_v3")
    if (raw) return JSON.parse(raw) as PlanState
    const v2 = localStorage.getItem("lfm_plan_v2")
    if (v2) {
      const old = JSON.parse(v2) as Record<string, unknown>
      const migrated = defaultState()
      migrated.startDate = (old.startDate as string | null) ?? null
      migrated.clients = (old.clients as Client[] | undefined) ?? []
      migrated.completedTasks = (old.completedTasks as Record<string, boolean> | undefined) ?? {}
      return migrated
    }
  } catch {
    // ignore parse errors
  }
  return defaultState()
}

function saveState(s: PlanState): void {
  try {
    localStorage.setItem("lfm_plan_v3", JSON.stringify(s))
  } catch {
    // ignore storage errors
  }
}

// ─── Utility helpers ───────────────────────────────────────────────────────────

function getCurrentDay(startDate: string | null): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

function getMondayOf(d: Date): string {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon.toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T12:00:00")
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function getNextAvailableDate(postedEntries: PostedEntry[]): string {
  const usedDates = new Set(postedEntries.map(p => p.postedDate))
  const today = new Date()
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    if (!usedDates.has(iso)) return iso
  }
  return today.toISOString().slice(0, 10)
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Series data ───────────────────────────────────────────────────────────────

const SERIES: Series[] = [
  { id: "wish-i-knew",  name: "Wish I Knew Before",       description: "Honest lessons from years of training — the stuff nobody told you at the start.", color: "#c9a96e" },
  { id: "do-this",      name: "Do This, Not That",         description: "Side-by-side form corrections and exercise swaps. Save-worthy demo content.", color: "#9ec9a9" },
  { id: "gym-musts",    name: "Gym-Goer Must-Knows",       description: "The unwritten rules, tips, and truths every lifter should know.", color: "#7bb3c9" },
  { id: "harsh-truths", name: "Harsh Truths",              description: "Unpopular opinions delivered calmly. These get shared.", color: "#c97e7e" },
  { id: "gatekeep",     name: "Things I Won’t Gatekeep", description: "Generous sharing — your best finds, tools, and hacks.", color: "#b09ec9" },
  { id: "pullup-prog",  name: "Pull-Up Progression",       description: "5-part series. Film all 5 before posting Part 1.", color: "#c9a96e" },
  { id: "glutes-core",  name: "Glutes & Core",             description: "Do-with-me workouts and technique breakdowns.", color: "#9ec9a9" },
  { id: "fat-loss",     name: "Fat Loss + Lifting",        description: "The intersection of nutrition and strength training — high search intent.", color: "#7bb3c9" },
  { id: "never-do",     name: "Things I’d Never Do",  description: "As a trainer, these are the things you won't catch me doing.", color: "#c97e7e" },
  { id: "personality",  name: "Personality Track",         description: "Relatable, shareable, builds following. 2-3 per week alongside series content.", color: "#e8c98a" },
  { id: "origin",       name: "Origin & Brand",            description: "Who you are, why you're here, what makes your content different.", color: "#f0e6d3" },
  { id: "progression",  name: "Progression Series",        description: "Multi-part movement progressions. Pin Part 1 immediately.", color: "#9ec9a9" },
  { id: "deadlift",     name: "Deadlift From Scratch",     description: "4-part series. Film all 4 before posting Part 1.", color: "#c9a96e" },
]

const SERIES_MAP = new Map(SERIES.map(s => [s.id, s]))

// ─── Episodes data ─────────────────────────────────────────────────────────────

const EPISODES: Episode[] = [
  // ── Wish I Knew Before ──────────────────────────────────────────────────────
  {
    id: "wik1", seriesId: "wish-i-knew",
    title: "Wish I knew this before I started lifting",
    hook: "I spent 2 years training hard and barely changed. Here’s what was actually wrong.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Sit or stand against a neutral background. Speak directly to camera. No equipment needed — this is a personal story format.",
    captionIdea: "Two years of hard training and almost nothing to show for it. Turns out I was making the same handful of form mistakes on repeat without realizing it. If you’re putting in the work and not seeing results, your technique is almost always the first place to look. Here’s what I wish someone had pointed out to me earlier.",
    tags: ["wish-i-knew", "talking-head", "form", "beginners", "mindset"],
  },
  {
    id: "wik2", seriesId: "wish-i-knew",
    title: "I trained 5x a week for 2 years and didn’t grow",
    hook: "Training more isn’t the same as training better. I learned this the hard way.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Talking-head setup, relaxed and conversational. Can use gym as background if available, or a clean indoor space.",
    captionIdea: "Five days a week, every week, for two years. I was committed. But I was confusing volume with intensity, and my body just didn’t respond. The turning point was pulling back to three focused sessions and actually pushing hard during each one. More sessions doesn’t mean more progress — it usually means less recovery.",
    cta: "Comment PROGRAM if you want to know what I do now.",
    tags: ["wish-i-knew", "talking-head", "volume", "recovery", "training-frequency"],
  },
  {
    id: "wik3", seriesId: "wish-i-knew",
    title: "What I’d tell my past self about the gym",
    hook: "If I could go back, I wouldn’t train harder. I’d train smarter.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Reflective tone, direct to camera. Natural light preferred. Keep it conversational, not scripted.",
    captionIdea: "Past me was so fixated on doing more — more sets, more days, more intensity. The actual lesson took years to land: consistency beats intensity, and smart beats hard. If you’re early in your training, the gift you can give yourself is learning this sooner than I did.",
    tags: ["wish-i-knew", "talking-head", "mindset", "smarter-training", "sustainability"],
  },
  {
    id: "wik4", seriesId: "wish-i-knew",
    title: "The supplement I wasted $2000 on",
    hook: "I spent a lot of money figuring out what actually matters. Spoiler: it wasn’t fancy supplements.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Casual, honest tone. Can hold up a supplement container as a prop if helpful. Direct to camera.",
    captionIdea: "Pre-workouts, BCAAs, fat burners, recovery powders — I tried all of it. The honest answer is that almost none of it moved the needle compared to the basics: protein, sleep, and actually showing up. Save your money and spend it on food or a good program instead.",
    tags: ["wish-i-knew", "talking-head", "supplements", "nutrition", "money"],
  },
  {
    id: "wik5", seriesId: "wish-i-knew",
    title: "I used to skip leg day — here’s what happened",
    hook: "Skipping legs didn’t just slow my lower body progress. It held back everything.",
    format: "gym-footage", targetLength: "45-75s",
    filmingNote: "Film yourself doing a leg exercise (squat, leg press, or RDL) with good form. Use this as b-roll while talking over it, or cut between talking and the footage.",
    captionIdea: "I used to justify skipping legs constantly. What I didn’t realize is that big compound leg movements drive a systemic training response — more muscle activation, more hormonal response. When I finally committed to legs, my upper body started responding better too. The legs aren’t optional if you want real progress.",
    tags: ["wish-i-knew", "gym-footage", "legs", "compound-lifts", "progress"],
  },
  {
    id: "wik6", seriesId: "wish-i-knew",
    title: "Wish I knew: rest days aren’t optional",
    hook: "Rest days aren’t laziness. They’re where the actual progress happens.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Clean background, relaxed posture. This is a mindset reframe — keep the energy calm and educational.",
    captionIdea: "Training breaks down muscle tissue. Rest is when it rebuilds stronger. I used to feel guilty on rest days like I was falling behind. Now I treat them as part of the program — because they are. If you’re always sore, always tired, and not progressing, more training isn’t the answer.",
    tags: ["wish-i-knew", "talking-head", "recovery", "rest-days", "overtraining"],
  },
  {
    id: "wik7", seriesId: "wish-i-knew",
    title: "Wish I knew this about protein",
    hook: "Most people lifting are eating half the protein they actually need. I was one of them.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Direct to camera, can hold up a food item as visual. Conversational and practical tone.",
    captionIdea: "For years I thought I was eating enough protein because I had a chicken breast with dinner. That’s nowhere near what the research actually supports for people who train. Getting your protein right is the single highest-leverage nutrition change you can make. Everything else is secondary.",
    cta: "Comment PROTEIN for the breakdown I use.",
    tags: ["wish-i-knew", "talking-head", "protein", "nutrition", "muscle-building"],
  },

  // ── Do This, Not That ────────────────────────────────────────────────────────
  {
    id: "dt1", seriesId: "do-this",
    title: "Stop doing crunches like this",
    hook: "Crunches aren’t bad. You’re just doing them wrong.",
    format: "b-roll-demo", targetLength: "45-60s",
    filmingNote: "Film side-by-side: first the common mistake (yanking neck, barely moving), then the correct version (slow, controlled, full range). Use a mat on the floor. Lay camera on a tripod or lean against a wall for a side angle.",
    captionIdea: "Crunches get a bad reputation, but the movement itself isn’t the problem — the execution usually is. Most people are just rocking their head and calling it a rep. When you slow it down and actually let your abs do the work, it’s a completely different exercise. Try the corrected version and feel the difference.",
    tags: ["do-this", "b-roll-demo", "abs", "form-correction", "core"],
  },
  {
    id: "dt2", seriesId: "do-this",
    title: "Squat form: the fix no one mentions",
    hook: "Your squat isn’t the problem. Your setup is.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from a front angle and a side angle if possible. Show foot width and toe angle adjustment. Use a moderate weight so form is clearly visible.",
    captionIdea: "Before anyone talks about depth or knees, the most common squat issue is foot position. Too narrow, toes pointing forward — and your body has nowhere to go. Widen your stance, let your toes angle out slightly, and you’ll feel the difference immediately. It’s not your mobility. It’s your setup.",
    tags: ["do-this", "gym-footage", "squat", "form-correction", "lower-body"],
  },
  {
    id: "dt3", seriesId: "do-this",
    title: "Deadlift mistake I see every day",
    hook: "This one deadlift fix changed how my back felt after every session.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from the side. Show the bar drifting away from the body on the way up (wrong), then the bar staying close to the legs throughout (correct). Use a light-to-moderate weight so the movement is visible.",
    captionIdea: "The bar path in a deadlift should be as close to vertical as possible, right along your legs. The moment it drifts forward, your lower back takes on load it wasn’t meant to. This one fix — keeping the bar dragging up your shins — is what separates a deadlift that hurts from one that builds.",
    tags: ["do-this", "gym-footage", "deadlift", "form-correction", "back"],
  },
  {
    id: "dt4", seriesId: "do-this",
    title: "Glute bridge vs hip thrust — which one?",
    hook: "These aren’t the same exercise. Here’s when to use each one.",
    format: "b-roll-demo", targetLength: "45-60s",
    filmingNote: "Demo both movements side by side or cut between them. Show glute bridge on the floor, hip thrust with back against bench. Clear lighting so the hip position is visible.",
    captionIdea: "A glute bridge and a hip thrust look similar but they load the glutes differently. The hip thrust gives you a bigger range of motion and lets you load heavier — it’s the main event. The bridge is a great activation drill or a starting point if you’re building up. Both have a place; they just serve different purposes.",
    tags: ["do-this", "b-roll-demo", "glutes", "hip-thrust", "lower-body"],
  },
  {
    id: "dt5", seriesId: "do-this",
    title: "You’re doing rows wrong (probably)",
    hook: "Most people are rowing with their arms. Here’s how to actually use your back.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from the side doing a cable or dumbbell row. Show the wrong version (elbows flaring, no scapular retraction), then the correct version (elbows tucking, shoulder blades squeezing at the top).",
    captionIdea: "If your biceps are doing all the work in a row, you’re missing the entire point of the exercise. The cue that changed everything for me: think about driving your elbow toward your back pocket, not just pulling it backward. That shift engages the lats and rhomboids the way they’re supposed to work.",
    tags: ["do-this", "gym-footage", "rows", "back", "form-correction"],
  },
  {
    id: "dt6", seriesId: "do-this",
    title: "Stop training abs every day",
    hook: "Your abs need rest too. Overtraining them is keeping you stuck.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Quick, direct talking-head. Short and punchy — under 40 seconds. Confident delivery.",
    captionIdea: "Abs are a muscle. Muscles need recovery. Training them every day doesn’t speed up results — it just prevents them from adapting properly. Two to three focused core sessions per week, done well, will do more than daily ab circuits done halfheartedly.",
    tags: ["do-this", "talking-head", "abs", "core", "recovery"],
  },
  {
    id: "dt7", seriesId: "do-this",
    title: "The push-up fix nobody talks about",
    hook: "You’re not bad at push-ups. Your setup is wrong.",
    format: "b-roll-demo", targetLength: "45-60s",
    filmingNote: "Film from the side. Show shoulder position: wrong version with elbows flaring at 90 degrees, correct version with elbows at 45-degree angle. Also show hand placement relative to chest.",
    captionIdea: "Push-ups aren’t just an upper chest exercise — they’re a full-body movement when done correctly. The most common setup error is flaring the elbows straight out, which puts enormous stress on the shoulder joint. Bring them in to about 45 degrees and suddenly push-ups feel completely different. Harder, yes — but right.",
    tags: ["do-this", "b-roll-demo", "push-ups", "form-correction", "upper-body"],
  },

  // ── Gym-Goer Must-Knows ──────────────────────────────────────────────────────
  {
    id: "gm1", seriesId: "gym-musts",
    title: "Things every gym-goer should know but no one says",
    hook: "Things every gym-goer should know but nobody actually says.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Casual, confident talking-head. This works as a list format — have 3-4 quick points ready. Can film at gym or at home.",
    captionIdea: "There’s a whole set of unwritten gym rules that nobody actually explains when you’re starting out. Re-rack your weights. Wipe equipment down. Don’t give unsolicited advice. Don’t hover near someone’s station. Basic stuff — but knowing it makes the whole experience less intimidating from day one.",
    tags: ["gym-musts", "talking-head", "gym-culture", "etiquette", "beginners"],
  },
  {
    id: "gm2", seriesId: "gym-musts",
    title: "The warmup that changed my training",
    hook: "I stopped skipping warmups. Here’s what I actually do now.",
    format: "gym-footage", targetLength: "45-75s",
    filmingNote: "Film a quick walkthrough of your actual warmup routine: hip circles, banded glute activation, light cardio, maybe a few bodyweight squats. Keep it moving — 5 minutes of footage edited down to 60 seconds.",
    captionIdea: "I used to walk in and go straight to the bar. My joints hated me for it. A proper warmup isn’t just raising your heart rate — it’s activating the muscles you’re about to use so they fire correctly. Since I started doing this consistently, my lifts feel better from the first rep instead of the fifth set.",
    tags: ["gym-musts", "gym-footage", "warmup", "activation", "injury-prevention"],
  },
  {
    id: "gm3", seriesId: "gym-musts",
    title: "You’ll only get this if you’ve lifted for 2+ years",
    hook: "You’ll only understand this if you’ve been lifting for at least a couple of years.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Reflective, knowing tone. This is for intermediate lifters who will recognize themselves in what you describe. Nod to the experience of plateaus, ego, and the long game.",
    captionIdea: "At some point you stop chasing soreness and start chasing performance. You stop needing to max out every session and start appreciating a good controlled rep. Plateaus stop being discouraging and start being information. If you’ve been at this long enough, you know exactly what I mean.",
    tags: ["gym-musts", "talking-head", "intermediate", "mindset", "long-game"],
  },
  {
    id: "gm4", seriesId: "gym-musts",
    title: "If you’re new to lifting, watch this",
    hook: "If you’re just getting started in the gym, this is the video I wish existed.",
    format: "talking-head", targetLength: "60-90s",
    filmingNote: "Warm, welcoming tone. Cover 3-4 beginner fundamentals: pick a program and stick with it, prioritize form over weight, track your lifts, eat enough protein. Direct to camera.",
    captionIdea: "Starting out in the gym is overwhelming because there’s too much information and most of it is contradicting itself. Here’s the short version: pick one program and commit to it for at least 8 weeks. Learn the main lifts well before adding weight. Eat more protein than you think you need. That’s most of it.",
    cta: "Comment STARTER for the beginner program I’d recommend.",
    tags: ["gym-musts", "talking-head", "beginners", "fundamentals", "program"],
  },
  {
    id: "gm5", seriesId: "gym-musts",
    title: "Things about gym culture nobody tells you",
    hook: "Things people in the gym won’t tell you, but you’ll figure out eventually.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Light, relatable tone. Good opportunity for some humor. List format works well here.",
    captionIdea: "Gym culture has its own language and norms that nobody explicitly explains. Yes, it’s fine to work in with someone. No, you don’t need to talk to anyone. The regulars aren’t judging you — they’re too busy thinking about their own training. The gym is actually one of the least judgmental places you’ll find, once you realize everyone’s in their own world.",
    tags: ["gym-musts", "talking-head", "gym-culture", "anxiety", "relatable"],
  },
  {
    id: "gm6", seriesId: "gym-musts",
    title: "The gym mistake that’s costing you results",
    hook: "Switching programs every 3 weeks is why you’re not progressing.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Direct, slightly provocative tone. This is a gentle call-out that most people watching will recognize in themselves.",
    captionIdea: "Program hopping is one of the most common things I see — and it’s one of the most progress-killing habits in training. Every time you switch, you reset the adaptation process. You never get to the phase where a program actually delivers results. Pick something reasonable, commit to it for 8-12 weeks, and only then evaluate if it’s working.",
    tags: ["gym-musts", "talking-head", "program-hopping", "consistency", "progress"],
  },

  // ── Harsh Truths ─────────────────────────────────────────────────────────────
  {
    id: "ht1", seriesId: "harsh-truths",
    title: "Harsh truth: you don’t need more workouts",
    hook: "Harsh truth: adding more workouts is probably making things worse.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Quick, punchy delivery. Under 40 seconds. Confident and direct. Clean background.",
    captionIdea: "More sessions don’t automatically mean more progress. Your body adapts during recovery, not during training. If you’re doing five days a week and spinning your wheels, try three focused sessions with proper recovery between them. Results improve when effort is focused, not just frequent.",
    tags: ["harsh-truths", "talking-head", "overtraining", "recovery", "volume"],
  },
  {
    id: "ht2", seriesId: "harsh-truths",
    title: "Harsh truth about ‘toning’",
    hook: "Harsh truth: toning doesn’t exist. Here’s what’s actually happening.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Confident, slightly challenging tone. Short and educational. Under 40 seconds.",
    captionIdea: "There is no such thing as toning a muscle. You can build muscle, or you can lose fat, or both at once — but you can’t tighten or firm existing tissue. What people are describing when they say toned is usually low body fat with visible muscle underneath. That’s built through strength training and eating well.",
    tags: ["harsh-truths", "talking-head", "toning", "muscle-building", "fat-loss"],
  },
  {
    id: "ht3", seriesId: "harsh-truths",
    title: "Harsh truth: form > weight",
    hook: "Harsh truth: the weight you’re lifting doesn’t matter as much as you think.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Direct and confident. Can reference a nearby barbell or plate as a visual prop if at gym.",
    captionIdea: "The number on the bar is just a number. What creates the adaptation is tension on the right muscle through the right range of motion. Ego lifting with poor form doesn’t build the muscle you think it does — it just increases injury risk. Drop the weight, nail the movement, then build up from there.",
    tags: ["harsh-truths", "talking-head", "form", "ego-lifting", "technique"],
  },
  {
    id: "ht4", seriesId: "harsh-truths",
    title: "Harsh truth: you don’t need a perfect plan",
    hook: "Harsh truth: waiting for the perfect program is just procrastination.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Warm but direct. This one lands best with a slight smile — it’s a gentle nudge, not a lecture.",
    captionIdea: "The best program is the one you actually do. I see people spend months researching, comparing, and optimizing before they ever pick up a weight. A solid, boring, consistent program beats a perfect program you never start. Start now, adjust as you go.",
    tags: ["harsh-truths", "talking-head", "overthinking", "consistency", "just-start"],
  },
  {
    id: "ht5", seriesId: "harsh-truths",
    title: "Harsh truth about cardio",
    hook: "Harsh truth: cardio alone won’t change your body composition.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Quick, factual delivery. Short and punchy. Under 40 seconds.",
    captionIdea: "Cardio is great for cardiovascular health and it burns calories in the moment. But without resistance training, it does very little to change how your body looks. Building muscle raises your resting metabolic rate — cardio doesn’t. If body composition is the goal, lifting needs to be the foundation.",
    tags: ["harsh-truths", "talking-head", "cardio", "body-composition", "lifting"],
  },
  {
    id: "ht6", seriesId: "harsh-truths",
    title: "Harsh truth: most fitness advice is noise",
    hook: "90% of fitness content is either overstated, outdated, or selling you something.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Confident positioning content. Direct to camera, minimal background distraction.",
    captionIdea: "The fitness industry is extremely good at making simple things complicated so you’ll keep buying solutions. The fundamentals haven’t changed in decades: train consistently, eat mostly whole foods with enough protein, sleep well, manage stress. Everything else is noise layered on top of that foundation.",
    tags: ["harsh-truths", "talking-head", "fitness-industry", "fundamentals", "positioning"],
  },

  // ── Things I Won’t Gatekeep ──────────────────────────────────────────────────
  {
    id: "gk1", seriesId: "gatekeep",
    title: "Things I wanna gatekeep but I won’t",
    hook: "Things I wanna gatekeep but I won’t.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Fun, generous energy. List-format works great here — share 3-4 things. Conversational and warm.",
    captionIdea: "There are a handful of things I’ve learned about food and training that genuinely changed my approach, and I keep almost not sharing them because they feel like an edge. But here we are. High-protein Greek yogurt as a base for sauces. Tempo training for hypertrophy. Walking after meals for blood sugar. These are the things I wish I’d known sooner.",
    tags: ["gatekeep", "talking-head", "tips", "protein", "training-hacks"],
  },
  {
    id: "gk2", seriesId: "gatekeep",
    title: "The recovery hack no trainer talks about",
    hook: "The recovery upgrade most people completely overlook.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Casual, sharing tone. Can be filmed anywhere comfortable. Keep it conversational.",
    captionIdea: "Sleep and protein timing doesn’t get enough attention compared to supplements and gadgets. Getting enough protein in the evening — not just throughout the day — supports overnight muscle protein synthesis. Pair that with consistent sleep timing and you’ll feel the difference in your training within a couple of weeks.",
    tags: ["gatekeep", "talking-head", "recovery", "sleep", "protein-timing"],
  },
  {
    id: "gk3", seriesId: "gatekeep",
    title: "How to find the best gym for you",
    hook: "How to find the best gym for you — the criteria that actually matter.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Can film at a gym or at home. Practical, helpful tone. Give a short checklist of what to look for.",
    captionIdea: "The best gym is the one you’ll actually go to consistently. That sounds obvious, but people pick gyms based on equipment and price without considering proximity, atmosphere, and hours. If it takes 30 minutes to get there, you’ll find reasons not to go. Convenience beats features almost every time.",
    tags: ["gatekeep", "talking-head", "gym-selection", "tips", "consistency"],
  },
  {
    id: "gk4", seriesId: "gatekeep",
    title: "The cheapest thing that changed my training",
    hook: "The cheapest training upgrade I’d recommend to anyone.",
    format: "b-roll-demo", targetLength: "45-60s",
    filmingNote: "Show resistance bands in use: lateral band walks, banded hip thrusts, or pull-apart exercises. Film at gym or on a clean floor surface. Keep the movement clear and visible.",
    captionIdea: "Resistance bands are genuinely underrated. I use them for glute activation before lower body sessions, shoulder health work before pressing, and as a way to add resistance to bodyweight moves. A good set costs next to nothing and takes up almost no space. If you’re not using them, you’re leaving easy gains on the table.",
    tags: ["gatekeep", "b-roll-demo", "resistance-bands", "activation", "equipment"],
  },
  {
    id: "gk5", seriesId: "gatekeep",
    title: "My favorite finisher for cardio haters",
    hook: "My favorite conditioning finisher — especially if you hate cardio.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film yourself doing a kettlebell swing circuit or sled push as a finisher at the end of a session. Show 2-3 sets. Keep the camera steady — this is demonstration footage.",
    captionIdea: "If you hate traditional cardio but know you need conditioning work, finishers are the answer. Five minutes of kettlebell swings or a couple of sled pushes at the end of your session does more for your conditioning than 20 minutes on the elliptical — and it’s actually interesting. This is my go-to.",
    cta: "Comment FINISHER for the exact circuit I use.",
    tags: ["gatekeep", "gym-footage", "conditioning", "kettlebell", "cardio-alternative"],
  },
  {
    id: "gk6", seriesId: "gatekeep",
    title: "The tool I actually use for recovery",
    hook: "The one recovery tool I actually use consistently and why.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Honest product review style — can hold up the item or just describe it plainly. No exaggeration needed.",
    captionIdea: "I’ve tried most of the recovery tools that get hyped and most of them collect dust after a few weeks. The one I come back to consistently is simple: a foam roller for thoracic mobility and a lacrosse ball for the hips. Not glamorous, but it actually moves the needle on how I feel the next training day.",
    tags: ["gatekeep", "talking-head", "recovery-tools", "foam-rolling", "mobility"],
  },

  // ── Pull-Up Progression ──────────────────────────────────────────────────────
  {
    id: "pp1", seriesId: "pullup-prog",
    title: "If you want your first pull-up, listen up [Part 1/5]",
    hook: "If you want your first pull-up, here’s exactly how to get there.",
    format: "gym-footage", targetLength: "60-90s",
    filmingNote: "Film at a pull-up bar. Overview video — introduce the 5-step progression on screen or verbally. Show yourself hanging from the bar to establish context. Film all 5 parts before posting Part 1.",
    captionIdea: "A lot of people give up on pull-ups because they try them directly without building the prerequisite strength first. This series covers the exact 5-step progression that actually works. We’re starting with the full overview today, and over the next four videos we’ll go step by step. Save this series.",
    cta: "Comment PULLUP for the full progression guide.",
    tags: ["pullup-prog", "gym-footage", "pull-ups", "upper-body", "progression"],
  },
  {
    id: "pp2", seriesId: "pullup-prog",
    title: "Step 1: Inverted rows [Part 2/5]",
    hook: "Part 2: The foundation exercise most people skip.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Set up a barbell in a squat rack at hip height. Film from the side showing the inverted row movement — body straight, pulling chest to bar. Show both easier (feet closer) and harder (feet forward) variations.",
    captionIdea: "Before you can pull your body up, you need to be able to row your body weight horizontally. Inverted rows build the exact muscles used in a pull-up — lats, rhomboids, biceps — in a way that scales to your current strength. This is where the progression starts and where most people skip straight past.",
    tags: ["pullup-prog", "gym-footage", "inverted-rows", "back", "pull-up-progression"],
  },
  {
    id: "pp3", seriesId: "pullup-prog",
    title: "Step 2: Dead hangs [Part 3/5]",
    hook: "Part 3: This is where your grip strength actually comes from.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film hanging from a pull-up bar with feet off the ground, shoulders engaged (not passive). Show the difference between a dead hang with shrugged shoulders (wrong) and one with depressed and packed shoulders (right).",
    captionIdea: "Grip and shoulder stability are two of the biggest limiters for people working toward pull-ups. Dead hangs build both. Aim to work up to a 30-second hang with your shoulders actively engaged — not just passively hanging. This is one of those exercises that looks like nothing but changes everything.",
    tags: ["pullup-prog", "gym-footage", "dead-hangs", "grip-strength", "pull-up-progression"],
  },
  {
    id: "pp4", seriesId: "pullup-prog",
    title: "Step 3: Scapular pull-ups [Part 4/5]",
    hook: "Part 4: The missing link no one talks about.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from a slight front angle. Show the scapular pull-up: arms straight, elevate and depress the shoulder blades without bending the elbows. The movement range is small but visible.",
    captionIdea: "Most people skip this step and it’s the most important one for learning how to initiate a pull-up correctly. A scapular pull-up trains the bottom of the movement — the part where you engage before you even start pulling. Without this, pull-ups tend to feel like all arm and no back.",
    tags: ["pullup-prog", "gym-footage", "scapular-pull-ups", "shoulder-blades", "pull-up-progression"],
  },
  {
    id: "pp5", seriesId: "pullup-prog",
    title: "Step 4+5: Negatives and band-assisted [Part 5/5]",
    hook: "Part 5: The last two steps before you get your first rep.",
    format: "gym-footage", targetLength: "60-75s",
    filmingNote: "Film two movements: (1) a slow eccentric/negative from the top position, lowering as slowly as possible; (2) a band-assisted pull-up showing the band looped over the bar under your foot. Show both clearly.",
    captionIdea: "Negatives and band-assisted reps are the final bridge to your first unassisted pull-up. Negatives build the eccentric strength you need and teach your body the full range of motion. Assisted reps let you practice the full movement pattern while you build up the remaining strength. Put all five steps together consistently and the pull-up comes.",
    tags: ["pullup-prog", "gym-footage", "negatives", "band-assisted", "pull-up-progression"],
  },

  // ── Glutes & Core ────────────────────────────────────────────────────────────
  {
    id: "gc1", seriesId: "glutes-core",
    title: "The glute workout I do every week",
    hook: "Follow along — this is the glute session I come back to every week.",
    format: "do-with-me", targetLength: "60-90s",
    filmingNote: "Film a condensed version of your go-to glute session: hip thrust, RDL, and a banded exercise. Show each movement clearly, ideally with reps and sets on screen or voiced over. Good lighting for seeing the movement.",
    captionIdea: "This is the glute session I program for myself and come back to consistently. Hip thrusts for load and range of motion, RDLs for the hamstring-glute tie-in, and a banded exercise for the abductors. If you want a starting point for your glute training, this is it.",
    cta: "Comment GLUTES for my workout template.",
    tags: ["glutes-core", "do-with-me", "glutes", "workout", "lower-body"],
  },
  {
    id: "gc2", seriesId: "glutes-core",
    title: "Best glute exercise nobody does",
    hook: "The glute exercise with the best ROI — and almost nobody programs it.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Demonstrate the B-stance hip thrust clearly from the side. Show the setup (one foot flat, one on heel), and the asymmetrical loading. Film a few slow reps so the range of motion is visible.",
    captionIdea: "The B-stance hip thrust is one of my favorite unilateral exercises for the glutes. You load one side more than the other without the balance demands of a single-leg version. It’s a perfect way to address imbalances and increase time under tension without needing significantly heavier weight.",
    tags: ["glutes-core", "gym-footage", "b-stance-hip-thrust", "glutes", "unilateral"],
  },
  {
    id: "gc3", seriesId: "glutes-core",
    title: "Why your glutes aren’t growing",
    hook: "If your glutes aren’t responding, it’s usually one of three things.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Educational talking-head. Can list the three reasons on screen as text overlays or just deliver them verbally. Direct, helpful tone.",
    captionIdea: "Three things I see most often when glute training isn’t working: not enough range of motion on the hip thrust, no mind-muscle connection because the weight is too heavy, or simply not enough volume for this muscle group. The glutes respond well to higher rep ranges and full range of motion more than they respond to just loading heavier.",
    tags: ["glutes-core", "talking-head", "glutes", "muscle-growth", "troubleshooting"],
  },
  {
    id: "gc4", seriesId: "glutes-core",
    title: "Glute activation that actually works",
    hook: "The 3-minute glute activation that changed how my hip thrusts feel.",
    format: "b-roll-demo", targetLength: "45-60s",
    filmingNote: "Film 3 activation exercises in sequence: lateral band walks, clamshells, and glute bridges. Show 8-10 reps of each. Film from an angle that clearly shows the glute engagement.",
    captionIdea: "Most people go straight into heavy compound work without activating the target muscle first. For glutes especially, a 3-minute activation sequence makes a real difference in how well you feel them working during the main lifts. These three movements done with a light band before your session will change your hip thrusts.",
    tags: ["glutes-core", "b-roll-demo", "glute-activation", "warmup", "lower-body"],
  },
  {
    id: "gc5", seriesId: "glutes-core",
    title: "Heavy vs high reps for glutes",
    hook: "The heavy vs high rep debate for glutes — here’s the actual answer.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Informational talking-head. Can use split screen or text overlays to show the two approaches. Educational and direct.",
    captionIdea: "The glutes respond well to both heavy loading and higher rep work — and the research supports using both. Heavy hip thrusts and RDLs for strength and maximum muscle fiber recruitment, higher rep ranges for time under tension and metabolic stress. Doing only one or the other is leaving results behind.",
    tags: ["glutes-core", "talking-head", "glutes", "rep-ranges", "hypertrophy"],
  },
  {
    id: "gc6", seriesId: "glutes-core",
    title: "The abs workout that actually works",
    hook: "Follow along — this is the core routine I actually use.",
    format: "do-with-me", targetLength: "60-90s",
    filmingNote: "Film a do-with-me core routine on a mat: dead bug, hollow hold or hollow rock, cable crunch or weighted crunch, plank variation. Show each exercise with clear form and timing.",
    captionIdea: "This is the core routine I actually use — not the standard crunch circuit, but a combination of anti-extension, anti-rotation, and direct ab work. It takes about 10-12 minutes and it’s harder than it looks. Follow along and adjust the reps to your level.",
    tags: ["glutes-core", "do-with-me", "abs", "core", "workout"],
  },
  {
    id: "gc7", seriesId: "glutes-core",
    title: "Stop doing sit-ups, do this instead",
    hook: "Stop doing sit-ups. This works better and doesn’t wreck your neck.",
    format: "b-roll-demo", targetLength: "45-60s",
    filmingNote: "Side-by-side or cut between: show sit-up with hip flexor dominance and neck strain (wrong), then cable crunch or slow weighted crunch with actual ab contraction (right). Film from the side for clear visibility.",
    captionIdea: "Sit-ups aren’t useless, but they’re one of the least efficient ways to train the abs — and they tend to create more hip flexor work and neck strain than actual core engagement. A slow, controlled weighted crunch at a cable machine does more for your abs in fewer reps than a hundred sit-ups on the floor.",
    tags: ["glutes-core", "b-roll-demo", "sit-ups", "abs", "form-correction"],
  },
  {
    id: "gc8", seriesId: "glutes-core",
    title: "Core vs abs — they’re not the same",
    hook: "Your abs and your core are not the same thing. Here’s why it matters.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Educational talking-head. Can draw a rough diagram or use hand gestures to illustrate the full core musculature vs just the rectus abdominis.",
    captionIdea: "The abs are one visible muscle on the front. The core is a system of muscles — including the obliques, transverse abdominis, erector spinae, and pelvic floor — that work together to stabilize your spine. Training only crunches trains one piece of a much larger system. Strong abs plus a weak core is a recipe for back problems.",
    tags: ["glutes-core", "talking-head", "core", "abs", "anatomy"],
  },

  // ── Fat Loss + Lifting ────────────────────────────────────────────────────────
  {
    id: "fl1", seriesId: "fat-loss",
    title: "How to lose fat and gain muscle — the real answer",
    hook: "How to actually lose fat and build muscle at the same time.",
    format: "talking-head", targetLength: "60-90s",
    filmingNote: "Informational talking-head. This is a nuanced topic — keep the delivery clear and break it into 2-3 key points. Avoid oversimplifying while keeping it accessible.",
    captionIdea: "Body recomposition — losing fat while building muscle simultaneously — is possible, especially if you’re newer to training or returning after a break. The conditions that make it most likely: a slight calorie deficit or maintenance calories, high protein intake, and progressive resistance training. It’s slower than doing one at a time, but it’s real.",
    tags: ["fat-loss", "talking-head", "body-recomposition", "muscle-building", "nutrition"],
  },
  {
    id: "fl2", seriesId: "fat-loss",
    title: "What I eat on a training day",
    hook: "What I actually eat on a heavy training day — no tracking apps, no perfection.",
    format: "voiceover", targetLength: "45-75s",
    filmingNote: "Film food preparation or meals throughout the day — breakfast, pre/post workout snack, dinner. Voiceover explains the reasoning behind the choices. Natural kitchen lighting, casual feel.",
    captionIdea: "On a heavy training day my focus is on getting protein in at every meal and enough carbohydrates to fuel the session. That looks like eggs in the morning, something with Greek yogurt or protein mid-day, and a solid protein source with rice at dinner. No apps, no measuring — just familiar meals I know hit the rough targets.",
    tags: ["fat-loss", "voiceover", "nutrition", "training-day", "food"],
  },
  {
    id: "fl3", seriesId: "fat-loss",
    title: "Stop counting calories like this",
    hook: "If calorie tracking isn’t working for you, it’s probably one of these mistakes.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Direct educational content. Can list the common mistakes on screen or verbally. Keep it empathetic, not lecturing.",
    captionIdea: "Calorie tracking works — but most people make the same handful of mistakes that undermine it: not tracking everything, underestimating portions, not accounting for cooking oils and sauces, or not adjusting over time as metabolism adapts. The tool isn’t the problem. The application is.",
    tags: ["fat-loss", "talking-head", "calorie-tracking", "nutrition", "mistakes"],
  },
  {
    id: "fl4", seriesId: "fat-loss",
    title: "The protein rule that changed everything",
    hook: "The simple protein rule that made tracking way less complicated for me.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Practical, conversational tone. Share the per-meal target rule and why it works. Can use fingers to count meals as a visual.",
    captionIdea: "Instead of tracking my total daily protein obsessively, I aim for a solid protein source at every meal — roughly 30-40 grams each time. If I hit three to four meals a day, I’m in a good range without needing to log anything. Simple rules are more sustainable than precise tracking for most people.",
    tags: ["fat-loss", "talking-head", "protein", "nutrition-hack", "simplicity"],
  },
  {
    id: "fl5", seriesId: "fat-loss",
    title: "Best foods for lifting",
    hook: "The five foods I’d put in anyone’s diet who lifts regularly.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "List format — five foods, quick explanation of each. Can hold up items or film in a kitchen setting. Practical and accessible.",
    captionIdea: "If you’re lifting consistently, these five foods should be staples: Greek yogurt for fast high-quality protein, eggs for a complete amino acid profile, rice for easy digestible carbs around training, salmon for protein plus omega-3s, and spinach for micronutrients with almost no calories. Not complicated — just effective.",
    tags: ["fat-loss", "talking-head", "nutrition", "food-choices", "protein"],
  },
  {
    id: "fl6", seriesId: "fat-loss",
    title: "Why the scale goes up when you start lifting",
    hook: "If the scale went up after you started lifting, this is why — and it’s not bad.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Reassuring, educational tone. This video will resonate with a lot of people who feel discouraged. Address it directly and clearly.",
    captionIdea: "When you start a lifting program, the scale often goes up in the first few weeks. This happens because your muscles are retaining water as they adapt, and you might be eating more protein than before. Neither of these things means fat gain. Body composition improvements take 4-8 weeks to appear and the scale will not tell you the full story.",
    tags: ["fat-loss", "talking-head", "scale", "water-retention", "beginners"],
  },

  // ── Things I’d Never Do ──────────────────────────────────────────────────────
  {
    id: "nd1", seriesId: "never-do",
    title: "Things I’d never do as a personal trainer",
    hook: "Things I would never do — and I’m a personal trainer.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Confident, slightly provocative positioning. List format works well — 3-5 clear examples. Keep delivery calm and factual, not preachy.",
    captionIdea: "As a trainer, there are certain things I’d never recommend regardless of what’s trending: cardio-only programs for people who want to change their body composition, extreme calorie restriction, cutting entire food groups without a medical reason, and skipping the basics in favor of trendy movements. These approaches feel productive in the short term and cause problems in the medium to long term.",
    tags: ["never-do", "talking-head", "trainer-perspective", "cardio", "fad-diets"],
  },
  {
    id: "nd2", seriesId: "never-do",
    title: "Never say this to someone who lifts",
    hook: "Things you should never say to someone who lifts.",
    format: "talking-head", targetLength: "under 40s",
    filmingNote: "Light, relatable energy — this can be a little humorous. Quick list format. Under 40 seconds.",
    captionIdea: "A short list of things lifters have heard too many times: “You’re going to get too bulky.” “Isn’t that bad for your joints?” “You look the same to me.” “Shouldn’t you be doing more cardio?” If you know, you know.",
    tags: ["never-do", "talking-head", "relatable", "gym-culture", "humor"],
  },
  {
    id: "nd3", seriesId: "never-do",
    title: "Programs I’d never put a beginner on",
    hook: "As a trainer, these are the programs I’d never hand to a beginner.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Educational, direct tone. Name 3-4 program types with brief explanation of why they’re problematic for beginners.",
    captionIdea: "Advanced bro splits, six-days-a-week powerlifting programs, and AMRAP circuit workouts designed for trained athletes are not appropriate starting points. Beginners need frequency, simplicity, and enough recovery to actually adapt. The best beginner programs are often the boring ones — and they work precisely because of that.",
    tags: ["never-do", "talking-head", "programs", "beginners", "trainer-advice"],
  },
  {
    id: "nd4", seriesId: "never-do",
    title: "Diets I’d never recommend to a client",
    hook: "The diets I’d never recommend, and what I’d suggest instead.",
    format: "talking-head", targetLength: "45-75s",
    filmingNote: "Balanced, professional tone. Name specific diets and explain the concern clearly without being dismissive of people who’ve tried them.",
    captionIdea: "Extremely low calorie diets, juice cleanses, and anything that eliminates entire macronutrient groups without a clinical reason — these are the things I would never recommend. Not because they don’t create short-term results, but because the long-term metabolic and psychological consequences are well documented. The alternative is less exciting but it actually works.",
    tags: ["never-do", "talking-head", "fad-diets", "nutrition", "trainer-advice"],
  },

  // ── Personality Track ────────────────────────────────────────────────────────
  {
    id: "p1", seriesId: "personality",
    title: "Being an introvert at the gym",
    hook: "Being an introvert at the gym...",
    format: "text-broll", targetLength: "under 30s",
    filmingNote: "Film b-roll of yourself in the gym with headphones on, focused, not making eye contact. Use text overlays to tell the story. Relatable and low-key.",
    captionIdea: "The gym is genuinely one of my favorite places to be because nobody expects you to talk. Headphones in, world out. It’s an introvert’s paradise dressed up as a fitness facility.",
    tags: ["personality", "text-broll", "introvert", "relatable", "gym-life"],
  },
  {
    id: "p2", seriesId: "personality",
    title: "When you finally stop caring that people are watching",
    hook: "The moment you stop caring what people think at the gym.",
    format: "text-broll", targetLength: "under 30s",
    filmingNote: "B-roll of you training confidently — heavy lift, focused face. Text overlay to narrate the shift. No need to look at the camera.",
    captionIdea: "There’s a specific moment in your training journey when you realize no one in the gym is actually watching you — and even if they were, it doesn’t matter. That shift is hard to describe but you’ll know when it happens. Everything gets easier after that.",
    tags: ["personality", "text-broll", "confidence", "gym-anxiety", "mindset"],
  },
  {
    id: "p3", seriesId: "personality",
    title: "What I was thinking my first month in the gym",
    hook: "What was actually going through my head my first month in the gym.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Vulnerable, slightly humorous tone. Quick talking-head, under 30 seconds. This should feel honest and relatable.",
    captionIdea: "First month thoughts: Does everyone know what they’re doing except me? Am I using this machine wrong? Someone’s going to say something. Am I in someone’s way? Turns out everyone felt this way at the start. The only way out is through.",
    tags: ["personality", "talking-head", "vulnerability", "beginners", "relatable"],
  },
  {
    id: "p4", seriesId: "personality",
    title: "Most people don’t need more workouts. They need consistency.",
    hook: "Unpopular opinion: most people don’t need a better program. They need to stop changing programs.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Strong opinion delivery — confident, direct. Under 30 seconds. No hedging.",
    captionIdea: "The fitness industry sells novelty because novelty is more interesting than the truth. The truth is that any solid program, followed consistently for 12 weeks, will produce results. The program isn’t the variable. Consistency is.",
    tags: ["personality", "talking-head", "consistency", "strong-opinion", "programs"],
  },
  {
    id: "p5", seriesId: "personality",
    title: "Classes aren’t strength training. They’re cardio with weights.",
    hook: "I’ll say it: fitness classes aren’t strength training. They’re cardio with weights.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Hot take delivery — calm but clear. Short and punchy. This will get a reaction.",
    captionIdea: "If the weight you’re using for a class exercise is light enough to do 30 reps in 45 seconds, you’re doing cardio. That’s fine — cardio is valuable. But it’s not the same stimulus as progressive resistance training. Both have a place, but knowing what you’re actually doing helps you train with a purpose.",
    tags: ["personality", "talking-head", "hot-take", "fitness-classes", "strength-training"],
  },
  {
    id: "p6", seriesId: "personality",
    title: "What exercise took you the longest to actually feel?",
    hook: "What exercise took you the longest to actually feel? Drop it below.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Community engagement prompt — warm, curious tone. Share your own answer first (e.g., lat pulldowns). End with the question.",
    captionIdea: "Mine was lat pulldowns. I did them for two years before I actually felt my lats working instead of my arms. The day the mind-muscle connection clicked was a turning point. What was yours?",
    tags: ["personality", "talking-head", "community", "mind-muscle-connection", "engagement"],
  },
  {
    id: "p7", seriesId: "personality",
    title: "What gym myth did you believe for too long?",
    hook: "What gym myth did you believe for way too long? I’ll go first.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Community engagement format — share your own myth first, then invite others. Fun, self-aware energy.",
    captionIdea: "I’ll go first: I believed that you had to feel sore to have had a good workout. Trained that way for years and it taught me almost nothing useful about actual progress. Drop yours below — I genuinely want to know.",
    tags: ["personality", "talking-head", "community", "gym-myths", "engagement"],
  },
  {
    id: "p8", seriesId: "personality",
    title: "Why I stopped chasing aesthetics",
    hook: "The point where I stopped training to look a certain way — and what changed when I did.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Vulnerable, honest tone. This is a genuine personal share. Keep it concise and real.",
    captionIdea: "At some point the goal shifted from wanting to look a certain way to wanting to be strong and capable. The training didn’t change much, but the relationship with it changed completely. Progress stopped feeling conditional and started feeling like something I was doing for myself regardless of outcomes.",
    tags: ["personality", "talking-head", "vulnerability", "aesthetics", "mindset"],
  },
  {
    id: "p9", seriesId: "personality",
    title: "The scale lies. Here’s what to track instead.",
    hook: "The scale is the worst way to measure your progress. Here’s what I track instead.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Direct and practical. Quick list of alternatives: strength numbers, how clothes fit, energy levels, sleep quality. Under 30 seconds.",
    captionIdea: "Weight on the scale is one data point — and it’s affected by water, food timing, hormones, and muscle gain. It tells you almost nothing about what you actually care about. I track my lifts, how I feel in my clothes, and my energy levels. Those numbers tell a much more accurate story.",
    tags: ["personality", "talking-head", "scale", "progress-tracking", "strong-opinion"],
  },
  {
    id: "p10", seriesId: "personality",
    title: "If you’re sore every single workout, you’re not recovering.",
    hook: "If you’re sore every single time you train, that’s not a good sign.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Direct, informative. Short and punchy. Reframe soreness as a warning sign rather than a goal.",
    captionIdea: "Constant soreness means your body never fully recovers between sessions. You’re always in a state of repair rather than adaptation. Some soreness when you try something new is normal. Chronic soreness from your regular sessions means something needs to change — more sleep, more food, or less volume.",
    tags: ["personality", "talking-head", "soreness", "recovery", "strong-opinion"],
  },
  {
    id: "p11", seriesId: "personality",
    title: "Things I still feel after years of lifting",
    hook: "Things I still feel after years of lifting.",
    format: "text-broll", targetLength: "under 30s",
    filmingNote: "B-roll of training. Text overlays for each point — keep them short and relatable. Honest and human.",
    captionIdea: "Nervous before a new max attempt. Satisfied after a really good set. Annoyed when my usual machine is taken. Proud in a quiet way when something clicks. The feelings don’t go away — you just get more comfortable having them.",
    tags: ["personality", "text-broll", "relatable", "feelings", "long-term-lifting"],
  },
  {
    id: "p12", seriesId: "personality",
    title: "What makes you finally take training seriously?",
    hook: "What made you finally take training seriously? I’m curious.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Community engagement prompt. Share your own turning point first, then invite the audience to share theirs.",
    captionIdea: "For me it was a specific moment of realizing how much better I felt when I was consistent versus when I wasn’t. Not aesthetics — just energy, mood, sleep. What was it for you? I’m genuinely curious.",
    tags: ["personality", "talking-head", "community", "motivation", "engagement"],
  },
  {
    id: "p13", seriesId: "personality",
    title: "The hardest part of being a personal trainer",
    hook: "The part of being a personal trainer no one really talks about.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Vulnerable, honest tone. This is a genuine share about the emotional side of coaching work.",
    captionIdea: "The hardest part isn’t the programming or the marketing. It’s seeing someone who really wants to change and watching them get in their own way — and knowing you can give them every tool but you can’t do the work for them. Caring about outcomes you don’t fully control is the job.",
    tags: ["personality", "talking-head", "trainer-life", "vulnerability", "coaching"],
  },
  {
    id: "p14", seriesId: "personality",
    title: "Why I actually started training — the real version",
    hook: "Why I actually started training — not the polished version.",
    format: "talking-head", targetLength: "under 30s",
    filmingNote: "Origin story energy — raw and honest. Not the elevator pitch version. This is the unedited truth.",
    captionIdea: "The real version isn’t a clean story about health and empowerment. It was more complicated than that. And I think that’s true for most people — the reasons we start are rarely the reasons we stay. But the staying is what matters.",
    tags: ["personality", "talking-head", "origin", "vulnerability", "motivation"],
  },

  // ── Origin & Brand ────────────────────────────────────────────────────────────
  {
    id: "ori1", seriesId: "origin",
    title: "Why I started this",
    hook: "Why I started Lisa Fit Method — the short version.",
    format: "talking-head", targetLength: "45-60s",
    filmingNote: "Clean setup, direct to camera. This is your elevator pitch version — polished but genuine. 45-60 seconds.",
    captionIdea: "The short version: I spent years learning what actually works in the gym, watching people follow advice that wasn’t right for them, and eventually realized I had something worth sharing. Lisa Fit Method is where that goes — honest, practical content from someone who’s been doing this long enough to know what matters.",
    tags: ["origin", "talking-head", "brand", "why-i-started", "introduction"],
  },
  {
    id: "ori2", seriesId: "origin",
    title: "The longer backstory",
    hook: "The longer version of how I got here.",
    format: "talking-head", targetLength: "60-90s",
    filmingNote: "More conversational and personal than ori1. This is where you go deeper. Can be slightly less polished — authenticity matters here.",
    captionIdea: "The longer version involves a lot more trial and error, more time training without really knowing what I was doing, and eventually finding the approach that actually worked. That process is the reason I care about cutting through the noise — I know what it costs to figure things out the hard way.",
    tags: ["origin", "talking-head", "backstory", "vulnerability", "brand"],
  },
  {
    id: "ori3", seriesId: "origin",
    title: "Fun fact: I’m actually pretty introverted",
    hook: "Fun fact: I’m actually pretty introverted — so posting fitness content is genuinely terrifying.",
    format: "talking-head", targetLength: "45-60s",
    filmingNote: "Light, self-aware, slightly vulnerable. This builds connection. Keep the energy honest and a little wry.",
    captionIdea: "Creating content as an introvert is its own challenge. Every post is a small act of overcoming the instinct to stay quiet. I do it because the information is genuinely useful and because I wish someone had been sharing it when I was figuring things out. That’s the only reason I’m here.",
    tags: ["origin", "talking-head", "introvert", "vulnerability", "brand"],
  },
  {
    id: "ori4", seriesId: "origin",
    title: "What makes my content different",
    hook: "The fitness industry got way too complicated. Here’s what you won’t find on my page.",
    format: "talking-head", targetLength: "45-60s",
    filmingNote: "Positioning content — confident and clear. This is your differentiator video. Know your three or four things and deliver them with conviction.",
    captionIdea: "No gender-specific programs that assume you need a special approach just because of who you are. No supplement recommendations with affiliate codes. No before and after photos as the primary measure of success. Just evidence-based content from someone who trains, studies, and cares about getting this right.",
    tags: ["origin", "talking-head", "positioning", "brand", "differentiation"],
  },

  // ── Progression Series ────────────────────────────────────────────────────────
  {
    id: "pr_push1", seriesId: "progression",
    title: "Push-Up Progression: where most people start wrong [Part 1/3]",
    hook: "If you struggle with push-ups, this is where to start — and it’s not where you think.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from the side. Introduce the progression and explain why most people jump to full push-ups before they’ve built the prerequisite strength. Show the incline push-up as the starting point.",
    captionIdea: "Most people try full push-ups, struggle, decide they’re just bad at push-ups, and stop. The issue isn’t strength — it’s that they skipped the entry points. This series builds the push-up from the ground up. Start here and do not skip ahead.",
    tags: ["progression", "gym-footage", "push-ups", "upper-body", "beginners"],
  },
  {
    id: "pr_push2", seriesId: "progression",
    title: "Push-Up Progression: the bridge exercise [Part 2/3]",
    hook: "Part 2: The exercise that bridges the gap between incline and full push-ups.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from the side demonstrating a slow eccentric push-up (lowering slowly, pushing up from knees if needed). Show a 3-4 second lowering phase clearly.",
    captionIdea: "The slow eccentric push-up builds more strength than the regular version because it increases time under tension. Lower yourself over 3-4 seconds, reset, and go again. This is the bridge between incline push-ups and the full movement. Build up to 3 sets of 8 before moving to Part 3.",
    tags: ["progression", "gym-footage", "push-ups", "eccentric", "upper-body"],
  },
  {
    id: "pr_push3", seriesId: "progression",
    title: "Push-Up Progression: your first full rep [Part 3/3]",
    hook: "Part 3: How to do your first full push-up — and how to keep improving from there.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film a full push-up from the side with attention to body position: hands under shoulders, body straight, full range. Then show a band-assisted variation as an option. End with a progression note.",
    captionIdea: "Once you can do a slow eccentric and feel stable in the position, the full rep follows. Focus on keeping your body in a straight line and reaching full depth. From here, the goal is volume and consistency. Add a rep each week and you’ll have sets of 10 before you realize it.",
    tags: ["progression", "gym-footage", "push-ups", "first-rep", "upper-body"],
  },
  {
    id: "pr_ht1", seriesId: "progression",
    title: "Hip Thrust Progression: the starting point [Part 1/3]",
    hook: "Never done a hip thrust before? This is where to start.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film a glute bridge on the floor — no equipment needed. Show the movement clearly from the side. Explain that this builds the foundational position before moving to the bench.",
    captionIdea: "The hip thrust is one of the best glute exercises available, but it has a specific setup that takes some getting used to. Before you load a barbell, start with the floor version. Glute bridges teach you the hip hinge, the posterior pelvic tilt at the top, and the mind-muscle connection you need to make the loaded version work.",
    tags: ["progression", "gym-footage", "hip-thrust", "glutes", "beginners"],
  },
  {
    id: "pr_ht2", seriesId: "progression",
    title: "Hip Thrust Progression: adding load [Part 2/3]",
    hook: "Part 2: How to move from bodyweight to loaded hip thrusts.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film with a plate or light barbell on the hips. Show the setup: back against bench, feet planted, bar across hip crease, pad if available. Side angle for clear visibility of the movement.",
    captionIdea: "Moving from floor to bench and adding load changes the exercise significantly. The range of motion increases and the glutes have to work harder at the top. Start light — a plate or empty bar — and focus on feeling the glutes doing the work rather than just moving the weight. The mechanics matter more than the load at this stage.",
    tags: ["progression", "gym-footage", "hip-thrust", "glutes", "loading"],
  },
  {
    id: "pr_ht3", seriesId: "progression",
    title: "Hip Thrust Progression: barbell work [Part 3/3]",
    hook: "Part 3: Getting to your working weight and what to focus on from here.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film with a proper working weight — barbell with plates. Show the setup sequence, the movement, and the top position (full hip extension, glutes squeezed). Include a note about progressive overload.",
    captionIdea: "Once the movement pattern is solid, the hip thrust becomes one of the most loadable exercises in your lower body program. Progressive overload from here is straightforward: add small increments each week or add a rep. The glutes are a strong muscle group and they respond well to being challenged consistently over time.",
    cta: "Comment GLUTES for my full lower body program.",
    tags: ["progression", "gym-footage", "hip-thrust", "barbell", "glutes"],
  },

  // ── Deadlift From Scratch ─────────────────────────────────────────────────────
  {
    id: "dl1", seriesId: "deadlift",
    title: "Deadlift From Scratch: the hip hinge [Part 1/4]",
    hook: "If you’ve never deadlifted before, this is where to start.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film from the side demonstrating the hip hinge pattern: hands on hips, pushing hips back while hinging forward, keeping the spine neutral. Can use a wall to teach the hinge (stand a foot from a wall and hinge hips back to touch it). Film all 4 parts before posting.",
    captionIdea: "Before you touch a barbell for a deadlift, you need to understand the hip hinge. It’s the foundational movement pattern — and most people either don’t have it or don’t know how to access it under load. Spend a few sessions just drilling the hinge with no weight until it feels natural. This is what everything builds on.",
    tags: ["deadlift", "gym-footage", "hip-hinge", "movement-pattern", "beginners"],
  },
  {
    id: "dl2", seriesId: "deadlift",
    title: "Deadlift From Scratch: the setup [Part 2/4]",
    hook: "Part 2: The setup is 80% of a good deadlift.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film the deadlift setup in detail from the side: bar over mid-foot, hip-width stance, hinge down to the bar, engage lats before lifting. Show common errors (bar too far forward, rounding before the pull) and corrections.",
    captionIdea: "A good deadlift is mostly determined before the bar leaves the ground. Bar over mid-foot, hip-width stance, hinge to grip, then create tension through the whole body before you pull. If the setup is wrong, the pull will be wrong. Walk through this checklist every single rep until it becomes automatic.",
    tags: ["deadlift", "gym-footage", "setup", "form", "technique"],
  },
  {
    id: "dl3", seriesId: "deadlift",
    title: "Deadlift From Scratch: adding weight [Part 3/4]",
    hook: "Part 3: How to add weight without losing your form.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Film multiple sets with progressively heavier weight, showing that form stays consistent as load increases. Side angle. Include a note about when to stop adding weight.",
    captionIdea: "Adding weight to the deadlift is straightforward when the pattern is ingrained: small increments, full focus on the setup, and stop adding load the moment form breaks down. The weight will come. What matters in the early months is training the nervous system and building the movement habit with integrity.",
    tags: ["deadlift", "gym-footage", "progressive-overload", "form", "weight-progression"],
  },
  {
    id: "dl4", seriesId: "deadlift",
    title: "Deadlift From Scratch: where to go from here [Part 4/4]",
    hook: "Part 4: You can deadlift. Here’s how to keep improving.",
    format: "gym-footage", targetLength: "45-60s",
    filmingNote: "Summary video — can include text overlays for the progression plan. Show a confident working-weight deadlift. End with a practical next-step recommendation.",
    captionIdea: "Once the setup is solid and you can lift with good form consistently, the deadlift becomes one of the most productive exercises in your program. From here: pick a rep range (3-5 for strength, 6-8 for hypertrophy), add weight or reps each session, and film yourself occasionally to check that form holds up as load increases.",
    cta: "Comment DEADLIFT for the progression program I use.",
    tags: ["deadlift", "gym-footage", "progression", "long-term", "next-steps"],
  },
]

const EPISODE_MAP = new Map(EPISODES.map(e => [e.id, e]))

// ─── Format metadata ───────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<EpisodeFormat, string> = {
  "talking-head": "Talking Head",
  "gym-footage":  "Gym Footage",
  "b-roll-demo":  "B-Roll Demo",
  "do-with-me":   "Do With Me",
  "voiceover":    "Voiceover",
  "text-broll":   "Text + B-Roll",
}

const FORMAT_COLORS: Record<EpisodeFormat, string> = {
  "talking-head": "#c9a96e",
  "gym-footage":  "#9ec9a9",
  "b-roll-demo":  "#7bb3c9",
  "do-with-me":   "#b09ec9",
  "voiceover":    "#888888",
  "text-broll":   "#e8c98a",
}

const STATUS_LABELS: Record<EpisodeStatus, string> = {
  idea:   "IDEA",
  filmed: "FILMED",
  edited: "EDITED",
  posted: "POSTED",
}

const STATUS_COLORS: Record<EpisodeStatus, string> = {
  idea:   C.muted,
  filmed: C.blue,
  edited: C.green,
  posted: C.gold,
}

// ─── Tabs config ───────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "ideas",    icon: "💡", label: "Ideas" },
  { id: "edit",     icon: "✂️",  label: "Edit" },
  { id: "calendar", icon: "📅", label: "Calendar" },
  { id: "stats",    icon: "📊", label: "Stats" },
  { id: "sales",    icon: "💰", label: "Sales" },
]

// ─── Main component ────────────────────────────────────────────────────────────

function PlanPageClient() {
  const [state, setState] = useState<PlanState>(defaultState)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("home")

  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]')
    if (existing) existing.setAttribute("href", "/my-plan-manifest.json")
    else {
      const link = document.createElement("link")
      link.rel = "manifest"
      link.href = "/my-plan-manifest.json"
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    setState(loadState())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveState(state)
  }, [state, loaded])

  const update = useCallback((fn: (draft: PlanState) => PlanState) => {
    setState(prev => fn({ ...prev }))
  }, [])

  if (!loaded) {
    return (
      <div style={{ background: C.bg, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT_SERIF, color: C.muted, fontSize: 16 }}>Loading...</span>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", maxWidth: 480, margin: "0 auto", position: "relative", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, height: 52, zIndex: 100,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", boxSizing: "border-box",
      }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 15, color: C.gold, letterSpacing: "0.1em", fontWeight: 600 }}>
          LISA FIT METHOD
        </span>
        {state.startDate ? (
          <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.mutedLight }}>
            Day {getCurrentDay(state.startDate)}
          </span>
        ) : (
          <button
            onClick={() => setActiveTab("home")}
            style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.gold, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          >
            Set start date
          </button>
        )}
      </header>

      <nav style={{
        position: "fixed", top: 52, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, height: 44, zIndex: 99,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "stretch", overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: "0 0 auto", padding: "0 14px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.id ? `2px solid ${C.gold}` : "2px solid transparent",
              color: activeTab === tab.id ? C.gold : C.muted,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontFamily: FONT_SANS, fontSize: 9, letterSpacing: "0.06em", lineHeight: 1 }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main style={{ marginTop: 96, flex: 1, overflowY: "auto", paddingBottom: 32 }}>
        {activeTab === "home"     && <HomeTab state={state} update={update} />}
        {activeTab === "ideas"    && <IdeasTab state={state} update={update} />}
        {activeTab === "edit"     && <EditTab state={state} update={update} switchToCalendar={() => setActiveTab("calendar")} />}
        {activeTab === "calendar" && <CalendarTab state={state} update={update} />}
        {activeTab === "stats"    && <StatsTab state={state} update={update} />}
        {activeTab === "sales"    && <SalesTab state={state} update={update} />}
      </main>
    </div>
  )
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({ state, update }: { state: PlanState; update: (fn: (d: PlanState) => PlanState) => void }) {
  const [dateInput, setDateInput] = useState("")

  const currentDay = getCurrentDay(state.startDate)
  const currentWeek = currentDay > 0 ? Math.ceil(currentDay / 7) : 1

  const totalEpisodes = EPISODES.length
  const statusCounts = EPISODES.reduce<Record<EpisodeStatus, number>>(
    (acc, ep) => {
      const s: EpisodeStatus = state.episodeStatuses[ep.id] ?? "idea"
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    },
    { idea: 0, filmed: 0, edited: 0, posted: 0 }
  )
  const filmedCount = statusCounts.filmed + statusCounts.edited + statusCounts.posted
  const readyCount = statusCounts.edited
  const postedCount = state.postedEntries.length

  const nextToFilm = EPISODES.filter(e => (state.episodeStatuses[e.id] ?? "idea") === "idea").slice(0, 3)
  const readyToPost = EPISODES.filter(e => state.episodeStatuses[e.id] === "edited")

  const thisWeekMonday = getMondayOf(new Date())
  const weekRevenue = state.weeklySales
    .filter(ws => ws.weekOf === thisWeekMonday)
    .reduce((sum, ws) => sum + ws.amount, 0)

  if (!state.startDate) {
    return (
      <div style={{ padding: "32px 16px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 20px" }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 24, color: C.cream, margin: "0 0 8px 0" }}>When did you start?</p>
          <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.muted, margin: "0 0 24px 0", lineHeight: 1.6 }}>
            Set your start date to activate your content dashboard.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="date"
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontFamily: FONT_SANS, fontSize: 13, color: C.cream, outline: "none", boxSizing: "border-box" }}
            />
            <button
              onClick={() => { if (dateInput) update(d => ({ ...d, startDate: dateInput })) }}
              style={{ background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Set Date
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
        <p style={{ fontFamily: FONT_SERIF, fontSize: 28, color: C.cream, margin: "0 0 4px 0" }}>Day {currentDay} of 90</p>
        <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.muted, margin: 0 }}>Week {currentWeek}</p>
        <div style={{ marginTop: 12, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (currentDay / 90) * 100)}%`, background: C.gold, borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        {([
          { label: "Ideas",  value: totalEpisodes,  color: C.muted },
          { label: "Filmed", value: filmedCount,    color: C.blue },
          { label: "Ready",  value: readyCount,     color: C.green },
          { label: "Posted", value: postedCount,    color: C.gold },
        ] as const).map(chip => (
          <div key={chip.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 22, color: chip.color, margin: "0 0 2px 0" }}>{chip.value}</p>
            <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted, margin: 0 }}>{chip.label}</p>
          </div>
        ))}
      </div>

      {nextToFilm.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.gold, margin: "0 0 12px 0" }}>Next to Film</p>
          {nextToFilm.map(ep => (
            <div key={ep.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontFamily: FONT_SANS, background: FORMAT_COLORS[ep.format] + "22", color: FORMAT_COLORS[ep.format], border: `1px solid ${FORMAT_COLORS[ep.format]}44` }}>
                {FORMAT_LABELS[ep.format]}
              </span>
              <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.cream, margin: 0, flex: 1 }}>{ep.title}</p>
            </div>
          ))}
        </div>
      )}

      {readyToPost.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green, margin: "0 0 12px 0" }}>
            Ready to Post ({readyToPost.length})
          </p>
          {readyToPost.slice(0, 2).map(ep => (
            <p key={ep.id} style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.cream, margin: "0 0 6px 0" }}>{ep.title}</p>
          ))}
          {readyToPost.length > 2 && (
            <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: 0 }}>+{readyToPost.length - 2} more</p>
          )}
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
        <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.goldLight, margin: "0 0 8px 0" }}>This Week</p>
        <p style={{ fontFamily: FONT_SERIF, fontSize: 28, color: weekRevenue > 0 ? C.gold : C.muted, margin: 0 }}>
          {weekRevenue > 0 ? formatCurrency(weekRevenue) : "$0"}
        </p>
        <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: "4px 0 0 0" }}>Week of {formatDate(thisWeekMonday)}</p>
      </div>
    </div>
  )
}

// ─── Ideas Tab ────────────────────────────────────────────────────────────────

function IdeasTab({ state, update }: { state: PlanState; update: (fn: (d: PlanState) => PlanState) => void }) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const seriesFilters = SERIES.map(s => ({ id: s.id, label: s.name }))
  const formatFilters: Array<{ id: string; label: string }> = [
    { id: "fmt-talking-head", label: "Talking Head" },
    { id: "fmt-gym-footage",  label: "Gym Footage" },
    { id: "fmt-b-roll-demo",  label: "B-Roll Demo" },
    { id: "fmt-do-with-me",   label: "Do With Me" },
    { id: "fmt-voiceover",    label: "Voiceover" },
    { id: "fmt-text-broll",   label: "Text + B-Roll" },
  ]
  const allFilters = [{ id: "all", label: "All" }, ...seriesFilters, ...formatFilters]

  const filtered = EPISODES.filter(ep => {
    if (activeFilter === "all") return true
    if (activeFilter.startsWith("fmt-")) {
      const fmt = activeFilter.slice(4) as EpisodeFormat
      return ep.format === fmt
    }
    return ep.seriesId === activeFilter
  })

  function getStatus(id: string): EpisodeStatus {
    return state.episodeStatuses[id] ?? "idea"
  }

  function setStatus(id: string, s: EpisodeStatus) {
    update(d => ({ ...d, episodeStatuses: { ...d.episodeStatuses, [id]: s } }))
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16, paddingBottom: 4 }}>
        {allFilters.map(f => {
          const isActive = activeFilter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                flex: "0 0 auto", padding: "6px 12px", borderRadius: 999,
                fontFamily: FONT_SANS, fontSize: 11, cursor: "pointer",
                background: "transparent",
                border: isActive ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
                color: isActive ? C.gold : C.muted,
                letterSpacing: "0.04em",
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(ep => {
          const status = getStatus(ep.id)
          const series = SERIES_MAP.get(ep.seriesId)
          const isExpanded = expandedId === ep.id

          return (
            <div key={ep.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "12px 14px", textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontFamily: FONT_SANS, background: FORMAT_COLORS[ep.format] + "22", color: FORMAT_COLORS[ep.format], border: `1px solid ${FORMAT_COLORS[ep.format]}44` }}>
                    {FORMAT_LABELS[ep.format]}
                  </span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted }}>{series?.name ?? ep.seriesId}</span>
                  <span style={{ marginLeft: "auto", display: "inline-block", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontFamily: FONT_SANS, background: STATUS_COLORS[status] + "22", color: STATUS_COLORS[status], border: `1px solid ${STATUS_COLORS[status]}44` }}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.cream, fontWeight: 600, margin: "0 0 4px 0" }}>{ep.title}</p>
                <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", whiteSpace: isExpanded ? "normal" : "nowrap", textOverflow: isExpanded ? "clip" : "ellipsis" }}>
                  {ep.hook}
                </p>
              </button>

              {isExpanded && (
                <div style={{ padding: "0 14px 14px 14px", borderTop: `1px solid ${C.border}` }}>
                  <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px 0" }}>Hook</p>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.cream, margin: 0, lineHeight: 1.5 }}>{ep.hook}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px 0" }}>Filming Note</p>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.mutedLight, margin: 0, lineHeight: 1.6 }}>{ep.filmingNote}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px 0" }}>Caption Idea</p>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.mutedLight, margin: 0, lineHeight: 1.6 }}>{ep.captionIdea}</p>
                    </div>
                    {ep.cta && (
                      <div>
                        <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px 0" }}>CTA</p>
                        <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.cream, margin: 0 }}>{ep.cta}</p>
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ep.tags.map(tag => (
                        <span key={tag} style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted, background: C.border + "99", padding: "2px 8px", borderRadius: 999 }}>#{tag}</span>
                      ))}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      {status === "idea" && (
                        <button onClick={() => setStatus(ep.id, "filmed")} style={{ background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Mark as Filmed {"→"}
                        </button>
                      )}
                      {status === "filmed" && (
                        <button onClick={() => setStatus(ep.id, "edited")} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Mark as Edited {"✓"}
                        </button>
                      )}
                      {status === "edited" && (
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.green, padding: "9px 0", display: "inline-block" }}>Ready to Post {"✓"}</span>
                      )}
                      {status === "posted" && (
                        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.gold, padding: "9px 0", display: "inline-block" }}>Posted {"✓"}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Edit Tab ─────────────────────────────────────────────────────────────────

interface EpCardProps {
  ep: Episode
  action: React.ReactNode
}

function EpCard({ ep, action }: EpCardProps) {
  const series = SERIES_MAP.get(ep.seriesId)
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontFamily: FONT_SANS, background: FORMAT_COLORS[ep.format] + "22", color: FORMAT_COLORS[ep.format], border: `1px solid ${FORMAT_COLORS[ep.format]}44` }}>
          {FORMAT_LABELS[ep.format]}
        </span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted }}>{series?.name ?? ep.seriesId}</span>
      </div>
      <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.cream, fontWeight: 600, margin: 0 }}>{ep.title}</p>
      <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ep.hook}</p>
      <div style={{ paddingTop: 4 }}>{action}</div>
    </div>
  )
}

function EditTab({ state, update, switchToCalendar }: { state: PlanState; update: (fn: (d: PlanState) => PlanState) => void; switchToCalendar: () => void }) {
  const filmed = EPISODES.filter(e => state.episodeStatuses[e.id] === "filmed")
  const ready  = EPISODES.filter(e => state.episodeStatuses[e.id] === "edited")

  function markEdited(id: string) {
    update(d => ({ ...d, episodeStatuses: { ...d.episodeStatuses, [id]: "edited" } }))
  }

  if (filmed.length === 0 && ready.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Nothing in edit yet. Go to Ideas and mark episodes as filmed.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "16px" }}>
      {filmed.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.blue, margin: "0 0 12px 0" }}>Filmed — needs editing ({filmed.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filmed.map(ep => (
              <EpCard
                key={ep.id}
                ep={ep}
                action={
                  <button onClick={() => markEdited(ep.id)} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Mark as Edited / Ready {"✓"}
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {ready.length > 0 && (
        <div>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green, margin: "0 0 12px 0" }}>Ready to post ({ready.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ready.map(ep => (
              <EpCard
                key={ep.id}
                ep={ep}
                action={
                  <button onClick={switchToCalendar} style={{ background: "transparent", color: C.gold, border: `1px solid ${C.gold}44`, borderRadius: 8, padding: "8px 16px", fontFamily: FONT_SANS, fontSize: 12, cursor: "pointer" }}>
                    Schedule in Calendar {"→"}
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ state, update }: { state: PlanState; update: (fn: (d: PlanState) => PlanState) => void }) {
  const [pickDateFor, setPickDateFor] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState("")

  const readyEpisodes = EPISODES.filter(e => state.episodeStatuses[e.id] === "edited")

  function scheduleEpisode(episodeId: string, date: string) {
    const entry: PostedEntry = { id: generateId(), episodeId, postedDate: date }
    update(d => ({
      ...d,
      episodeStatuses: { ...d.episodeStatuses, [episodeId]: "posted" },
      postedEntries: [...d.postedEntries, entry],
    }))
    setPickDateFor(null)
    setCustomDate("")
  }

  const entriesByMonth: Record<string, PostedEntry[]> = {}
  state.postedEntries.forEach(pe => {
    const mk = pe.postedDate.slice(0, 7)
    if (!entriesByMonth[mk]) entriesByMonth[mk] = []
    entriesByMonth[mk].push(pe)
  })
  const monthKeys = Object.keys(entriesByMonth).sort().reverse()

  function getMonthLabel(key: string): string {
    const d = new Date(key + "-01T12:00:00")
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  function setRating(entryId: string, rating: 1 | 2 | 3 | 4 | 5) {
    update(d => ({
      ...d,
      postedEntries: d.postedEntries.map(pe => pe.id === entryId ? { ...pe, starRating: rating } : pe),
    }))
  }

  return (
    <div style={{ padding: "16px" }}>
      {readyEpisodes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green, margin: "0 0 12px 0" }}>Ready Queue</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {readyEpisodes.map((ep, i) => {
              const tempEntries = [...state.postedEntries]
              for (let j = 0; j < i; j++) {
                tempEntries.push({ id: "tmp" + j, episodeId: readyEpisodes[j].id, postedDate: getNextAvailableDate(tempEntries) })
              }
              const suggestedDate = getNextAvailableDate(tempEntries)
              const series = SERIES_MAP.get(ep.seriesId)

              return (
                <div key={ep.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.cream, fontWeight: 600, margin: "0 0 4px 0" }}>{ep.title}</p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: "0 0 10px 0" }}>{series?.name ?? ep.seriesId}</p>
                  {pickDateFor === ep.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="date"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontFamily: FONT_SANS, fontSize: 12, color: C.cream, outline: "none" }}
                      />
                      <button onClick={() => { if (customDate) scheduleEpisode(ep.id, customDate) }} style={{ background: C.green, color: C.bg, border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Set
                      </button>
                      <button onClick={() => setPickDateFor(null)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontFamily: FONT_SANS, fontSize: 12, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => scheduleEpisode(ep.id, suggestedDate)} style={{ background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "8px 14px", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Schedule for {formatDate(suggestedDate)}
                      </button>
                      <button onClick={() => { setPickDateFor(ep.id); setCustomDate(suggestedDate) }} style={{ background: "transparent", color: C.mutedLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontFamily: FONT_SANS, fontSize: 12, cursor: "pointer" }}>
                        Pick a Date
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.gold, margin: "0 0 12px 0" }}>Posted</p>
      {monthKeys.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.muted }}>Nothing posted yet.</p>
      ) : (
        monthKeys.map(mk => (
          <div key={mk} style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.mutedLight, margin: "0 0 8px 0", letterSpacing: "0.06em" }}>{getMonthLabel(mk)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...entriesByMonth[mk]].sort((a, b) => b.postedDate.localeCompare(a.postedDate)).map(pe => {
                const ep = EPISODE_MAP.get(pe.episodeId)
                const series = ep ? SERIES_MAP.get(ep.seriesId) : null
                return (
                  <div key={pe.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.mutedLight, margin: 0, fontWeight: 600 }}>{formatDateLong(pe.postedDate)}</p>
                      {ep && (
                        <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontFamily: FONT_SANS, background: FORMAT_COLORS[ep.format] + "22", color: FORMAT_COLORS[ep.format], border: `1px solid ${FORMAT_COLORS[ep.format]}44` }}>
                          {FORMAT_LABELS[ep.format]}
                        </span>
                      )}
                    </div>
                    {ep && <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.cream, fontWeight: 600, margin: "0 0 2px 0" }}>{ep.title}</p>}
                    {series && <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: "0 0 8px 0" }}>{series.name}</p>}
                    <div style={{ display: "flex", gap: 4 }}>
                      {([1, 2, 3, 4, 5] as const).map(star => (
                        <button key={star} onClick={() => setRating(pe.id, star)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 1px", color: (pe.starRating ?? 0) >= star ? C.gold : C.border }}>
                          {"★"}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

interface MetricEdit {
  views: string
  likes: string
  comments: string
  saves: string
  note: string
}

function StatsTab({ state, update }: { state: PlanState; update: (fn: (d: PlanState) => PlanState) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editMetrics, setEditMetrics] = useState<Record<string, MetricEdit>>({})

  const sortedEntries = [...state.postedEntries].sort((a, b) => b.postedDate.localeCompare(a.postedDate))
  const ratedEntries = sortedEntries.filter(pe => pe.starRating)
  const avgRating = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum, pe) => sum + (pe.starRating ?? 0), 0) / ratedEntries.length).toFixed(1)
    : null
  const bestEntry = ratedEntries.length > 0
    ? ratedEntries.reduce((best, pe) => (pe.starRating ?? 0) > (best.starRating ?? 0) ? pe : best)
    : null
  const bestEpisode = bestEntry ? EPISODE_MAP.get(bestEntry.episodeId) : null

  function getMetricsEdit(id: string): MetricEdit {
    const entry = state.postedEntries.find(pe => pe.id === id)
    if (!entry) return { views: "", likes: "", comments: "", saves: "", note: "" }
    return {
      views:    entry.views?.toString() ?? "",
      likes:    entry.likes?.toString() ?? "",
      comments: entry.comments?.toString() ?? "",
      saves:    entry.saves?.toString() ?? "",
      note:     entry.note ?? "",
    }
  }

  function initEdit(id: string) {
    setEditMetrics(prev => prev[id] ? prev : { ...prev, [id]: getMetricsEdit(id) })
    setExpandedId(id)
  }

  function saveMetrics(id: string) {
    const m = editMetrics[id]
    if (!m) return
    update(d => ({
      ...d,
      postedEntries: d.postedEntries.map(pe =>
        pe.id !== id ? pe : {
          ...pe,
          views:    m.views    ? parseInt(m.views)    : undefined,
          likes:    m.likes    ? parseInt(m.likes)    : undefined,
          comments: m.comments ? parseInt(m.comments) : undefined,
          saves:    m.saves    ? parseInt(m.saves)    : undefined,
          note:     m.note || undefined,
        }
      ),
    }))
  }

  function setRating(entryId: string, rating: 1 | 2 | 3 | 4 | 5) {
    update(d => ({
      ...d,
      postedEntries: d.postedEntries.map(pe => pe.id === entryId ? { ...pe, starRating: rating } : pe),
    }))
  }

  function updateEditField(id: string, field: keyof MetricEdit, val: string) {
    setEditMetrics(prev => ({ ...prev, [id]: { ...(prev[id] ?? getMetricsEdit(id)), [field]: val } }))
  }

  if (sortedEntries.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Start posting and come back here to rate your content.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 24, color: C.gold, margin: "0 0 2px 0" }}>{sortedEntries.length}</p>
            <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted, margin: 0 }}>Posted</p>
          </div>
          {avgRating && (
            <div style={{ textAlign: "center", flex: 1 }}>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 24, color: C.gold, margin: "0 0 2px 0" }}>{avgRating}{"★"}</p>
              <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted, margin: 0 }}>Avg Rating</p>
            </div>
          )}
          {bestEpisode && (
            <div style={{ flex: 2 }}>
              <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted, margin: "0 0 2px 0" }}>Best</p>
              <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.cream, margin: 0, lineHeight: 1.3 }}>{bestEpisode.title}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sortedEntries.map(pe => {
          const ep = EPISODE_MAP.get(pe.episodeId)
          const series = ep ? SERIES_MAP.get(ep.seriesId) : null
          const isExpanded = expandedId === pe.id
          const em = editMetrics[pe.id] ?? getMetricsEdit(pe.id)

          return (
            <div key={pe.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={() => isExpanded ? setExpandedId(null) : initEdit(pe.id)}
                style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "12px 14px", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.mutedLight, margin: "0 0 3px 0" }}>{formatDateLong(pe.postedDate)}</p>
                    {ep && <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.cream, fontWeight: 600, margin: "0 0 2px 0" }}>{ep.title}</p>}
                    {series && <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: 0 }}>{series.name}</p>}
                  </div>
                  {ep && (
                    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontFamily: FONT_SANS, background: FORMAT_COLORS[ep.format] + "22", color: FORMAT_COLORS[ep.format], border: `1px solid ${FORMAT_COLORS[ep.format]}44`, marginLeft: 8 }}>
                      {FORMAT_LABELS[ep.format]}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  {([1, 2, 3, 4, 5] as const).map(star => (
                    <span key={star} style={{ fontSize: 16, color: (pe.starRating ?? 0) >= star ? C.gold : C.border }}>{"★"}</span>
                  ))}
                </div>
              </button>

              {isExpanded && (
                <div style={{ padding: "0 14px 14px 14px", borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 4, padding: "12px 0 10px 0" }}>
                    {([1, 2, 3, 4, 5] as const).map(star => (
                      <button key={star} onClick={() => setRating(pe.id, star)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 22, padding: "2px 2px", color: (pe.starRating ?? 0) >= star ? C.gold : C.border }}>
                        {"★"}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {(["views", "likes", "comments", "saves"] as const).map(field => (
                      <div key={field}>
                        <p style={{ fontFamily: FONT_SANS, fontSize: 10, color: C.muted, margin: "0 0 3px 0", textTransform: "capitalize" }}>{field}</p>
                        <input
                          type="number"
                          value={em[field]}
                          onChange={e => updateEditField(pe.id, field, e.target.value)}
                          placeholder="0"
                          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", fontFamily: FONT_SANS, fontSize: 12, color: C.cream, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={em.note}
                    onChange={e => updateEditField(pe.id, "note", e.target.value)}
                    placeholder="Notes..."
                    rows={2}
                    style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", fontFamily: FONT_SANS, fontSize: 12, color: C.cream, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 8 }}
                  />
                  <button onClick={() => saveMetrics(pe.id)} style={{ background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "8px 18px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Save Metrics
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────

function SalesTab({ state, update }: { state: PlanState; update: (fn: (d: PlanState) => PlanState) => void }) {
  const thisWeekMonday = getMondayOf(new Date())
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [editId, setEditId] = useState<string | null>(null)

  const existingThisWeek = state.weeklySales.find(ws => ws.weekOf === thisWeekMonday)

  useEffect(() => {
    if (existingThisWeek) {
      setAmount(existingThisWeek.amount.toString())
      setNote(existingThisWeek.note ?? "")
      setEditId(existingThisWeek.id)
    } else {
      setAmount("")
      setNote("")
      setEditId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingThisWeek?.id])

  function saveEntry() {
    const amt = parseFloat(amount)
    if (isNaN(amt)) return
    if (editId) {
      update(d => ({
        ...d,
        weeklySales: d.weeklySales.map(ws => ws.id === editId ? { ...ws, amount: amt, note: note || undefined } : ws),
      }))
    } else {
      const entry: WeeklySales = { id: generateId(), weekOf: thisWeekMonday, amount: amt, note: note || undefined }
      update(d => ({ ...d, weeklySales: [...d.weeklySales, entry] }))
    }
  }

  const byMonth: Record<string, WeeklySales[]> = {}
  state.weeklySales.forEach(ws => {
    const mk = ws.weekOf.slice(0, 7)
    if (!byMonth[mk]) byMonth[mk] = []
    byMonth[mk].push(ws)
  })
  const monthKeys = Object.keys(byMonth).sort().reverse()

  function getMonthTotal(mk: string): number {
    return (byMonth[mk] ?? []).reduce((sum, ws) => sum + ws.amount, 0)
  }

  function getMonthNumber(mk: string): string {
    if (!state.startDate) {
      const d = new Date(mk + "-01T12:00:00")
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }
    const start = new Date(state.startDate + "T12:00:00")
    const entryDate = new Date(mk + "-01T12:00:00")
    const monthsDiff = (entryDate.getFullYear() - start.getFullYear()) * 12 + (entryDate.getMonth() - start.getMonth())
    const num = monthsDiff + 1
    if (num >= 1 && num <= 3) return `Month ${num}`
    const d = new Date(mk + "-01T12:00:00")
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  return (
    <div style={{ padding: "16px" }}>
      {!state.startDate && (
        <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.muted, marginBottom: 16 }}>
          Set your start date in Home to track months.
        </p>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.gold, margin: "0 0 12px 0" }}>
          {existingThisWeek ? "Edit This Week" : "Log This Week"}
        </p>
        <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: "0 0 12px 0" }}>Week of {formatDate(thisWeekMonday)}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Revenue amount ($)"
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontFamily: FONT_SANS, fontSize: 13, color: C.cream, outline: "none", boxSizing: "border-box" }}
          />
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontFamily: FONT_SANS, fontSize: 13, color: C.cream, outline: "none", resize: "none", boxSizing: "border-box" }}
          />
          <button
            onClick={saveEntry}
            style={{ background: C.gold, color: C.bg, border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}
          >
            Save
          </button>
        </div>
      </div>

      {monthKeys.map(mk => (
        <div key={mk} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: C.gold, margin: 0 }}>{getMonthNumber(mk)}</p>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 20, color: C.cream, margin: 0 }}>{formatCurrency(getMonthTotal(mk))}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...byMonth[mk]].sort((a, b) => b.weekOf.localeCompare(a.weekOf)).map(ws => (
              <div key={ws.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.mutedLight, margin: "0 0 2px 0" }}>Week of {formatDate(ws.weekOf)}</p>
                  {ws.note && <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.muted, margin: 0 }}>{ws.note}</p>}
                </div>
                <p style={{ fontFamily: FONT_SERIF, fontSize: 18, color: C.cream, margin: 0 }}>{formatCurrency(ws.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {monthKeys.length === 0 && (
        <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.muted }}>No sales logged yet. Log your first week above.</p>
      )}
    </div>
  )
}

export default PlanPageClient
