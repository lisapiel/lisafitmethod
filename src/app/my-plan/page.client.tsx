"use client"
import { useEffect, useState, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  week: number
  phase: 1 | 2 | 3
  category: "setup" | "content" | "outreach" | "coaching" | "launch" | "analytics" | "build"
  title: string
  note?: string
  priority: "high" | "medium" | "low"
}

interface Client {
  id: string
  name: string
  startDate: string
  nextCall: string
  monthlyFee: number
  status: "active" | "paused" | "completed"
  notes: string
}

interface RevenueMonth {
  mrr: number
  courseSales: number
  challengeRevenue: number
  otherRevenue: number
}

interface Metrics {
  instagram: number
  tiktok: number
  email: number
  lastUpdated: string
}

interface PlanState {
  startDate: string | null
  completedTasks: Record<string, boolean>
  revenue: { m1: RevenueMonth; m2: RevenueMonth; m3: RevenueMonth }
  clients: Client[]
  metrics: Metrics
}

type Tab = "home" | "tasks" | "revenue" | "clients"

// ─── Task Data ────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  // ── Phase 1 · Week 1 ──────────────────────────────────────────────────────
  { id: "p1w1_1", week: 1, phase: 1, category: "setup", priority: "high", title: "Raise Training Foundations price to $97", note: "Do this on your course platform today: every sale from now earns $50 more" },
  { id: "p1w1_2", week: 1, phase: 1, category: "setup", priority: "high", title: "Update coaching page: add $400/month price + 15-spot cap", note: "Add the 5 offer elements (2 calls, custom program, weekly check-in, messaging, course included)" },
  { id: "p1w1_3", week: 1, phase: 1, category: "build", priority: "high", title: "Write Nutrition Foundations PDF (2 hrs)", note: "Use Module 4 content: expand each principle to 2–3 paragraphs, add simple meal examples" },
  { id: "p1w1_4", week: 1, phase: 1, category: "setup", priority: "high", title: "Create $147 Starter Bundle product page (TF + Nutrition PDF)" },
  { id: "p1w1_5", week: 1, phase: 1, category: "setup", priority: "high", title: "Update Instagram + TikTok bio", note: "Bio: 'Strength training foundations for women → link'" },
  { id: "p1w1_6", week: 1, phase: 1, category: "setup", priority: "high", title: "Update Linktree: Free guide → Course ($97) → Bundle ($147) → Coaching" },
  { id: "p1w1_7", week: 1, phase: 1, category: "content", priority: "high", title: "Filming Day 1: shoot 5–8 videos", note: "Use scripts from VIRAL_CONTENT.md: Piece 1 (Two-Year Nothing), Piece 8 (Engineer vs. Influencer)" },
  { id: "p1w1_8", week: 1, phase: 1, category: "outreach", priority: "medium", title: "Send testimonial request email to all past buyers", note: "Use Piece 10 from VIRAL_CONTENT.md" },

  // ── Phase 1 · Week 2 ──────────────────────────────────────────────────────
  { id: "p1w2_1", week: 2, phase: 1, category: "content", priority: "high", title: "Post Reddit education piece (Piece 9: The 5 Movements)", note: "r/xxfitness: education only, no pitch in the post body" },
  { id: "p1w2_2", week: 2, phase: 1, category: "content", priority: "high", title: "Post Engineer carousel on Instagram (Piece 3)" },
  { id: "p1w2_3", week: 2, phase: 1, category: "outreach", priority: "high", title: "DM 10–15 engaged followers about coaching spots", note: "Personal, direct: 'I'm opening 15 coaching spots this month: if you've been thinking about it, now is the time.'" },
  { id: "p1w2_4", week: 2, phase: 1, category: "content", priority: "medium", title: "Filming Day 2: shoot 5–8 videos", note: "Pieces 3, 7 (Industry Wants You Confused)" },
  { id: "p1w2_5", week: 2, phase: 1, category: "coaching", priority: "high", title: "Sign 2 coaching clients", note: "Target from DMs + organic interest. Send application form link." },
  { id: "p1w2_6", week: 2, phase: 1, category: "content", priority: "medium", title: "Post daily on TikTok + Instagram (1–2/day)", note: "Cross-post same video: export TikTok without watermark → Reels" },

  // ── Phase 1 · Week 3 ──────────────────────────────────────────────────────
  { id: "p1w3_1", week: 3, phase: 1, category: "content", priority: "high", title: "Post 'Two-Year Nothing' on TikTok (Piece 1)", note: "Your first viral attempt: 60s talking head. Film fresh if needed." },
  { id: "p1w3_2", week: 3, phase: 1, category: "content", priority: "high", title: "Post 'Industry Wants You Confused' on Instagram (Piece 7)" },
  { id: "p1w3_3", week: 3, phase: 1, category: "outreach", priority: "medium", title: "Engage r/xxfitness daily: comment, add value, don't pitch", note: "5 minutes/day. Reply to beginner questions with genuinely helpful answers." },
  { id: "p1w3_4", week: 3, phase: 1, category: "content", priority: "medium", title: "Filming Day 3: shoot 5–8 videos" },
  { id: "p1w3_5", week: 3, phase: 1, category: "coaching", priority: "high", title: "Hit 4–5 coaching clients total" },

  // ── Phase 1 · Week 4 ──────────────────────────────────────────────────────
  { id: "p1w4_1", week: 4, phase: 1, category: "launch", priority: "high", title: "Announce challenge: '4-Week Foundation Reset opens in 2 weeks: join waitlist'" },
  { id: "p1w4_2", week: 4, phase: 1, category: "content", priority: "high", title: "Post 'Nobody Tells Beginners' (Piece 2): long Reel or YouTube" },
  { id: "p1w4_3", week: 4, phase: 1, category: "content", priority: "high", title: "Post 'The Year My Back Gave Out' (Piece 4)", note: "Your deepest story piece. Best on YouTube long-form or long caption." },
  { id: "p1w4_4", week: 4, phase: 1, category: "content", priority: "medium", title: "Filming Day 4 + pre-film Philippines travel content", note: "Film 10+ videos if leaving soon: schedule them across your 2 travel weeks" },
  { id: "p1w4_5", week: 4, phase: 1, category: "analytics", priority: "high", title: "Month 1 check: target $5,000+ revenue", note: "Coaching × 5 ($2,000) + 25 course sales ($2,425) + 8 bundles ($1,176) = ~$5,600" },

  // ── Phase 2 · Week 5 ──────────────────────────────────────────────────────
  { id: "p2w5_1", week: 5, phase: 2, category: "launch", priority: "high", title: "Post challenge announcement content daily", note: "What it is: 4-week live cohort, private group, weekly Q&A, accountability. $97." },
  { id: "p2w5_2", week: 5, phase: 2, category: "launch", priority: "high", title: "Use Specific Claim template for all challenge promo (Piece 5 style)" },
  { id: "p2w5_3", week: 5, phase: 2, category: "setup", priority: "high", title: "Add challenge waitlist page to email opt-in + Linktree" },
  { id: "p2w5_4", week: 5, phase: 2, category: "launch", priority: "high", title: "Target 30 waitlist signups before cart opens" },

  // ── Phase 2 · Week 6 ──────────────────────────────────────────────────────
  { id: "p2w6_1", week: 6, phase: 2, category: "launch", priority: "high", title: "Open challenge cart: email waitlist + daily countdown posts" },
  { id: "p2w6_2", week: 6, phase: 2, category: "outreach", priority: "high", title: "DM everyone who commented 'interested' on challenge posts" },
  { id: "p2w6_3", week: 6, phase: 2, category: "launch", priority: "high", title: "Close cart at 50 signups or end of week", note: "Target: $4,850 from challenge alone" },
  { id: "p2w6_4", week: 6, phase: 2, category: "coaching", priority: "medium", title: "Continue coaching DM outreach: push toward 10 clients total" },

  // ── Phase 2 · Week 7 (Philippines) ───────────────────────────────────────
  { id: "p2w7_1", week: 7, phase: 2, category: "content", priority: "high", title: "Post Philippines content from pre-filmed queue", note: "'Training from anywhere': bodyweight foundations, hotel workouts" },
  { id: "p2w7_2", week: 7, phase: 2, category: "launch", priority: "high", title: "Run challenge: post daily prompt in group (5 min/day)", note: "Keep energy high: your group runs itself if you seed it daily" },
  { id: "p2w7_3", week: 7, phase: 2, category: "launch", priority: "high", title: "Run weekly Q&A (30 min on Sunday)", note: "This is the only synchronous commitment during the challenge" },

  // ── Phase 2 · Week 8 ──────────────────────────────────────────────────────
  { id: "p2w8_1", week: 8, phase: 2, category: "launch", priority: "high", title: "Challenge Week 4: announce coaching spots for completers", note: "Email + DM: 'You finished. Here's what's next.'" },
  { id: "p2w8_2", week: 8, phase: 2, category: "outreach", priority: "high", title: "Email + DM all challenge completers with coaching offer" },
  { id: "p2w8_3", week: 8, phase: 2, category: "coaching", priority: "high", title: "Collect testimonials from challenge completers", note: "Use Piece 10 (Testimonial Request) template, adapted for challenge" },
  { id: "p2w8_4", week: 8, phase: 2, category: "analytics", priority: "high", title: "Month 2 check: target $10,000+ revenue", note: "10 clients ($4,000) + challenge ($4,850) + 35 course/bundle sales ($3,500) = ~$12,350" },

  // ── Phase 3 · Week 9 (France) ────────────────────────────────────────────
  { id: "p3w9_1", week: 9, phase: 3, category: "content", priority: "high", title: "Post France lifestyle content", note: "Training in France, outdoor workouts, 'how I train while traveling', cultural angle" },
  { id: "p3w9_2", week: 9, phase: 3, category: "build", priority: "high", title: "Start Level 2 course outline ('Training Progression')", note: "4 modules: reading your progress, intermediate movements, 8-week cycle, recovery" },
  { id: "p3w9_3", week: 9, phase: 3, category: "content", priority: "high", title: "Post social proof carousel from challenge completers", note: "Use their testimonials + before/after framing. Ask permission first." },
  { id: "p3w9_4", week: 9, phase: 3, category: "coaching", priority: "high", title: "Target: 12 coaching clients active (challenge upsells included)" },

  // ── Phase 3 · Week 10 ─────────────────────────────────────────────────────
  { id: "p3w10_1", week: 10, phase: 3, category: "build", priority: "high", title: "Film Level 2 course (2 filming days)", note: "Same format as Training Foundations: module intro, exercise demos, coaching cues" },
  { id: "p3w10_2", week: 10, phase: 3, category: "launch", priority: "high", title: "Announce Cohort 2 challenge ('opens in 2 weeks')" },
  { id: "p3w10_3", week: 10, phase: 3, category: "content", priority: "medium", title: "Publish 'Why Random Workouts Don't Work' blog post (Piece 6)", note: "Already written: just publish and share to Instagram stories" },
  { id: "p3w10_4", week: 10, phase: 3, category: "launch", priority: "high", title: "Build Cohort 2 waitlist: target 40+ signups" },

  // ── Phase 3 · Week 11 ─────────────────────────────────────────────────────
  { id: "p3w11_1", week: 11, phase: 3, category: "launch", priority: "high", title: "Level 2 'Training Progression' goes live at $97" },
  { id: "p3w11_2", week: 11, phase: 3, category: "launch", priority: "high", title: "Create 'Complete Foundations System' bundle at $197 (TF + Level 2)" },
  { id: "p3w11_3", week: 11, phase: 3, category: "launch", priority: "high", title: "Open Cohort 2 cart: $97, target 40 signups = $3,880" },
  { id: "p3w11_4", week: 11, phase: 3, category: "content", priority: "high", title: "Post 'What to do after Training Foundations' content", note: "Sets up Level 2 purchase and keeps existing buyers engaged" },

  // ── Phase 3 · Week 12 ─────────────────────────────────────────────────────
  { id: "p3w12_1", week: 12, phase: 3, category: "analytics", priority: "high", title: "Month 3 check: target $15,000+ revenue", note: "13 clients ($5,200) + upsells ($2,800) + courses ($5,000) + Level 2 ($1,940) + Cohort 2 ($3,880) = ~$18,820" },
  { id: "p3w12_2", week: 12, phase: 3, category: "coaching", priority: "high", title: "Hit 13–15 coaching clients active" },
  { id: "p3w12_3", week: 12, phase: 3, category: "build", priority: "medium", title: "Plan Month 4: first YouTube video, VA research, price increase to $500/month coaching" },
  { id: "p3w12_4", week: 12, phase: 3, category: "content", priority: "medium", title: "Ongoing: post daily, engage comments within 60 min of posting", note: "The algorithm rewards fast engagement: don't post and disappear" },
]

const CATEGORY_COLORS: Record<Task["category"], string> = {
  setup: "#c9a96e",
  content: "#7bb3c9",
  outreach: "#a9c97e",
  coaching: "#c97eb3",
  launch: "#c9936e",
  analytics: "#9ec9a9",
  build: "#b3a9c9",
}

const CATEGORY_LABELS: Record<Task["category"], string> = {
  setup: "Setup",
  content: "Content",
  outreach: "Outreach",
  coaching: "Coaching",
  launch: "Launch",
  analytics: "Review",
  build: "Build",
}

const MONTH_TARGETS = [5600, 12350, 18820]

const DEFAULT_REVENUE: RevenueMonth = { mrr: 0, courseSales: 0, challengeRevenue: 0, otherRevenue: 0 }
const DEFAULT_METRICS: Metrics = { instagram: 0, tiktok: 0, email: 0, lastUpdated: "" }

const STORAGE_KEY = "lfm_plan_v1"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadState(): PlanState {
  if (typeof window === "undefined") return getDefaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    return JSON.parse(raw) as PlanState
  } catch {
    return getDefaultState()
  }
}

function getDefaultState(): PlanState {
  return {
    startDate: null,
    completedTasks: {},
    revenue: { m1: { ...DEFAULT_REVENUE }, m2: { ...DEFAULT_REVENUE }, m3: { ...DEFAULT_REVENUE } },
    clients: [],
    metrics: { ...DEFAULT_METRICS },
  }
}

function saveState(state: PlanState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* storage full */ }
}

function getDayNumber(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  return Math.max(1, Math.min(90, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1))
}

function getCurrentWeek(startDate: string): number {
  return Math.max(1, Math.min(12, Math.ceil(getDayNumber(startDate) / 7)))
}

function getCurrentPhase(week: number): 1 | 2 | 3 {
  if (week <= 4) return 1
  if (week <= 8) return 2
  return 3
}

function getMonthFromWeek(week: number): number {
  if (week <= 4) return 1
  if (week <= 8) return 2
  return 3
}

function totalRevenue(r: RevenueMonth): number {
  return r.mrr + r.courseSales + r.challengeRevenue + r.otherRevenue
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
} as const

const FONT_SERIF = "var(--font-cormorant), 'Cormorant Garamond', serif"
const FONT_SANS = "var(--font-montserrat), 'Montserrat', sans-serif"

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanPageClient() {
  const [state, setState] = useState<PlanState>(getDefaultState)
  const [tab, setTab] = useState<Tab>("home")
  const [hydrated, setHydrated] = useState(false)

  // filter / add states
  const [taskFilter, setTaskFilter] = useState<"all" | "week" | "pending">("week")
  const [showAddClient, setShowAddClient] = useState(false)
  const [editRevMonth, setEditRevMonth] = useState<1 | 2 | 3 | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  useEffect(() => {
    // Swap the site-wide manifest so "Add to Home Screen" opens /my-plan, not /my-tracker
    const existing = document.querySelector("link[rel='manifest']")
    if (existing) {
      existing.setAttribute("href", "/my-plan-manifest.json")
    }
    const titleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']")
    if (titleMeta) {
      titleMeta.setAttribute("content", "My Plan")
    }

    const loaded = loadState()
    setState(loaded)
    setHydrated(true)
  }, [])

  const save = useCallback((next: PlanState) => {
    setState(next)
    saveState(next)
  }, [])

  if (!hydrated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", background: C.bg }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const currentDay = state.startDate ? getDayNumber(state.startDate) : 1
  const currentWeek = state.startDate ? getCurrentWeek(state.startDate) : 1
  const currentPhase = getCurrentPhase(currentWeek)
  const currentMonth = getMonthFromWeek(currentWeek)
  const progress = state.startDate ? Math.round((currentDay / 90) * 100) : 0

  const activeClients = state.clients.filter(c => c.status === "active").length

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, fontFamily: FONT_SANS, color: C.cream, maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, letterSpacing: "0.04em" }}>
          Lisa <span style={{ color: C.gold }}>Fit Method</span>
        </span>
        {!state.startDate && (
          <button
            onClick={() => {
              const next = { ...state, startDate: new Date().toISOString().split("T")[0] }
              save(next)
            }}
            style={{ background: C.gold, color: C.bg, border: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "8px 14px", cursor: "pointer", fontFamily: FONT_SANS }}
          >
            Start Plan →
          </button>
        )}
        {state.startDate && (
          <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em" }}>
            Day {currentDay} of 90
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "home" && (
          <HomeTab
            state={state}
            save={save}
            currentWeek={currentWeek}
            currentPhase={currentPhase}
            currentMonth={currentMonth}
            progress={progress}
            activeClients={activeClients}
            showMetrics={showMetrics}
            setShowMetrics={setShowMetrics}
          />
        )}
        {tab === "tasks" && (
          <TasksTab
            state={state}
            save={save}
            currentWeek={currentWeek}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            expandedTask={expandedTask}
            setExpandedTask={setExpandedTask}
          />
        )}
        {tab === "revenue" && (
          <RevenueTab
            state={state}
            save={save}
            editRevMonth={editRevMonth}
            setEditRevMonth={setEditRevMonth}
          />
        )}
        {tab === "clients" && (
          <ClientsTab
            state={state}
            save={save}
            showAddClient={showAddClient}
            setShowAddClient={setShowAddClient}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        {(["home", "tasks", "revenue", "clients"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { home: "Home", tasks: "Tasks", revenue: "Revenue", clients: "Clients" }
          const icons: Record<Tab, string> = { home: "◈", tasks: "☑", revenue: "$", clients: "⊕" }
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "12px 0 10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: active ? C.gold : C.muted,
                transition: "color 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{icons[t]}</span>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT_SANS }}>{labels[t]}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({
  state, save, currentWeek, currentPhase, currentMonth, progress, activeClients, showMetrics, setShowMetrics,
}: {
  state: PlanState; save: (s: PlanState) => void
  currentWeek: number; currentPhase: 1 | 2 | 3; currentMonth: number
  progress: number; activeClients: number; showMetrics: boolean; setShowMetrics: (v: boolean) => void
}) {
  const weekTasks = TASKS.filter(t => t.week === currentWeek)
  const completedThisWeek = weekTasks.filter(t => state.completedTasks[t.id]).length
  const thisWeekHigh = weekTasks.filter(t => t.priority === "high" && !state.completedTasks[t.id]).slice(0, 3)

  const revKey = `m${currentMonth}` as "m1" | "m2" | "m3"
  const currentRevenue = totalRevenue(state.revenue[revKey])
  const target = MONTH_TARGETS[currentMonth - 1]
  const revProgress = Math.min(100, Math.round((currentRevenue / target) * 100))

  function toggleTask(id: string) {
    const next = { ...state, completedTasks: { ...state.completedTasks, [id]: !state.completedTasks[id] } }
    save(next)
  }

  function saveMetrics(ig: number, tt: number, em: number) {
    const next = { ...state, metrics: { instagram: ig, tiktok: tt, email: em, lastUpdated: new Date().toLocaleDateString() } }
    save(next)
    setShowMetrics(false)
  }

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Phase banner */}
      <div style={{ padding: "14px 20px", background: `${C.gold}11`, borderBottom: `1px solid ${C.gold}33` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>
          Phase {currentPhase} · Week {currentWeek} · Month {currentMonth}
        </div>
        <div style={{ fontSize: 12, color: C.mutedLight, letterSpacing: "0.04em" }}>
          {currentPhase === 1 ? "Foundation: Set up your offer stack + first coaching clients" :
           currentPhase === 2 ? "Launch: Run the challenge + grow coaching to 10 clients" :
           "Scale: Level 2 launch + hit $15K/month"}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>90-DAY PROGRESS</span>
          <span style={{ fontSize: 10, color: C.gold, letterSpacing: "0.06em" }}>{progress}%</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Today's priorities */}
      {thisWeekHigh.length > 0 && (
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
            Priority This Week
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {thisWeekHigh.map(task => (
              <TaskRow key={task.id} task={task} done={!!state.completedTasks[task.id]} onToggle={() => toggleTask(task.id)} compact />
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
            {completedThisWeek}/{weekTasks.length} tasks done this week
          </div>
        </div>
      )}

      {/* Revenue snapshot */}
      <div style={{ margin: "20px 20px 0", background: C.card, border: `1px solid ${C.border}`, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>Month {currentMonth} Revenue</span>
          <span style={{ fontSize: 10, color: C.gold }}>${currentRevenue.toLocaleString()} / ${target.toLocaleString()}</span>
        </div>
        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${revProgress}%`, background: revProgress >= 80 ? C.green : C.gold, borderRadius: 3, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Stat label="Coaching MRR" value={`$${state.revenue[revKey].mrr.toLocaleString()}`} />
          <Stat label="Course Sales" value={`$${state.revenue[revKey].courseSales.toLocaleString()}`} />
          <Stat label="Challenge" value={`$${state.revenue[revKey].challengeRevenue.toLocaleString()}`} />
          <Stat label="Active Clients" value={`${activeClients}/15`} highlight={activeClients >= 10} />
        </div>
      </div>

      {/* Metrics */}
      <div style={{ margin: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>Followers & List</span>
          <button onClick={() => setShowMetrics(true)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.gold, fontSize: 9, letterSpacing: "0.12em", padding: "5px 10px", cursor: "pointer", fontFamily: FONT_SANS, textTransform: "uppercase" }}>
            Update
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Stat label="Instagram" value={state.metrics.instagram > 0 ? state.metrics.instagram.toLocaleString() : "—"} />
          <Stat label="TikTok" value={state.metrics.tiktok > 0 ? state.metrics.tiktok.toLocaleString() : "—"} />
          <Stat label="Email List" value={state.metrics.email > 0 ? state.metrics.email.toLocaleString() : "—"} />
        </div>
        {state.metrics.lastUpdated && <div style={{ marginTop: 6, fontSize: 10, color: C.muted }}>Updated {state.metrics.lastUpdated}</div>}
      </div>

      {showMetrics && <MetricsModal state={state} onSave={saveMetrics} onClose={() => setShowMetrics(false)} />}
    </div>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({
  state, save, currentWeek, taskFilter, setTaskFilter, expandedTask, setExpandedTask,
}: {
  state: PlanState; save: (s: PlanState) => void
  currentWeek: number; taskFilter: "all" | "week" | "pending"
  setTaskFilter: (v: "all" | "week" | "pending") => void
  expandedTask: string | null; setExpandedTask: (id: string | null) => void
}) {
  function toggleTask(id: string) {
    const next = { ...state, completedTasks: { ...state.completedTasks, [id]: !state.completedTasks[id] } }
    save(next)
  }

  const visibleTasks = TASKS.filter(t => {
    if (taskFilter === "week") return t.week === currentWeek
    if (taskFilter === "pending") return !state.completedTasks[t.id]
    return true
  })

  const grouped: Record<number, Task[]> = {}
  visibleTasks.forEach(t => {
    if (!grouped[t.week]) grouped[t.week] = []
    grouped[t.week].push(t)
  })

  const totalDone = Object.values(state.completedTasks).filter(Boolean).length

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Filter bar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        {(["week", "pending", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setTaskFilter(f)}
            style={{
              background: taskFilter === f ? C.gold : "none",
              border: `1px solid ${taskFilter === f ? C.gold : C.border}`,
              color: taskFilter === f ? C.bg : C.muted,
              fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "6px 12px", cursor: "pointer", fontFamily: FONT_SANS,
            }}
          >
            {f === "week" ? `Week ${currentWeek}` : f}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted, alignSelf: "center" }}>
          {totalDone}/{TASKS.length} done
        </span>
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, tasks]) => {
          const w = Number(week)
          const phase = getCurrentPhase(Math.ceil(w / 4) * 4 <= 4 ? w : w <= 8 ? w : w)
          const doneInWeek = tasks.filter(t => state.completedTasks[t.id]).length
          return (
            <div key={week} style={{ marginBottom: 4 }}>
              <div style={{ padding: "10px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold }}>
                  Week {week} · Phase {phase}
                </span>
                <span style={{ fontSize: 10, color: doneInWeek === tasks.length ? C.green : C.muted }}>
                  {doneInWeek}/{tasks.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {tasks.map(task => (
                  <div key={task.id}>
                    <TaskRow
                      task={task}
                      done={!!state.completedTasks[task.id]}
                      onToggle={() => toggleTask(task.id)}
                      expanded={expandedTask === task.id}
                      onExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

      {visibleTasks.length === 0 && (
        <div style={{ padding: "48px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
          {taskFilter === "pending" ? "All caught up ✓" : "No tasks for this view"}
        </div>
      )}
    </div>
  )
}

// ─── Revenue Tab ──────────────────────────────────────────────────────────────

function RevenueTab({
  state, save, editRevMonth, setEditRevMonth,
}: {
  state: PlanState; save: (s: PlanState) => void
  editRevMonth: 1 | 2 | 3 | null; setEditRevMonth: (v: 1 | 2 | 3 | null) => void
}) {
  const months: Array<{ key: "m1" | "m2" | "m3"; num: 1 | 2 | 3; target: number; label: string }> = [
    { key: "m1", num: 1, target: 5600, label: "Month 1: Foundation" },
    { key: "m2", num: 2, target: 12350, label: "Month 2: Launch" },
    { key: "m3", num: 3, target: 18820, label: "Month 3: Scale" },
  ]

  function saveRevMonth(month: "m1" | "m2" | "m3", data: RevenueMonth) {
    save({ ...state, revenue: { ...state.revenue, [month]: data } })
    setEditRevMonth(null)
  }

  const totalAll = totalRevenue(state.revenue.m1) + totalRevenue(state.revenue.m2) + totalRevenue(state.revenue.m3)

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>Total 90-Day Revenue</div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 36, fontWeight: 400, color: C.gold }}>${totalAll.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: C.muted }}>target: $36,770 over 90 days</div>
      </div>

      {months.map(({ key, num, target, label }) => {
        const rev = state.revenue[key]
        const total = totalRevenue(rev)
        const pct = Math.min(100, Math.round((total / target) * 100))
        return (
          <div key={key} style={{ margin: "16px 20px 0", background: C.card, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.cream, letterSpacing: "0.04em" }}>{label}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Target: ${target.toLocaleString()}</div>
              </div>
              <button
                onClick={() => setEditRevMonth(num)}
                style={{ background: "none", border: `1px solid ${C.border}`, color: C.gold, fontSize: 9, letterSpacing: "0.1em", padding: "6px 10px", cursor: "pointer", fontFamily: FONT_SANS, textTransform: "uppercase" }}
              >
                Edit
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 400, color: pct >= 100 ? C.green : C.gold }}>${total.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: pct >= 100 ? C.green : C.muted, alignSelf: "flex-end" }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? C.green : C.gold, borderRadius: 2 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Stat label="Coaching MRR" value={`$${rev.mrr.toLocaleString()}`} />
              <Stat label="Course Sales" value={`$${rev.courseSales.toLocaleString()}`} />
              <Stat label="Challenge" value={`$${rev.challengeRevenue.toLocaleString()}`} />
              <Stat label="Other" value={`$${rev.otherRevenue.toLocaleString()}`} />
            </div>
          </div>
        )
      })}

      {editRevMonth !== null && (
        <RevenueModal
          month={editRevMonth}
          current={state.revenue[`m${editRevMonth}` as "m1" | "m2" | "m3"]}
          onSave={(data) => saveRevMonth(`m${editRevMonth}` as "m1" | "m2" | "m3", data)}
          onClose={() => setEditRevMonth(null)}
        />
      )}

      {/* Pricing reference */}
      <div style={{ margin: "20px 20px 0", background: C.card, border: `1px solid ${C.border}`, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Price List</div>
        {[
          ["Training Foundations", "$97", "one-time"],
          ["Starter Bundle (TF + Nutrition PDF)", "$147", "one-time"],
          ["Complete System (TF + Level 2)", "$197", "one-time · Month 3"],
          ["Level 2: Training Progression", "$97", "one-time · Month 3"],
          ["4-Week Foundation Reset Challenge", "$97", "per cohort"],
          ["1:1 Coaching (Smart Training Method)", "$400/mo", "3-month min · max 15"],
        ].map(([name, price, note]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 11, color: C.cream }}>{name}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{note}</div>
            </div>
            <span style={{ fontSize: 13, color: C.gold, fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>{price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────

function ClientsTab({
  state, save, showAddClient, setShowAddClient,
}: {
  state: PlanState; save: (s: PlanState) => void
  showAddClient: boolean; setShowAddClient: (v: boolean) => void
}) {
  const active = state.clients.filter(c => c.status === "active")
  const other = state.clients.filter(c => c.status !== "active")
  const totalMRR = active.reduce((sum, c) => sum + c.monthlyFee, 0)

  function addClient(client: Omit<Client, "id">) {
    const next = { ...state, clients: [...state.clients, { ...client, id: uid() }] }
    save(next)
    setShowAddClient(false)
  }

  function updateStatus(id: string, status: Client["status"]) {
    save({ ...state, clients: state.clients.map(c => c.id === id ? { ...c, status } : c) })
  }

  function removeClient(id: string) {
    if (!confirm("Remove this client?")) return
    save({ ...state, clients: state.clients.filter(c => c.id !== id) })
  }

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Header stats */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: C.gold }}>{active.length}<span style={{ fontSize: 16, color: C.muted }}>/15</span></div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>active clients · ${totalMRR.toLocaleString()}/mo MRR</div>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          style={{ background: C.gold, border: "none", color: C.bg, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 16px", cursor: "pointer", fontFamily: FONT_SANS }}
        >
          + Add Client
        </button>
      </div>

      {/* Capacity bar */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (active.length / 15) * 100)}%`, background: active.length >= 13 ? C.green : C.gold, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{15 - active.length} spots remaining</div>
      </div>

      {/* Active clients */}
      {active.length > 0 && (
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: 10 }}>Active</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {active.map(client => (
              <ClientRow key={client.id} client={client} onUpdateStatus={updateStatus} onRemove={removeClient} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div style={{ margin: "16px 20px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Paused / Completed</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {other.map(client => (
              <ClientRow key={client.id} client={client} onUpdateStatus={updateStatus} onRemove={removeClient} />
            ))}
          </div>
        </div>
      )}

      {state.clients.length === 0 && (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>No coaching clients yet.</div>
          <div style={{ fontSize: 11, color: C.muted }}>Your first 5 clients come from direct DMs: people who have already engaged with your content.</div>
        </div>
      )}

      {/* Coaching offer reminder */}
      <div style={{ margin: "20px 20px 0", background: C.card, border: `1px solid ${C.border}`, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Your Offer</div>
        {[
          "2x 45-min video calls/month (form review + programming)",
          "Custom monthly training program",
          "Weekly async progress check-in (24-48hr response)",
          "Messaging access Mon–Fri",
          "Training Foundations course included",
        ].map(f => (
          <div key={f} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
            <span style={{ color: C.gold, fontSize: 10, marginTop: 2 }}>✓</span>
            <span style={{ fontSize: 11, color: C.mutedLight, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted }}>$400/month · 3-month minimum</span>
          <span style={{ fontSize: 11, color: C.gold }}>Max 15 clients</span>
        </div>
      </div>

      {showAddClient && <AddClientModal onAdd={addClient} onClose={() => setShowAddClient(false)} />}
    </div>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function TaskRow({ task, done, onToggle, compact, expanded, onExpand }: {
  task: Task; done: boolean; onToggle: () => void; compact?: boolean; expanded?: boolean; onExpand?: () => void
}) {
  const catColor = CATEGORY_COLORS[task.category]
  return (
    <div
      style={{ padding: compact ? "10px 20px" : "10px 20px", borderBottom: `1px solid ${C.border}`, opacity: done ? 0.5 : 1 }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <button
          onClick={onToggle}
          style={{
            flexShrink: 0, width: 20, height: 20, marginTop: 1,
            border: `1.5px solid ${done ? catColor : C.border}`,
            background: done ? catColor : "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 2,
          }}
        >
          {done && <span style={{ color: C.bg, fontSize: 11, lineHeight: 1 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: catColor, flexShrink: 0 }}>
              {CATEGORY_LABELS[task.category]}
            </span>
            {task.priority === "high" && <span style={{ fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase", color: C.gold }}>★</span>}
          </div>
          <div
            style={{ fontSize: 12, color: done ? C.muted : C.cream, lineHeight: 1.4, textDecoration: done ? "line-through" : "none", cursor: task.note ? "pointer" : "default" }}
            onClick={task.note ? onExpand : undefined}
          >
            {task.title}
          </div>
          {expanded && task.note && (
            <div style={{ marginTop: 6, fontSize: 11, color: C.muted, lineHeight: 1.6, padding: "8px 12px", background: `${C.border}`, borderLeft: `2px solid ${catColor}` }}>
              {task.note}
            </div>
          )}
          {task.note && !expanded && (
            <button onClick={onExpand} style={{ background: "none", border: "none", color: C.muted, fontSize: 10, cursor: "pointer", padding: "3px 0 0", fontFamily: FONT_SANS }}>
              {compact ? "" : "note ↓"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ClientRow({ client, onUpdateStatus, onRemove }: {
  client: Client; onUpdateStatus: (id: string, status: Client["status"]) => void; onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, marginBottom: 1 }}>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ fontSize: 13, color: C.cream, fontWeight: 500 }}>{client.name}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            ${client.monthlyFee}/mo · started {client.startDate}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: client.status === "active" ? C.green : C.muted,
            padding: "3px 8px", border: `1px solid ${client.status === "active" ? C.green : C.border}`,
          }}>{client.status}</span>
          <span style={{ color: C.muted, fontSize: 12 }}>{open ? "↑" : "↓"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 16px 12px", borderTop: `1px solid ${C.border}` }}>
          {client.nextCall && <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 10 }}>Next call: <span style={{ color: C.gold }}>{client.nextCall}</span></div>}
          {client.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{client.notes}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {client.status === "active" && (
              <button onClick={() => onUpdateStatus(client.id, "paused")} style={smallBtn}>Pause</button>
            )}
            {client.status !== "active" && (
              <button onClick={() => onUpdateStatus(client.id, "active")} style={{ ...smallBtn, borderColor: C.green, color: C.green }}>Reactivate</button>
            )}
            {client.status !== "completed" && (
              <button onClick={() => onUpdateStatus(client.id, "completed")} style={smallBtn}>Complete</button>
            )}
            <button onClick={() => onRemove(client.id)} style={{ ...smallBtn, borderColor: C.error, color: C.error }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: `${C.border}66`, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: highlight ? C.green : C.cream, fontFamily: FONT_SANS }}>{value}</div>
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function MetricsModal({ state, onSave, onClose }: {
  state: PlanState; onSave: (ig: number, tt: number, em: number) => void; onClose: () => void
}) {
  const [ig, setIg] = useState(state.metrics.instagram.toString())
  const [tt, setTt] = useState(state.metrics.tiktok.toString())
  const [em, setEm] = useState(state.metrics.email.toString())
  return (
    <Modal title="Update Metrics" onClose={onClose}>
      <NumberField label="Instagram followers" value={ig} onChange={setIg} />
      <NumberField label="TikTok followers" value={tt} onChange={setTt} />
      <NumberField label="Email subscribers" value={em} onChange={setEm} />
      <SaveButton onClick={() => onSave(Number(ig) || 0, Number(tt) || 0, Number(em) || 0)} />
    </Modal>
  )
}

function RevenueModal({ month, current, onSave, onClose }: {
  month: number; current: RevenueMonth; onSave: (data: RevenueMonth) => void; onClose: () => void
}) {
  const [mrr, setMrr] = useState(current.mrr.toString())
  const [course, setCourse] = useState(current.courseSales.toString())
  const [challenge, setChallenge] = useState(current.challengeRevenue.toString())
  const [other, setOther] = useState(current.otherRevenue.toString())
  return (
    <Modal title={`Month ${month} Revenue`} onClose={onClose}>
      <NumberField label="Coaching MRR ($)" value={mrr} onChange={setMrr} placeholder="e.g. 2000" />
      <NumberField label="Course sales ($)" value={course} onChange={setCourse} placeholder="e.g. 2425" />
      <NumberField label="Challenge revenue ($)" value={challenge} onChange={setChallenge} placeholder="e.g. 4850" />
      <NumberField label="Other revenue ($)" value={other} onChange={setOther} placeholder="e.g. 0" />
      <SaveButton onClick={() => onSave({ mrr: Number(mrr) || 0, courseSales: Number(course) || 0, challengeRevenue: Number(challenge) || 0, otherRevenue: Number(other) || 0 })} />
    </Modal>
  )
}

function AddClientModal({ onAdd, onClose }: { onAdd: (c: Omit<Client, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [nextCall, setNextCall] = useState("")
  const [fee, setFee] = useState("400")
  const [notes, setNotes] = useState("")
  return (
    <Modal title="Add Coaching Client" onClose={onClose}>
      <TextField label="Client name" value={name} onChange={setName} placeholder="e.g. Sarah M." />
      <TextField label="Start date" value={startDate} onChange={setStartDate} type="date" />
      <TextField label="Next call date" value={nextCall} onChange={setNextCall} type="date" />
      <NumberField label="Monthly fee ($)" value={fee} onChange={setFee} placeholder="400" />
      <TextField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Goals, equipment, schedule..." />
      <SaveButton label="Add Client" onClick={() => {
        if (!name.trim()) return
        onAdd({ name: name.trim(), startDate, nextCall, monthlyFee: Number(fee) || 400, notes, status: "active" })
      }} />
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, width: "100%", maxWidth: 480, maxHeight: "85dvh", overflowY: "auto", padding: "24px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: 20, color: C.cream }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.cream, fontSize: 13, padding: "10px 12px", fontFamily: FONT_SANS, boxSizing: "border-box", outline: "none" }}
      />
    </div>
  )
}

function NumberField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>{label}</label>
      <input
        type="number" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.cream, fontSize: 13, padding: "10px 12px", fontFamily: FONT_SANS, boxSizing: "border-box", outline: "none" }}
      />
    </div>
  )
}

function SaveButton({ label = "Save", onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", background: C.gold, border: "none", color: C.bg, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "14px", cursor: "pointer", fontFamily: FONT_SANS, marginTop: 6 }}
    >
      {label}
    </button>
  )
}

const smallBtn: React.CSSProperties = {
  background: "none", border: `1px solid ${C.border}`, color: C.muted,
  fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
  padding: "5px 10px", cursor: "pointer", fontFamily: FONT_SANS,
}
