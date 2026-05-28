"use client"
import { useEffect, useState, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "tiktok" | "instagram" | "reddit"
type Tab = "home" | "film" | "post" | "stats" | "sales" | "clients" | "tasks" | "ads"
type CoachingTier = "founding" | "foundation" | "premium" | "elite"
type PostStatus = "scheduled" | "posted" | "skipped"
type PostRating = "fire" | "check" | "neutral" | "miss"

interface Task {
  id: string
  week: number
  phase: 1 | 2 | 3
  category: "setup" | "content" | "outreach" | "coaching" | "launch" | "analytics" | "build"
  text: string
}

interface RevenueMonth {
  coaching: number
  courses: number
  memberships: number
  affiliates: number
}

interface Client {
  id: string
  name: string
  startDate: string
  nextCall: string
  tier: CoachingTier
  monthlyFee: number
  paymentType: "monthly" | "3month-prepay" | "6month-prepay"
  status: "active" | "paused" | "completed"
  notes: string
  testimonialReceived: boolean
  testimonialDue30?: string
  testimonialDue60?: string
  testimonialDue90?: string
}

interface Metrics {
  tiktokFollowers: number
  tiktokViews: number
  igFollowers: number
  igReach: number
  emailSubscribers: number
  websiteVisits: number
}

interface PostOverride {
  episodeId?: string
  platform?: Platform
  notes?: string
}

interface PostPerformance {
  postId: string
  postedDate: string
  platform: Platform
  views: number
  likes: number
  comments: number
  rating: PostRating
  notes: string
}

interface SaleEntry {
  id: string
  date: string
  product: string
  amount: number
  month: 1 | 2 | 3
  notes: string
}

interface AdCampaign {
  id: string
  platform: Platform
  startDate: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  notes: string
}

interface PlanState {
  version: 2
  startDate: string | null
  completedTasks: Record<string, boolean>
  revenue: { m1: RevenueMonth; m2: RevenueMonth; m3: RevenueMonth }
  clients: Client[]
  metrics: Metrics
  filmedBatches: Record<number, boolean>
  postOverrides: Record<string, PostOverride>
  postStatuses: Record<string, PostStatus>
  performance: PostPerformance[]
  sales: SaleEntry[]
  adCampaigns: AdCampaign[]
}

interface PlanStateV1 {
  startDate: string | null
  completedTasks: Record<string, boolean>
  revenue: { m1: RevenueMonth; m2: RevenueMonth; m3: RevenueMonth }
  clients: Array<{
    id: string
    name: string
    startDate: string
    nextCall: string
    monthlyFee: number
    status: "active" | "paused" | "completed"
    notes: string
  }>
  metrics: Metrics
}

// ─── Design tokens ────────────────────────────────────────────────────────────

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

const F = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'Montserrat', 'DM Sans', sans-serif",
} as const

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_TARGETS = { m1: 4651, m2: 10740, m3: 14770 }
const MAX_CLIENTS = 6
const CLIENT_TIERS: Record<CoachingTier, number> = {
  founding: 350,
  foundation: 500,
  premium: 700,
  elite: 1200,
}

const PRODUCTS = [
  { label: "Founding Coaching ($350/mo)", value: "coaching-founding" },
  { label: "Foundation Coaching ($500/mo)", value: "coaching-foundation" },
  { label: "Premium Coaching ($700/mo)", value: "coaching-premium" },
  { label: "Elite Coaching ($1,200/mo)", value: "coaching-elite" },
  { label: "Training Foundations ($97)", value: "course-training" },
  { label: "Nutrition Foundations ($97)", value: "course-nutrition" },
  { label: "Method Bundle ($147)", value: "course-bundle" },
  { label: "Monthly Membership ($29)", value: "membership" },
  { label: "Affiliate Commission", value: "affiliate" },
]

const BIO_LINES = [
  "Certified personal trainer helping women 35+ build lean muscle",
  "3-month coaching program | online",
  "🔗 lisafitmethod.com",
]

const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: "home", icon: "◈", label: "Home" },
  { id: "film", icon: "◉", label: "Film" },
  { id: "post", icon: "▷", label: "Post" },
  { id: "stats", icon: "▲", label: "Stats" },
  { id: "sales", icon: "$", label: "Sales" },
  { id: "clients", icon: "⊕", label: "Clients" },
  { id: "tasks", icon: "☑", label: "Tasks" },
  { id: "ads", icon: "✦", label: "Ads" },
]

const CATEGORY_COLORS: Record<Task["category"], string> = {
  setup: C.blue,
  content: C.gold,
  outreach: C.green,
  coaching: C.cream,
  launch: C.goldLight,
  analytics: C.mutedLight,
  build: C.error,
}

const CATEGORY_LABELS: Record<Task["category"], string> = {
  setup: "Setup",
  content: "Content",
  outreach: "Outreach",
  coaching: "Coaching",
  launch: "Launch",
  analytics: "Analytics",
  build: "Build",
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  // Phase 1 — Week 1
  { id: "p1w1_1", week: 1, phase: 1, category: "setup", text: "Set start date and pin this dashboard" },
  { id: "p1w1_2", week: 1, phase: 1, category: "setup", text: "Update coaching page: add tiered pricing ($350–$1,200) + 6-spot cap" },
  { id: "p1w1_3", week: 1, phase: 1, category: "setup", text: "Write your bio (use BIO_LINES above as template)" },
  { id: "p1w1_4", week: 1, phase: 1, category: "content", text: "Film Batch 1: 10 videos (intro + authority hooks)" },
  { id: "p1w1_5", week: 1, phase: 1, category: "setup", text: "Set up TikTok and Instagram business accounts" },
  // Phase 1 — Week 2
  { id: "p1w2_1", week: 2, phase: 1, category: "content", text: "Film Batch 2: 10 videos (pain-point hooks)" },
  { id: "p1w2_2", week: 2, phase: 1, category: "setup", text: "Create lead magnet (free workout PDF or checklist)" },
  { id: "p1w2_3", week: 2, phase: 1, category: "outreach", text: "DM 20 target accounts on TikTok/IG (genuine comments first)" },
  { id: "p1w2_4", week: 2, phase: 1, category: "analytics", text: "Set up email list (ConvertKit or Beehiiv free tier)" },
  // Phase 1 — Week 3
  { id: "p1w3_1", week: 3, phase: 1, category: "content", text: "Film Batch 3: 10 videos (transformation stories)" },
  { id: "p1w3_2", week: 3, phase: 1, category: "outreach", text: "Post lead magnet promo — collect first 10 emails" },
  { id: "p1w3_3", week: 3, phase: 1, category: "coaching", text: "Finalize coaching intake form and onboarding sequence" },
  { id: "p1w3_4", week: 3, phase: 1, category: "outreach", text: "DM 20 more target accounts" },
  // Phase 1 — Week 4
  { id: "p1w4_1", week: 4, phase: 1, category: "content", text: "Film Batch 4: 10 videos (method explainers)" },
  { id: "p1w4_2", week: 4, phase: 1, category: "launch", text: "Soft launch coaching: 2 founding spots at $350/mo" },
  { id: "p1w4_3", week: 4, phase: 1, category: "outreach", text: "Post 'I have 2 spots open' story + DMs to warm leads" },
  { id: "p1w4_4", week: 4, phase: 1, category: "analytics", text: "Review Month 1 content metrics — note top 3 performers" },
  // Phase 2 — Week 5
  { id: "p2w5_1", week: 5, phase: 2, category: "content", text: "Film Batch 5: 10 videos (objection busters)" },
  { id: "p2w5_2", week: 5, phase: 2, category: "coaching", text: "Onboard founding clients — first check-in calls" },
  { id: "p2w5_3", week: 5, phase: 2, category: "outreach", text: "DM 30 target accounts (scale outreach)" },
  { id: "p2w5_4", week: 5, phase: 2, category: "build", text: "Launch Training Foundations course ($97)" },
  // Phase 2 — Week 6
  { id: "p2w6_1", week: 6, phase: 2, category: "content", text: "Film Batch 6: 10 videos (client results / social proof)" },
  { id: "p2w6_2", week: 6, phase: 2, category: "launch", text: "Open 2 more coaching spots (foundation tier $500/mo)" },
  { id: "p2w6_3", week: 6, phase: 2, category: "outreach", text: "Email list nurture sequence — 3 emails this week" },
  { id: "p2w6_4", week: 6, phase: 2, category: "analytics", text: "Check TikTok analytics: identify best posting times" },
  // Phase 2 — Week 7
  { id: "p2w7_1", week: 7, phase: 2, category: "content", text: "Film Batch 7: 10 videos (myth-busting series)" },
  { id: "p2w7_2", week: 7, phase: 2, category: "coaching", text: "30-day check-ins with founding clients" },
  { id: "p2w7_3", week: 7, phase: 2, category: "build", text: "Launch Nutrition Foundations course ($97)" },
  { id: "p2w7_4", week: 7, phase: 2, category: "outreach", text: "Collab outreach: pitch 5 complementary creators" },
  // Phase 2 — Week 8
  { id: "p2w8_1", week: 8, phase: 2, category: "content", text: "Film Batch 8: 10 videos (day-in-the-life / behind scenes)" },
  { id: "p2w8_2", week: 8, phase: 2, category: "launch", text: "Bundle offer: Training + Nutrition for $147" },
  { id: "p2w8_3", week: 8, phase: 2, category: "analytics", text: "Review Month 2 metrics — adjust content mix" },
  { id: "p2w8_4", week: 8, phase: 2, category: "outreach", text: "Request first testimonials from founding clients" },
  // Phase 3 — Week 9
  { id: "p3w9_1", week: 9, phase: 3, category: "content", text: "Film Batch 9: 10 videos (premium positioning)" },
  { id: "p3w9_2", week: 9, phase: 3, category: "launch", text: "Open premium spot ($700/mo) — one client max" },
  { id: "p3w9_3", week: 9, phase: 3, category: "outreach", text: "Post testimonial content from early clients" },
  { id: "p3w9_4", week: 9, phase: 3, category: "build", text: "Set up membership ($29/mo) for past clients" },
  // Phase 3 — Week 10
  { id: "p3w10_1", week: 10, phase: 3, category: "content", text: "Film Batch 10: 10 videos (income / lifestyle / authority)" },
  { id: "p3w10_2", week: 10, phase: 3, category: "coaching", text: "60-day check-ins with original clients" },
  { id: "p3w10_3", week: 10, phase: 3, category: "outreach", text: "DM 40 accounts — target higher-engagement profiles" },
  { id: "p3w10_4", week: 10, phase: 3, category: "analytics", text: "Audit email list: segment buyers vs non-buyers" },
  // Phase 3 — Week 11
  { id: "p3w11_1", week: 11, phase: 3, category: "content", text: "Film Batch 11: 10 videos (3-month results / celebration)" },
  { id: "p3w11_2", week: 11, phase: 3, category: "launch", text: "Introduce elite tier ($1,200/mo) — 1 spot" },
  { id: "p3w11_3", week: 11, phase: 3, category: "build", text: "Plan Month 4+ ad campaign (budget $500/mo)" },
  { id: "p3w11_4", week: 11, phase: 3, category: "outreach", text: "Affiliate setup: apply to 2 relevant programs" },
  // Phase 3 — Week 12
  { id: "p3w12_1", week: 12, phase: 3, category: "analytics", text: "Full 90-day audit: revenue, content, conversion rates" },
  { id: "p3w12_2", week: 12, phase: 3, category: "coaching", text: "Hit 4–6 coaching clients active (capacity reached)" },
  { id: "p3w12_3", week: 12, phase: 3, category: "content", text: "Film Batch 12: 10 videos (Month 4 pipeline)" },
  { id: "p3w12_4", week: 12, phase: 3, category: "build", text: "Document systems: SOPs for content, coaching, sales" },
  // Phase 3 — Week 13
  { id: "p3w13_1", week: 13, phase: 3, category: "analytics", text: "Export all 90-day data for quarterly review" },
  { id: "p3w13_2", week: 13, phase: 3, category: "build", text: "Plan Q2 strategy based on 90-day learnings" },
  { id: "p3w13_3", week: 13, phase: 3, category: "coaching", text: "Renew or graduate existing coaching clients" },
  { id: "p3w13_4", week: 13, phase: 3, category: "launch", text: "Announce Month 4 coaching spots publicly" },
]

// ─── Episodes ─────────────────────────────────────────────────────────────────

interface Episode {
  id: string
  title: string
  hook: string
  platform: Platform[]
  category: string
  batch: number
}

const EPISODES: Episode[] = [
  // Batch 1 — Intro + Authority
  { id: "e001", batch: 1, platform: ["tiktok", "instagram"], category: "authority", title: "Who I am and why I coach women 35+", hook: "I'm a certified trainer who only works with women over 35 — here's why" },
  { id: "e002", batch: 1, platform: ["tiktok", "instagram"], category: "authority", title: "My own fitness journey after 35", hook: "At 37 I was the weakest I'd ever been. Here's what changed everything" },
  { id: "e003", batch: 1, platform: ["tiktok"], category: "authority", title: "Why most programs fail women over 35", hook: "The #1 reason fitness programs don't work for women over 35" },
  { id: "e004", batch: 1, platform: ["tiktok", "instagram"], category: "authority", title: "The 3 things I wish I knew at 35", hook: "3 things I wish someone told me about fitness in my 30s" },
  { id: "e005", batch: 1, platform: ["tiktok"], category: "method", title: "What is the Lisa Fit Method", hook: "My method in 60 seconds — lean muscle, less stress, sustainable" },
  { id: "e006", batch: 1, platform: ["instagram"], category: "authority", title: "My certifications and background", hook: "Here's why you should (or shouldn't) trust me as your trainer" },
  { id: "e007", batch: 1, platform: ["tiktok", "instagram"], category: "method", title: "The difference between my method and HIIT", hook: "Stop doing HIIT if you're over 35 — here's what to do instead" },
  { id: "e008", batch: 1, platform: ["tiktok"], category: "authority", title: "A day in my life as an online trainer", hook: "What my day actually looks like as an online fitness coach" },
  { id: "e009", batch: 1, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client result: Sarah lost 12 lbs in 8 weeks", hook: "My client Sarah is 42 and lost 12 pounds in 8 weeks — this is how" },
  { id: "e010", batch: 1, platform: ["tiktok"], category: "method", title: "The 3-phase training system explained", hook: "My 3-phase system is why my clients see results in 30 days" },
  // Batch 2 — Pain-point hooks
  { id: "e011", batch: 2, platform: ["tiktok", "instagram"], category: "pain", title: "You're not lazy — your program is wrong", hook: "If you're not seeing results it's not because you're lazy" },
  { id: "e012", batch: 2, platform: ["tiktok"], category: "pain", title: "Why you're always tired after workouts", hook: "If your workouts leave you exhausted, you're training wrong for your age" },
  { id: "e013", batch: 2, platform: ["tiktok", "instagram"], category: "pain", title: "The scale isn't moving — here's why", hook: "The scale hasn't moved in 3 weeks and it's not your fault" },
  { id: "e014", batch: 2, platform: ["tiktok"], category: "pain", title: "Hormones and weight gain after 35", hook: "Your hormones are working against you — here's how to fight back" },
  { id: "e015", batch: 2, platform: ["tiktok", "instagram"], category: "pain", title: "You're doing too much cardio", hook: "More cardio is making you softer, not leaner — especially over 35" },
  { id: "e016", batch: 2, platform: ["tiktok"], category: "pain", title: "Why you're not sleeping well", hook: "Bad sleep is destroying your fitness results and it starts with your training" },
  { id: "e017", batch: 2, platform: ["instagram"], category: "pain", title: "The comparison trap on social media", hook: "Stop comparing your body to 25-year-old fitness influencers" },
  { id: "e018", batch: 2, platform: ["tiktok", "instagram"], category: "pain", title: "Injuries that keep coming back", hook: "If you keep re-injuring the same spot, this is why" },
  { id: "e019", batch: 2, platform: ["tiktok"], category: "pain", title: "You're under-eating protein", hook: "You're probably eating half the protein you actually need" },
  { id: "e020", batch: 2, platform: ["tiktok", "instagram"], category: "pain", title: "Why dieting makes it worse", hook: "Every diet you've tried has made it harder to lose weight — here's the science" },
  // Batch 3 — Transformation stories
  { id: "e021", batch: 3, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client: Jennifer, 44, gained strength not bulk", hook: "Jennifer was terrified of weights at 44 — 3 months later she's a different person" },
  { id: "e022", batch: 3, platform: ["tiktok"], category: "social-proof", title: "Client: Michelle, 38, first pull-up at 38", hook: "Michelle did her first pull-up at 38 and cried on the call" },
  { id: "e023", batch: 3, platform: ["tiktok", "instagram"], category: "social-proof", title: "Before and after — not what you think", hook: "Her 'before and after' isn't about weight — it's about confidence" },
  { id: "e024", batch: 3, platform: ["tiktok"], category: "social-proof", title: "Client: Karen, stopped yo-yo dieting", hook: "Karen has lost and regained 30 pounds 4 times — until now" },
  { id: "e025", batch: 3, platform: ["instagram"], category: "social-proof", title: "What my clients say after 30 days", hook: "What my clients say after their first 30 days — in their own words" },
  { id: "e026", batch: 3, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client: Maria, 50, strongest she's ever been", hook: "Maria is 50 and she's the strongest she's ever been in her life" },
  { id: "e027", batch: 3, platform: ["tiktok"], category: "social-proof", title: "The fastest transformation I've seen", hook: "This is the fastest result I've seen in 10 years of coaching" },
  { id: "e028", batch: 3, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client: Dawn, trained through menopause", hook: "Dawn started with me during menopause and here's what happened" },
  { id: "e029", batch: 3, platform: ["tiktok"], category: "social-proof", title: "What changes first — always", hook: "The first thing that changes in my program is always the same thing" },
  { id: "e030", batch: 3, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client who almost quit after week 2", hook: "She almost quit after 2 weeks. I'm so glad she didn't." },
  // Batch 4 — Method explainers
  { id: "e031", batch: 4, platform: ["tiktok", "instagram"], category: "method", title: "Progressive overload explained simply", hook: "Progressive overload is the only thing that actually works — here's how to use it" },
  { id: "e032", batch: 4, platform: ["tiktok"], category: "method", title: "Why compound lifts beat isolation", hook: "Stop doing bicep curls. Do this instead." },
  { id: "e033", batch: 4, platform: ["tiktok", "instagram"], category: "method", title: "How many days per week to train", hook: "How many days a week should you work out? The answer might surprise you" },
  { id: "e034", batch: 4, platform: ["tiktok"], category: "method", title: "Protein timing — does it matter?", hook: "Everyone argues about protein timing. Here's what the science actually says" },
  { id: "e035", batch: 4, platform: ["instagram"], category: "method", title: "Rest days are part of the program", hook: "Your rest days are just as important as your training days — here's why" },
  { id: "e036", batch: 4, platform: ["tiktok", "instagram"], category: "method", title: "What a perfect training week looks like", hook: "This is exactly what my clients' training week looks like" },
  { id: "e037", batch: 4, platform: ["tiktok"], category: "method", title: "How to structure a workout", hook: "A perfectly structured 45-minute workout for women over 35" },
  { id: "e038", batch: 4, platform: ["tiktok", "instagram"], category: "method", title: "Warm-up vs. activation — the difference", hook: "Most people warm up wrong. This is what you should actually be doing." },
  { id: "e039", batch: 4, platform: ["tiktok"], category: "method", title: "The 80/20 rule for nutrition", hook: "You don't need a perfect diet. You need this." },
  { id: "e040", batch: 4, platform: ["tiktok", "instagram"], category: "method", title: "Why I don't count calories with clients", hook: "I never make my clients count calories — and they still lose body fat" },
  // Batch 5 — Objection busters
  { id: "e041", batch: 5, platform: ["tiktok", "instagram"], category: "objection", title: "I don't have time to work out", hook: "You don't have time to work out? Let me show you what 30 minutes can do" },
  { id: "e042", batch: 5, platform: ["tiktok"], category: "objection", title: "I've tried everything and nothing works", hook: "If you've tried everything and nothing worked, you haven't tried this" },
  { id: "e043", batch: 5, platform: ["tiktok", "instagram"], category: "objection", title: "I can't afford a personal trainer", hook: "Can't afford a trainer? Here's how to get coached for less than a gym membership" },
  { id: "e044", batch: 5, platform: ["tiktok"], category: "objection", title: "I'm too out of shape to start", hook: "You think you're too out of shape to hire a trainer — that's backwards" },
  { id: "e045", batch: 5, platform: ["instagram"], category: "objection", title: "Online coaching isn't real coaching", hook: "Online coaching is fake? My clients would strongly disagree" },
  { id: "e046", batch: 5, platform: ["tiktok", "instagram"], category: "objection", title: "I'll start after the holidays", hook: "I'll start after the holidays. I've heard this 100 times. Here's what happens." },
  { id: "e047", batch: 5, platform: ["tiktok"], category: "objection", title: "I don't want to get bulky", hook: "You're afraid of getting bulky. Here's the truth about women and muscle." },
  { id: "e048", batch: 5, platform: ["tiktok", "instagram"], category: "objection", title: "I'll just follow YouTube videos", hook: "YouTube workouts are free. Here's why they're costing you results." },
  { id: "e049", batch: 5, platform: ["tiktok"], category: "objection", title: "I have a bad knee / back / shoulder", hook: "You have a bad knee? That's actually why you need a trainer, not a reason to avoid one" },
  { id: "e050", batch: 5, platform: ["tiktok", "instagram"], category: "objection", title: "I need to lose weight before I start lifting", hook: "Lose weight before you start lifting? That's not how this works." },
  // Batch 6 — Social proof / client results
  { id: "e051", batch: 6, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client results at 30 days — numbers", hook: "Here are the actual numbers from my clients at 30 days" },
  { id: "e052", batch: 6, platform: ["tiktok"], category: "social-proof", title: "The question clients ask most at week 4", hook: "At week 4 every single client asks me the same question" },
  { id: "e053", batch: 6, platform: ["tiktok", "instagram"], category: "social-proof", title: "What changes when you get strong", hook: "Getting strong changes things I never expected — my clients say the same" },
  { id: "e054", batch: 6, platform: ["tiktok"], category: "social-proof", title: "Client text message reaction", hook: "My client texted me this at 6am and I screenshot it immediately" },
  { id: "e055", batch: 6, platform: ["instagram"], category: "social-proof", title: "Client: retired at 58, started lifting", hook: "She retired at 58 and decided to get in the best shape of her life" },
  { id: "e056", batch: 6, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client: first time wearing shorts in 10 years", hook: "She hasn't worn shorts in 10 years. Last week she bought 3 pairs." },
  { id: "e057", batch: 6, platform: ["tiktok"], category: "social-proof", title: "The DM that made me cry", hook: "I got a DM last month that made me cry at my desk" },
  { id: "e058", batch: 6, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client who trained through chemo", hook: "She trained with me through chemotherapy and here's what she said" },
  { id: "e059", batch: 6, platform: ["tiktok"], category: "social-proof", title: "Client: 40-lb body recomp", hook: "She didn't lose 40 pounds — she traded 40 pounds of fat for muscle" },
  { id: "e060", batch: 6, platform: ["tiktok", "instagram"], category: "social-proof", title: "What my clients have in common", hook: "All my successful clients have one thing in common — it's not what you think" },
  // Batch 7 — Myth-busting
  { id: "e061", batch: 7, platform: ["tiktok", "instagram"], category: "education", title: "Myth: cardio is the best fat loss tool", hook: "Cardio is not the best way to lose fat — and the science is clear" },
  { id: "e062", batch: 7, platform: ["tiktok"], category: "education", title: "Myth: you need to eat less to lose weight", hook: "Eating less is destroying your metabolism — eat more of this instead" },
  { id: "e063", batch: 7, platform: ["tiktok", "instagram"], category: "education", title: "Myth: women should train differently than men", hook: "Women don't need a special program — they need a smart one" },
  { id: "e064", batch: 7, platform: ["tiktok"], category: "education", title: "Myth: soreness means a good workout", hook: "If you're not sore you're not working hard? Total myth." },
  { id: "e065", batch: 7, platform: ["instagram"], category: "education", title: "Myth: fasted cardio burns more fat", hook: "Fasted cardio for fat loss — myth or fact? Here's the research." },
  { id: "e066", batch: 7, platform: ["tiktok", "instagram"], category: "education", title: "Myth: supplements are necessary", hook: "The supplement industry profits from your confusion — here's what you actually need" },
  { id: "e067", batch: 7, platform: ["tiktok"], category: "education", title: "Myth: age is the reason you're out of shape", hook: "Your age is not the reason you're out of shape — here's what is" },
  { id: "e068", batch: 7, platform: ["tiktok", "instagram"], category: "education", title: "Myth: you need to sweat a lot", hook: "Sweating is not a sign of a good workout — stop chasing sweat" },
  { id: "e069", batch: 7, platform: ["tiktok"], category: "education", title: "Myth: protein makes you bulky", hook: "Protein will not make you bulky — the opposite is true" },
  { id: "e070", batch: 7, platform: ["tiktok", "instagram"], category: "education", title: "Myth: you can out-train a bad diet", hook: "You cannot out-train a bad diet — but here's what you can do" },
  // Batch 8 — Behind the scenes / day in the life
  { id: "e071", batch: 8, platform: ["tiktok", "instagram"], category: "lifestyle", title: "How I structure my coaching calls", hook: "Here's exactly what happens in one of my coaching calls" },
  { id: "e072", batch: 8, platform: ["tiktok"], category: "lifestyle", title: "My morning routine as a coach", hook: "My morning routine isn't glamorous — but it sets me up for everything" },
  { id: "e073", batch: 8, platform: ["tiktok", "instagram"], category: "lifestyle", title: "How I film 10 videos in one afternoon", hook: "I film 10 TikToks in one afternoon — here's exactly how I do it" },
  { id: "e074", batch: 8, platform: ["tiktok"], category: "lifestyle", title: "The hardest part of online coaching", hook: "The hardest part of being an online trainer isn't the training" },
  { id: "e075", batch: 8, platform: ["instagram"], category: "lifestyle", title: "My home gym setup for $800", hook: "My entire home gym cost $800 — here's every piece of equipment" },
  { id: "e076", batch: 8, platform: ["tiktok", "instagram"], category: "lifestyle", title: "What I eat in a day (trainer edition)", hook: "What I actually eat in a day — no smoothie bowls, no nonsense" },
  { id: "e077", batch: 8, platform: ["tiktok"], category: "lifestyle", title: "How I handle client cancellations", hook: "A client canceled on me last minute — here's how I handled it professionally" },
  { id: "e078", batch: 8, platform: ["tiktok", "instagram"], category: "lifestyle", title: "Running a business from my kitchen table", hook: "I run a $10k/month coaching business from my kitchen table" },
  { id: "e079", batch: 8, platform: ["tiktok"], category: "lifestyle", title: "Why I quit my corporate job for this", hook: "I left a six-figure corporate job to do this — here's if I regret it" },
  { id: "e080", batch: 8, platform: ["tiktok", "instagram"], category: "lifestyle", title: "My biggest coaching mistake", hook: "The biggest mistake I made as a new coach and what I learned" },
  // Batch 9 — Premium positioning
  { id: "e081", batch: 9, platform: ["tiktok", "instagram"], category: "authority", title: "Why I charge premium rates", hook: "I charge more than most trainers. Here's exactly why and why it's worth it." },
  { id: "e082", batch: 9, platform: ["tiktok"], category: "authority", title: "What $500/month coaching actually gets you", hook: "What does $500 a month coaching actually include? Let me break it down." },
  { id: "e083", batch: 9, platform: ["tiktok", "instagram"], category: "authority", title: "The difference between cheap and premium coaching", hook: "I've seen what cheap coaching looks like — here's the difference in outcomes" },
  { id: "e084", batch: 9, platform: ["tiktok"], category: "authority", title: "Why I only take 6 clients at a time", hook: "I only take 6 clients at a time — here's why that's good for you" },
  { id: "e085", batch: 9, platform: ["instagram"], category: "authority", title: "My results speak for themselves", hook: "I could tell you about my credentials or I could just show you results" },
  { id: "e086", batch: 9, platform: ["tiktok", "instagram"], category: "authority", title: "Who is not a good fit for my program", hook: "Not everyone is a good fit for my coaching — here's who I won't work with" },
  { id: "e087", batch: 9, platform: ["tiktok"], category: "authority", title: "The ROI of investing in your health", hook: "What's the ROI of investing $500 in your health? Let me show you." },
  { id: "e088", batch: 9, platform: ["tiktok", "instagram"], category: "authority", title: "Why you should interview your trainer", hook: "Before you hire any trainer, ask them these 5 questions" },
  { id: "e089", batch: 9, platform: ["tiktok"], category: "authority", title: "My client selection process", hook: "I turn down clients — here's how I decide who I work with" },
  { id: "e090", batch: 9, platform: ["tiktok", "instagram"], category: "authority", title: "What accountability actually means in coaching", hook: "Accountability in coaching isn't what you think it is" },
  // Batch 10 — Income / lifestyle / authority
  { id: "e091", batch: 10, platform: ["tiktok", "instagram"], category: "lifestyle", title: "How I built a $10k/month fitness business", hook: "How I went from $0 to $10k/month as a fitness coach in 90 days" },
  { id: "e092", batch: 10, platform: ["tiktok"], category: "lifestyle", title: "Trainers: stop trading time for money", hook: "If you're a trainer trading hours for dollars, watch this" },
  { id: "e093", batch: 10, platform: ["tiktok", "instagram"], category: "lifestyle", title: "The moment I realized I could do this online", hook: "There was a specific moment when I knew online coaching could work — here it is" },
  { id: "e094", batch: 10, platform: ["tiktok"], category: "lifestyle", title: "What nobody tells you about fitness business", hook: "What nobody tells you about starting a fitness business online" },
  { id: "e095", batch: 10, platform: ["instagram"], category: "lifestyle", title: "My revenue streams explained", hook: "Here are all the ways I make money as a fitness coach — broken down simply" },
  { id: "e096", batch: 10, platform: ["tiktok", "instagram"], category: "lifestyle", title: "Freedom is the product I actually sell", hook: "I don't sell fitness. I sell freedom. Here's what I mean." },
  { id: "e097", batch: 10, platform: ["tiktok"], category: "lifestyle", title: "What I do when I have no motivation", hook: "Even coaches lose motivation — here's what I do when that happens" },
  { id: "e098", batch: 10, platform: ["tiktok", "instagram"], category: "lifestyle", title: "Work-life balance as an online coach", hook: "Work-life balance as an online fitness coach — the honest truth" },
  { id: "e099", batch: 10, platform: ["tiktok"], category: "lifestyle", title: "My biggest income month and what caused it", hook: "My biggest revenue month as a coach — here's exactly what I did differently" },
  { id: "e100", batch: 10, platform: ["tiktok", "instagram"], category: "lifestyle", title: "What I would do differently if starting over", hook: "If I were starting my fitness coaching business over, here's what I'd change" },
  // Batch 11 — 3-month results / celebration
  { id: "e101", batch: 11, platform: ["tiktok", "instagram"], category: "social-proof", title: "90-day client results roundup", hook: "90 days of coaching results — here's every client's transformation" },
  { id: "e102", batch: 11, platform: ["tiktok"], category: "social-proof", title: "The 90-day moment that changed everything", hook: "At exactly 90 days something shifts — every single client experiences this" },
  { id: "e103", batch: 11, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client: finished first 5K after coaching", hook: "She couldn't walk up stairs without pain. She just finished a 5K." },
  { id: "e104", batch: 11, platform: ["tiktok"], category: "social-proof", title: "What clients say they wish they knew sooner", hook: "I asked my clients: what do you wish you'd started sooner? Here's what they said." },
  { id: "e105", batch: 11, platform: ["instagram"], category: "social-proof", title: "The measurable changes at 90 days", hook: "Here are the exact measurements my clients see at 90 days" },
  { id: "e106", batch: 11, platform: ["tiktok", "instagram"], category: "social-proof", title: "This is why I do what I do", hook: "This is the reason I do this work — and it has nothing to do with money" },
  { id: "e107", batch: 11, platform: ["tiktok"], category: "social-proof", title: "Client: reconnected with her body at 47", hook: "She said she felt disconnected from her body for 10 years — not anymore" },
  { id: "e108", batch: 11, platform: ["tiktok", "instagram"], category: "social-proof", title: "Client who trained through a divorce", hook: "She went through a divorce during our program and the gym saved her" },
  { id: "e109", batch: 11, platform: ["tiktok"], category: "social-proof", title: "What my own 90-day check-in showed", hook: "I do a 90-day check-in on myself too — here's what I found" },
  { id: "e110", batch: 11, platform: ["tiktok", "instagram"], category: "social-proof", title: "Celebrating wins — big and small", hook: "We celebrate every win in my program — here's why the small ones matter most" },
  // Batch 12 — Month 4 pipeline
  { id: "e111", batch: 12, platform: ["tiktok", "instagram"], category: "method", title: "What changes in Month 4 of training", hook: "Month 4 is when everything clicks — here's what to expect" },
  { id: "e112", batch: 12, platform: ["tiktok"], category: "method", title: "Advanced progressive overload techniques", hook: "You've mastered the basics — here's how to keep progressing after 90 days" },
  { id: "e113", batch: 12, platform: ["tiktok", "instagram"], category: "method", title: "How to maintain results long-term", hook: "Getting results is hard. Keeping them doesn't have to be." },
  { id: "e114", batch: 12, platform: ["tiktok"], category: "method", title: "When to increase workout intensity", hook: "How do you know when it's time to make your workouts harder?" },
  { id: "e115", batch: 12, platform: ["instagram"], category: "method", title: "Seasonal training adjustments", hook: "Your training should change with the seasons — here's how and why" },
  { id: "e116", batch: 12, platform: ["tiktok", "instagram"], category: "method", title: "Periodization explained for real people", hook: "Periodization sounds complicated. Here's what it actually means for you." },
  { id: "e117", batch: 12, platform: ["tiktok"], category: "method", title: "Deload weeks — why they matter", hook: "A deload week feels like giving up. It's actually the opposite." },
  { id: "e118", batch: 12, platform: ["tiktok", "instagram"], category: "method", title: "Nutrition in maintenance mode", hook: "You've hit your goal. Now what? Here's how to eat in maintenance." },
  { id: "e119", batch: 12, platform: ["tiktok"], category: "method", title: "Tracking progress without the scale", hook: "Throw out your scale — here are 5 better ways to track progress" },
  { id: "e120", batch: 12, platform: ["tiktok", "instagram"], category: "method", title: "Building a training habit that sticks", hook: "Most people quit after 60 days. Here's how to make fitness stick forever." },
  // Batch 13 — Reddit / educational deep dives
  { id: "e121", batch: 13, platform: ["reddit"], category: "education", title: "Comprehensive guide: lifting for women 35+", hook: "Everything women over 35 need to know about starting a lifting program" },
  { id: "e122", batch: 13, platform: ["reddit"], category: "education", title: "Hormone changes and exercise after 35", hook: "How hormonal changes affect your training after 35 — and what to do about it" },
  { id: "e123", batch: 13, platform: ["reddit"], category: "education", title: "Online coaching: how to choose the right coach", hook: "How to evaluate an online fitness coach before spending any money" },
  { id: "e124", batch: 13, platform: ["reddit"], category: "education", title: "Protein intake for women: the complete guide", hook: "How much protein do women actually need? Here's the evidence-based answer" },
  { id: "e125", batch: 13, platform: ["reddit"], category: "education", title: "Sleep and fat loss: the connection explained", hook: "Why poor sleep is sabotaging your fat loss — and how to fix it" },
  { id: "e126", batch: 13, platform: ["reddit"], category: "education", title: "Strength training myths debunked", hook: "10 strength training myths that are keeping women from results" },
  { id: "e127", batch: 13, platform: ["reddit"], category: "education", title: "How to create a home gym on any budget", hook: "Home gym setups for every budget — from $0 to $2,000" },
  { id: "e128", batch: 13, platform: ["reddit"], category: "education", title: "Understanding RPE and effort in training", hook: "RPE (Rate of Perceived Exertion) explained for everyday people" },
  { id: "e129", batch: 13, platform: ["reddit"], category: "education", title: "Cardio vs. strength: which should you prioritize?", hook: "Cardio vs. strength training — the definitive answer for women over 35" },
  { id: "e130", batch: 13, platform: ["reddit"], category: "education", title: "Building consistency: psychology of habit formation", hook: "Why you keep starting and stopping fitness programs — the psychology behind it" },
  // Batch 14 — Extra authority / seasonal
  { id: "e131", batch: 14, platform: ["tiktok", "instagram"], category: "authority", title: "What I learned from 1,000 hours of coaching", hook: "After 1,000 hours coaching women, here's the pattern I can't ignore" },
  { id: "e132", batch: 14, platform: ["tiktok"], category: "authority", title: "The client I almost gave up on", hook: "There was one client I almost let go. I'm so glad I didn't." },
  { id: "e133", batch: 14, platform: ["tiktok", "instagram"], category: "authority", title: "Why I don't post workout videos", hook: "I'm a fitness coach and I almost never post workout videos — here's why" },
  { id: "e134", batch: 14, platform: ["tiktok"], category: "authority", title: "The accountability system that actually works", hook: "I've tried every accountability system. This is the only one that works." },
  { id: "e135", batch: 14, platform: ["instagram"], category: "authority", title: "My coaching philosophy in 5 principles", hook: "My entire coaching philosophy comes down to 5 things" },
  { id: "e136", batch: 14, platform: ["tiktok", "instagram"], category: "authority", title: "Why most coaches fail their clients", hook: "Most fitness coaches fail their clients — here's how I make sure I don't" },
  { id: "e137", batch: 14, platform: ["tiktok"], category: "authority", title: "The hardest conversation I had with a client", hook: "The hardest conversation I've ever had with a client — and what came from it" },
  { id: "e138", batch: 14, platform: ["tiktok", "instagram"], category: "authority", title: "What success looks like after 90 days", hook: "Success at 90 days doesn't look like a magazine cover — here's what it actually looks like" },
  { id: "e139", batch: 14, platform: ["tiktok"], category: "authority", title: "My promise to every client", hook: "Here's my promise to every woman who works with me" },
]

// ─── Filming batches ──────────────────────────────────────────────────────────

interface FilmingBatch {
  batch: number
  week: number
  theme: string
  episodeIds: string[]
}

const FILMING_BATCHES: FilmingBatch[] = [
  { batch: 1, week: 1, theme: "Intro + Authority", episodeIds: ["e001","e002","e003","e004","e005","e006","e007","e008","e009","e010"] },
  { batch: 2, week: 2, theme: "Pain-point hooks", episodeIds: ["e011","e012","e013","e014","e015","e016","e017","e018","e019","e020"] },
  { batch: 3, week: 3, theme: "Transformation stories", episodeIds: ["e021","e022","e023","e024","e025","e026","e027","e028","e029","e030"] },
  { batch: 4, week: 4, theme: "Method explainers", episodeIds: ["e031","e032","e033","e034","e035","e036","e037","e038","e039","e040"] },
  { batch: 5, week: 5, theme: "Objection busters", episodeIds: ["e041","e042","e043","e044","e045","e046","e047","e048","e049","e050"] },
  { batch: 6, week: 6, theme: "Social proof / client results", episodeIds: ["e051","e052","e053","e054","e055","e056","e057","e058","e059","e060"] },
  { batch: 7, week: 7, theme: "Myth-busting", episodeIds: ["e061","e062","e063","e064","e065","e066","e067","e068","e069","e070"] },
  { batch: 8, week: 8, theme: "Behind the scenes / day in the life", episodeIds: ["e071","e072","e073","e074","e075","e076","e077","e078","e079","e080"] },
  { batch: 9, week: 9, theme: "Premium positioning", episodeIds: ["e081","e082","e083","e084","e085","e086","e087","e088","e089","e090"] },
  { batch: 10, week: 10, theme: "Income / lifestyle / authority", episodeIds: ["e091","e092","e093","e094","e095","e096","e097","e098","e099","e100"] },
  { batch: 11, week: 11, theme: "3-month results / celebration", episodeIds: ["e101","e102","e103","e104","e105","e106","e107","e108","e109","e110"] },
  { batch: 12, week: 12, theme: "Month 4 pipeline", episodeIds: ["e111","e112","e113","e114","e115","e116","e117","e118","e119","e120"] },
  { batch: 13, week: 13, theme: "Reddit / educational deep dives", episodeIds: ["e121","e122","e123","e124","e125","e126","e127","e128","e129","e130"] },
  { batch: 14, week: 13, theme: "Extra authority / seasonal", episodeIds: ["e131","e132","e133","e134","e135","e136","e137","e138","e139"] },
]

// ─── Scheduled posts ──────────────────────────────────────────────────────────

interface ScheduledPost {
  id: string
  day: number
  platform: Platform
  episodeId: string
  timeSlot: string
}

const SCHEDULED_POSTS: ScheduledPost[] = [
  // Day 1
  { id: "sp001", day: 1, platform: "tiktok", episodeId: "e001", timeSlot: "7:00 AM" },
  { id: "sp002", day: 1, platform: "instagram", episodeId: "e002", timeSlot: "12:00 PM" },
  // Day 2
  { id: "sp003", day: 2, platform: "tiktok", episodeId: "e003", timeSlot: "7:00 AM" },
  { id: "sp004", day: 2, platform: "instagram", episodeId: "e004", timeSlot: "6:00 PM" },
  // Day 3
  { id: "sp005", day: 3, platform: "tiktok", episodeId: "e005", timeSlot: "7:00 AM" },
  { id: "sp006", day: 3, platform: "instagram", episodeId: "e006", timeSlot: "12:00 PM" },
  // Day 4
  { id: "sp007", day: 4, platform: "tiktok", episodeId: "e007", timeSlot: "7:00 AM" },
  // Day 5
  { id: "sp008", day: 5, platform: "tiktok", episodeId: "e008", timeSlot: "7:00 AM" },
  { id: "sp009", day: 5, platform: "instagram", episodeId: "e009", timeSlot: "12:00 PM" },
  // Day 6
  { id: "sp010", day: 6, platform: "tiktok", episodeId: "e010", timeSlot: "7:00 AM" },
  // Day 7
  { id: "sp011", day: 7, platform: "instagram", episodeId: "e001", timeSlot: "11:00 AM" },
  // Day 8
  { id: "sp012", day: 8, platform: "tiktok", episodeId: "e011", timeSlot: "7:00 AM" },
  { id: "sp013", day: 8, platform: "instagram", episodeId: "e012", timeSlot: "6:00 PM" },
  // Day 9
  { id: "sp014", day: 9, platform: "tiktok", episodeId: "e013", timeSlot: "7:00 AM" },
  // Day 10
  { id: "sp015", day: 10, platform: "tiktok", episodeId: "e014", timeSlot: "7:00 AM" },
  { id: "sp016", day: 10, platform: "instagram", episodeId: "e015", timeSlot: "12:00 PM" },
  // Day 11
  { id: "sp017", day: 11, platform: "tiktok", episodeId: "e016", timeSlot: "7:00 AM" },
  // Day 12
  { id: "sp018", day: 12, platform: "tiktok", episodeId: "e017", timeSlot: "7:00 AM" },
  { id: "sp019", day: 12, platform: "instagram", episodeId: "e018", timeSlot: "6:00 PM" },
  // Day 13
  { id: "sp020", day: 13, platform: "tiktok", episodeId: "e019", timeSlot: "7:00 AM" },
  // Day 14
  { id: "sp021", day: 14, platform: "tiktok", episodeId: "e020", timeSlot: "7:00 AM" },
  { id: "sp022", day: 14, platform: "instagram", episodeId: "e011", timeSlot: "11:00 AM" },
  // Day 15
  { id: "sp023", day: 15, platform: "tiktok", episodeId: "e021", timeSlot: "7:00 AM" },
  { id: "sp024", day: 15, platform: "instagram", episodeId: "e022", timeSlot: "12:00 PM" },
  // Day 16
  { id: "sp025", day: 16, platform: "tiktok", episodeId: "e023", timeSlot: "7:00 AM" },
  // Day 17
  { id: "sp026", day: 17, platform: "tiktok", episodeId: "e024", timeSlot: "7:00 AM" },
  { id: "sp027", day: 17, platform: "instagram", episodeId: "e025", timeSlot: "6:00 PM" },
  // Day 18
  { id: "sp028", day: 18, platform: "tiktok", episodeId: "e026", timeSlot: "7:00 AM" },
  // Day 19
  { id: "sp029", day: 19, platform: "tiktok", episodeId: "e027", timeSlot: "7:00 AM" },
  { id: "sp030", day: 19, platform: "instagram", episodeId: "e028", timeSlot: "12:00 PM" },
  // Day 20
  { id: "sp031", day: 20, platform: "tiktok", episodeId: "e029", timeSlot: "7:00 AM" },
  // Day 21
  { id: "sp032", day: 21, platform: "tiktok", episodeId: "e030", timeSlot: "7:00 AM" },
  { id: "sp033", day: 21, platform: "instagram", episodeId: "e021", timeSlot: "11:00 AM" },
  // Day 22
  { id: "sp034", day: 22, platform: "tiktok", episodeId: "e031", timeSlot: "7:00 AM" },
  { id: "sp035", day: 22, platform: "instagram", episodeId: "e032", timeSlot: "12:00 PM" },
  // Day 23
  { id: "sp036", day: 23, platform: "tiktok", episodeId: "e033", timeSlot: "7:00 AM" },
  // Day 24
  { id: "sp037", day: 24, platform: "tiktok", episodeId: "e034", timeSlot: "7:00 AM" },
  { id: "sp038", day: 24, platform: "instagram", episodeId: "e035", timeSlot: "6:00 PM" },
  // Day 25
  { id: "sp039", day: 25, platform: "tiktok", episodeId: "e036", timeSlot: "7:00 AM" },
  // Day 26
  { id: "sp040", day: 26, platform: "tiktok", episodeId: "e037", timeSlot: "7:00 AM" },
  { id: "sp041", day: 26, platform: "instagram", episodeId: "e038", timeSlot: "12:00 PM" },
  // Day 27
  { id: "sp042", day: 27, platform: "tiktok", episodeId: "e039", timeSlot: "7:00 AM" },
  // Day 28
  { id: "sp043", day: 28, platform: "tiktok", episodeId: "e040", timeSlot: "7:00 AM" },
  { id: "sp044", day: 28, platform: "instagram", episodeId: "e031", timeSlot: "11:00 AM" },
  // Day 29
  { id: "sp045", day: 29, platform: "tiktok", episodeId: "e041", timeSlot: "7:00 AM" },
  { id: "sp046", day: 29, platform: "instagram", episodeId: "e042", timeSlot: "12:00 PM" },
  // Day 30
  { id: "sp047", day: 30, platform: "tiktok", episodeId: "e043", timeSlot: "7:00 AM" },
  { id: "sp048", day: 30, platform: "reddit", episodeId: "e121", timeSlot: "10:00 AM" },
  // Day 31
  { id: "sp049", day: 31, platform: "tiktok", episodeId: "e044", timeSlot: "7:00 AM" },
  { id: "sp050", day: 31, platform: "instagram", episodeId: "e045", timeSlot: "6:00 PM" },
  // Day 32
  { id: "sp051", day: 32, platform: "tiktok", episodeId: "e046", timeSlot: "7:00 AM" },
  // Day 33
  { id: "sp052", day: 33, platform: "tiktok", episodeId: "e047", timeSlot: "7:00 AM" },
  { id: "sp053", day: 33, platform: "instagram", episodeId: "e048", timeSlot: "12:00 PM" },
  // Day 34
  { id: "sp054", day: 34, platform: "tiktok", episodeId: "e049", timeSlot: "7:00 AM" },
  // Day 35
  { id: "sp055", day: 35, platform: "tiktok", episodeId: "e050", timeSlot: "7:00 AM" },
  { id: "sp056", day: 35, platform: "instagram", episodeId: "e041", timeSlot: "11:00 AM" },
  // Day 36
  { id: "sp057", day: 36, platform: "tiktok", episodeId: "e051", timeSlot: "7:00 AM" },
  { id: "sp058", day: 36, platform: "instagram", episodeId: "e052", timeSlot: "6:00 PM" },
  // Day 37
  { id: "sp059", day: 37, platform: "tiktok", episodeId: "e053", timeSlot: "7:00 AM" },
  // Day 38
  { id: "sp060", day: 38, platform: "tiktok", episodeId: "e054", timeSlot: "7:00 AM" },
  { id: "sp061", day: 38, platform: "instagram", episodeId: "e055", timeSlot: "12:00 PM" },
  // Day 39
  { id: "sp062", day: 39, platform: "tiktok", episodeId: "e056", timeSlot: "7:00 AM" },
  // Day 40
  { id: "sp063", day: 40, platform: "tiktok", episodeId: "e057", timeSlot: "7:00 AM" },
  { id: "sp064", day: 40, platform: "reddit", episodeId: "e122", timeSlot: "10:00 AM" },
  { id: "sp065", day: 40, platform: "instagram", episodeId: "e058", timeSlot: "6:00 PM" },
  // Day 41
  { id: "sp066", day: 41, platform: "tiktok", episodeId: "e059", timeSlot: "7:00 AM" },
  // Day 42
  { id: "sp067", day: 42, platform: "tiktok", episodeId: "e060", timeSlot: "7:00 AM" },
  { id: "sp068", day: 42, platform: "instagram", episodeId: "e051", timeSlot: "11:00 AM" },
  // Day 43
  { id: "sp069", day: 43, platform: "tiktok", episodeId: "e061", timeSlot: "7:00 AM" },
  { id: "sp070", day: 43, platform: "instagram", episodeId: "e062", timeSlot: "12:00 PM" },
  // Day 44
  { id: "sp071", day: 44, platform: "tiktok", episodeId: "e063", timeSlot: "7:00 AM" },
  // Day 45
  { id: "sp072", day: 45, platform: "tiktok", episodeId: "e064", timeSlot: "7:00 AM" },
  { id: "sp073", day: 45, platform: "instagram", episodeId: "e065", timeSlot: "6:00 PM" },
  // Day 46
  { id: "sp074", day: 46, platform: "tiktok", episodeId: "e066", timeSlot: "7:00 AM" },
  // Day 47
  { id: "sp075", day: 47, platform: "tiktok", episodeId: "e067", timeSlot: "7:00 AM" },
  { id: "sp076", day: 47, platform: "instagram", episodeId: "e068", timeSlot: "12:00 PM" },
  // Day 48
  { id: "sp077", day: 48, platform: "tiktok", episodeId: "e069", timeSlot: "7:00 AM" },
  // Day 49
  { id: "sp078", day: 49, platform: "tiktok", episodeId: "e070", timeSlot: "7:00 AM" },
  { id: "sp079", day: 49, platform: "instagram", episodeId: "e061", timeSlot: "11:00 AM" },
  // Day 50
  { id: "sp080", day: 50, platform: "tiktok", episodeId: "e071", timeSlot: "7:00 AM" },
  { id: "sp081", day: 50, platform: "reddit", episodeId: "e123", timeSlot: "10:00 AM" },
  { id: "sp082", day: 50, platform: "instagram", episodeId: "e072", timeSlot: "6:00 PM" },
  // Day 51
  { id: "sp083", day: 51, platform: "tiktok", episodeId: "e073", timeSlot: "7:00 AM" },
  // Day 52
  { id: "sp084", day: 52, platform: "tiktok", episodeId: "e074", timeSlot: "7:00 AM" },
  { id: "sp085", day: 52, platform: "instagram", episodeId: "e075", timeSlot: "12:00 PM" },
  // Day 53
  { id: "sp086", day: 53, platform: "tiktok", episodeId: "e076", timeSlot: "7:00 AM" },
  // Day 54
  { id: "sp087", day: 54, platform: "tiktok", episodeId: "e077", timeSlot: "7:00 AM" },
  { id: "sp088", day: 54, platform: "instagram", episodeId: "e078", timeSlot: "6:00 PM" },
  // Day 55
  { id: "sp089", day: 55, platform: "tiktok", episodeId: "e079", timeSlot: "7:00 AM" },
  // Day 56
  { id: "sp090", day: 56, platform: "tiktok", episodeId: "e080", timeSlot: "7:00 AM" },
  { id: "sp091", day: 56, platform: "instagram", episodeId: "e071", timeSlot: "11:00 AM" },
  // Day 57
  { id: "sp092", day: 57, platform: "tiktok", episodeId: "e081", timeSlot: "7:00 AM" },
  { id: "sp093", day: 57, platform: "instagram", episodeId: "e082", timeSlot: "12:00 PM" },
  // Day 58
  { id: "sp094", day: 58, platform: "tiktok", episodeId: "e083", timeSlot: "7:00 AM" },
  // Day 59
  { id: "sp095", day: 59, platform: "tiktok", episodeId: "e084", timeSlot: "7:00 AM" },
  { id: "sp096", day: 59, platform: "instagram", episodeId: "e085", timeSlot: "6:00 PM" },
  // Day 60
  { id: "sp097", day: 60, platform: "tiktok", episodeId: "e086", timeSlot: "7:00 AM" },
  { id: "sp098", day: 60, platform: "reddit", episodeId: "e124", timeSlot: "10:00 AM" },
  // Day 61
  { id: "sp099", day: 61, platform: "tiktok", episodeId: "e087", timeSlot: "7:00 AM" },
  { id: "sp100", day: 61, platform: "instagram", episodeId: "e088", timeSlot: "12:00 PM" },
  // Day 62
  { id: "sp101", day: 62, platform: "tiktok", episodeId: "e089", timeSlot: "7:00 AM" },
  // Day 63
  { id: "sp102", day: 63, platform: "tiktok", episodeId: "e090", timeSlot: "7:00 AM" },
  { id: "sp103", day: 63, platform: "instagram", episodeId: "e081", timeSlot: "11:00 AM" },
  // Day 64
  { id: "sp104", day: 64, platform: "tiktok", episodeId: "e091", timeSlot: "7:00 AM" },
  { id: "sp105", day: 64, platform: "instagram", episodeId: "e092", timeSlot: "6:00 PM" },
  // Day 65
  { id: "sp106", day: 65, platform: "tiktok", episodeId: "e093", timeSlot: "7:00 AM" },
  // Day 66
  { id: "sp107", day: 66, platform: "tiktok", episodeId: "e094", timeSlot: "7:00 AM" },
  { id: "sp108", day: 66, platform: "instagram", episodeId: "e095", timeSlot: "12:00 PM" },
  // Day 67
  { id: "sp109", day: 67, platform: "tiktok", episodeId: "e096", timeSlot: "7:00 AM" },
  // Day 68
  { id: "sp110", day: 68, platform: "tiktok", episodeId: "e097", timeSlot: "7:00 AM" },
  { id: "sp111", day: 68, platform: "instagram", episodeId: "e098", timeSlot: "6:00 PM" },
  // Day 69
  { id: "sp112", day: 69, platform: "tiktok", episodeId: "e099", timeSlot: "7:00 AM" },
  // Day 70
  { id: "sp113", day: 70, platform: "tiktok", episodeId: "e100", timeSlot: "7:00 AM" },
  { id: "sp114", day: 70, platform: "reddit", episodeId: "e125", timeSlot: "10:00 AM" },
  { id: "sp115", day: 70, platform: "instagram", episodeId: "e091", timeSlot: "11:00 AM" },
  // Day 71
  { id: "sp116", day: 71, platform: "tiktok", episodeId: "e101", timeSlot: "7:00 AM" },
  { id: "sp117", day: 71, platform: "instagram", episodeId: "e102", timeSlot: "12:00 PM" },
  // Day 72
  { id: "sp118", day: 72, platform: "tiktok", episodeId: "e103", timeSlot: "7:00 AM" },
  // Day 73
  { id: "sp119", day: 73, platform: "tiktok", episodeId: "e104", timeSlot: "7:00 AM" },
  { id: "sp120", day: 73, platform: "instagram", episodeId: "e105", timeSlot: "6:00 PM" },
  // Day 74
  { id: "sp121", day: 74, platform: "tiktok", episodeId: "e106", timeSlot: "7:00 AM" },
  // Day 75
  { id: "sp122", day: 75, platform: "tiktok", episodeId: "e107", timeSlot: "7:00 AM" },
  { id: "sp123", day: 75, platform: "instagram", episodeId: "e108", timeSlot: "12:00 PM" },
  // Day 76
  { id: "sp124", day: 76, platform: "tiktok", episodeId: "e109", timeSlot: "7:00 AM" },
  // Day 77
  { id: "sp125", day: 77, platform: "tiktok", episodeId: "e110", timeSlot: "7:00 AM" },
  { id: "sp126", day: 77, platform: "instagram", episodeId: "e101", timeSlot: "11:00 AM" },
  // Day 78
  { id: "sp127", day: 78, platform: "tiktok", episodeId: "e111", timeSlot: "7:00 AM" },
  { id: "sp128", day: 78, platform: "instagram", episodeId: "e112", timeSlot: "6:00 PM" },
  // Day 79
  { id: "sp129", day: 79, platform: "tiktok", episodeId: "e113", timeSlot: "7:00 AM" },
  // Day 80
  { id: "sp130", day: 80, platform: "tiktok", episodeId: "e114", timeSlot: "7:00 AM" },
  { id: "sp131", day: 80, platform: "reddit", episodeId: "e126", timeSlot: "10:00 AM" },
  { id: "sp132", day: 80, platform: "instagram", episodeId: "e115", timeSlot: "12:00 PM" },
  // Day 81
  { id: "sp133", day: 81, platform: "tiktok", episodeId: "e116", timeSlot: "7:00 AM" },
  // Day 82
  { id: "sp134", day: 82, platform: "tiktok", episodeId: "e117", timeSlot: "7:00 AM" },
  { id: "sp135", day: 82, platform: "instagram", episodeId: "e118", timeSlot: "6:00 PM" },
  // Day 83
  { id: "sp136", day: 83, platform: "tiktok", episodeId: "e119", timeSlot: "7:00 AM" },
  // Day 84
  { id: "sp137", day: 84, platform: "tiktok", episodeId: "e120", timeSlot: "7:00 AM" },
  { id: "sp138", day: 84, platform: "instagram", episodeId: "e111", timeSlot: "11:00 AM" },
  // Day 85
  { id: "sp139", day: 85, platform: "tiktok", episodeId: "e131", timeSlot: "7:00 AM" },
  { id: "sp140", day: 85, platform: "instagram", episodeId: "e132", timeSlot: "12:00 PM" },
  // Day 86
  { id: "sp141", day: 86, platform: "tiktok", episodeId: "e133", timeSlot: "7:00 AM" },
  // Day 87
  { id: "sp142", day: 87, platform: "tiktok", episodeId: "e134", timeSlot: "7:00 AM" },
  { id: "sp143", day: 87, platform: "instagram", episodeId: "e135", timeSlot: "6:00 PM" },
  // Day 88
  { id: "sp144", day: 88, platform: "tiktok", episodeId: "e136", timeSlot: "7:00 AM" },
  // Day 89
  { id: "sp145", day: 89, platform: "tiktok", episodeId: "e137", timeSlot: "7:00 AM" },
  { id: "sp146", day: 89, platform: "instagram", episodeId: "e138", timeSlot: "12:00 PM" },
  // Day 90
  { id: "sp147", day: 90, platform: "tiktok", episodeId: "e139", timeSlot: "7:00 AM" },
  { id: "sp148", day: 90, platform: "reddit", episodeId: "e130", timeSlot: "10:00 AM" },
  { id: "sp149", day: 90, platform: "instagram", episodeId: "e131", timeSlot: "6:00 PM" },
]

// ─── Module-level Maps ────────────────────────────────────────────────────────

const EPISODE_MAP = new Map(EPISODES.map(e => [e.id, e]))
const POST_MAP = new Map(SCHEDULED_POSTS.map(p => [p.id, p]))

// ─── Storage helpers ──────────────────────────────────────────────────────────

function defaultRevenue(): RevenueMonth {
  return { coaching: 0, courses: 0, memberships: 0, affiliates: 0 }
}

function defaultMetrics(): Metrics {
  return { tiktokFollowers: 0, tiktokViews: 0, igFollowers: 0, igReach: 0, emailSubscribers: 0, websiteVisits: 0 }
}

function defaultState(): PlanState {
  return {
    version: 2,
    startDate: null,
    completedTasks: {},
    revenue: { m1: defaultRevenue(), m2: defaultRevenue(), m3: defaultRevenue() },
    clients: [],
    metrics: defaultMetrics(),
    filmedBatches: {},
    postOverrides: {},
    postStatuses: {},
    performance: [],
    sales: [],
    adCampaigns: [],
  }
}

function migrateV1(v1: PlanStateV1): PlanState {
  return {
    ...defaultState(),
    startDate: v1.startDate,
    completedTasks: v1.completedTasks ?? {},
    revenue: v1.revenue ?? { m1: defaultRevenue(), m2: defaultRevenue(), m3: defaultRevenue() },
    clients: (v1.clients ?? []).map(c => ({
      id: c.id,
      name: c.name,
      startDate: c.startDate,
      nextCall: c.nextCall,
      tier: "foundation" as CoachingTier,
      monthlyFee: c.monthlyFee,
      paymentType: "monthly" as const,
      status: c.status,
      notes: c.notes,
      testimonialReceived: false,
    })),
    metrics: v1.metrics ?? defaultMetrics(),
  }
}

function loadState(): PlanState {
  try {
    const v2raw = localStorage.getItem("lfm_plan_v2")
    if (v2raw) {
      const parsed = JSON.parse(v2raw) as PlanState
      if (parsed.version === 2) return parsed
    }
    const v1raw = localStorage.getItem("lfm_plan_v1")
    if (v1raw) {
      const v1parsed = JSON.parse(v1raw) as PlanStateV1
      return migrateV1(v1parsed)
    }
  } catch {
    // ignore parse errors
  }
  return defaultState()
}

function saveState(state: PlanState): void {
  try {
    localStorage.setItem("lfm_plan_v2", JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthFromDay(day: number): 1 | 2 | 3 {
  return day <= 30 ? 1 : day <= 60 ? 2 : 3
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function computedSalesTotal(sales: SaleEntry[], month: 1 | 2 | 3): number {
  return sales.filter(s => s.month === month).reduce((acc, s) => acc + s.amount, 0)
}

function getPostsForDay(day: number): ScheduledPost[] {
  return SCHEDULED_POSTS.filter(p => p.day === day)
}


function getContentStreak(postStatuses: Record<string, PostStatus>, startDate: string | null): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  const today = new Date()
  const totalDays = Math.floor((today.getTime() - start.getTime()) / 86400000)
  let streak = 0
  for (let i = totalDays; i >= 0; i--) {
    const dayPosts = getPostsForDay(i + 1)
    if (dayPosts.length === 0) continue
    const anyPosted = dayPosts.some(p => postStatuses[p.id] === "posted")
    if (anyPosted) streak++
    else break
  }
  return streak
}

function getCurrentDay(startDate: string | null): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  const today = new Date()
  return Math.floor((today.getTime() - start.getTime()) / 86400000) + 1
}

function getCurrentWeek(startDate: string | null): number {
  const day = getCurrentDay(startDate)
  return Math.max(1, Math.min(13, Math.ceil(day / 7)))
}

function formatDate(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${m}/${d}/${y}`
}

function platformEmoji(platform: Platform): string {
  if (platform === "tiktok") return "TT"
  if (platform === "instagram") return "IG"
  return "RD"
}

function platformColor(platform: Platform): string {
  if (platform === "tiktok") return C.gold
  if (platform === "instagram") return C.blue
  return C.green
}

function ratingLabel(rating: PostRating): string {
  if (rating === "fire") return "🔥 Fire"
  if (rating === "check") return "✓ Good"
  if (rating === "neutral") return "— OK"
  return "✗ Miss"
}

function totalRevenue(rev: RevenueMonth): number {
  return rev.coaching + rev.courses + rev.memberships + rev.affiliates
}

function clientMonthlyTotal(clients: Client[]): number {
  return clients.filter(c => c.status === "active").reduce((acc, c) => acc + c.monthlyFee, 0)
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: F.heading, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gold, marginBottom: 14 }}>
      {children}
    </p>
  )
}

function StatRow({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontFamily: F.body, fontSize: 13, color: C.mutedLight }}>{label}</span>
      <span style={{ fontFamily: F.heading, fontSize: 20, color: color ?? C.cream }}>
        {value}
        {sub && <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>{sub}</span>}
      </span>
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color ?? C.gold, borderRadius: 2, transition: "width 0.4s" }} />
    </div>
  )
}

function PillBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontFamily: F.body, background: color + "22", color, border: `1px solid ${color}44`, letterSpacing: "0.06em" }}>
      {label}
    </span>
  )
}

function GoldBtn({ children, onClick, small }: { children: React.ReactNode; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.gold,
        color: C.bg,
        border: "none",
        borderRadius: 8,
        padding: small ? "6px 14px" : "10px 20px",
        fontFamily: F.body,
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        cursor: "pointer",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, small }: { children: React.ReactNode; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: C.mutedLight,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: small ? "6px 12px" : "8px 16px",
        fontFamily: F.body,
        fontSize: small ? 11 : 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}

function Input({ value, onChange, placeholder, type }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type ?? "text"}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "9px 12px",
        fontFamily: F.body,
        fontSize: 13,
        color: C.cream,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "9px 12px",
        fontFamily: F.body,
        fontSize: 13,
        color: C.cream,
        outline: "none",
        cursor: "pointer",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Tab: Home ────────────────────────────────────────────────────────────────

function HomeTab({ state, onSetStart }: { state: PlanState; onSetStart: (d: string) => void }) {
  const currentDay = getCurrentDay(state.startDate)
  const currentWeek = getCurrentWeek(state.startDate)
  const streak = getContentStreak(state.postStatuses, state.startDate)
  const phase = currentDay <= 30 ? 1 : currentDay <= 60 ? 2 : 3
  const activeClients = state.clients.filter(c => c.status === "active").length
  const monthlyRecurring = clientMonthlyTotal(state.clients)
  const [dateInput, setDateInput] = useState("")

  const m1Rev = totalRevenue(state.revenue.m1)
  const m2Rev = totalRevenue(state.revenue.m2)
  const m3Rev = totalRevenue(state.revenue.m3)

  const todayPosts = currentDay > 0 ? getPostsForDay(currentDay) : []
  const todayPosted = todayPosts.filter(p => state.postStatuses[p.id] === "posted").length

  function handleStart() {
    if (dateInput) onSetStart(dateInput)
  }

  if (!state.startDate) {
    return (
      <div style={{ padding: "32px 16px" }}>
        <Card>
          <p style={{ fontFamily: F.heading, fontSize: 26, color: C.cream, marginBottom: 8 }}>Welcome to Your 90-Day Plan</p>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
            Set your start date to activate your content calendar, filming schedule, and daily posting plan.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Input type="date" value={dateInput} onChange={setDateInput} placeholder="Start date" />
            <GoldBtn onClick={handleStart}>Start</GoldBtn>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <p style={{ fontFamily: F.heading, fontSize: 28, color: C.cream }}>Day {currentDay}</p>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>Week {currentWeek} · Phase {phase}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: F.heading, fontSize: 22, color: C.gold }}>{streak}</p>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>day streak</p>
          </div>
        </div>
        <ProgressBar value={currentDay} max={90} />
        <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 6 }}>
          Started {formatDate(state.startDate)} · {Math.max(0, 90 - currentDay)} days remaining
        </p>
      </Card>

      {/* Today's posts */}
      {todayPosts.length > 0 && (
        <Card>
          <SectionTitle>Today — Day {currentDay}</SectionTitle>
          {todayPosts.map(p => {
            const ep = EPISODE_MAP.get(p.episodeId)
            const status = state.postStatuses[p.id]
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <PillBadge label={platformEmoji(p.platform)} color={platformColor(p.platform)} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream }}>{ep?.title ?? p.episodeId}</p>
                  <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>{p.timeSlot}</p>
                </div>
                {status === "posted" && <PillBadge label="Posted" color={C.green} />}
                {status === "skipped" && <PillBadge label="Skipped" color={C.error} />}
                {!status && <PillBadge label="Scheduled" color={C.muted} />}
              </div>
            )
          })}
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 8 }}>
            {todayPosted}/{todayPosts.length} posted today
          </p>
        </Card>
      )}

      {/* Revenue snapshot */}
      <Card>
        <SectionTitle>Revenue Snapshot</SectionTitle>
        <StatRow label="Month 1" value={`$${m1Rev.toLocaleString()}`} sub={`/ $${MONTH_TARGETS.m1.toLocaleString()}`} color={m1Rev >= MONTH_TARGETS.m1 ? C.green : C.cream} />
        <StatRow label="Month 2" value={`$${m2Rev.toLocaleString()}`} sub={`/ $${MONTH_TARGETS.m2.toLocaleString()}`} color={m2Rev >= MONTH_TARGETS.m2 ? C.green : C.cream} />
        <StatRow label="Month 3" value={`$${m3Rev.toLocaleString()}`} sub={`/ $${MONTH_TARGETS.m3.toLocaleString()}`} color={m3Rev >= MONTH_TARGETS.m3 ? C.green : C.cream} />
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={m1Rev + m2Rev + m3Rev} max={MONTH_TARGETS.m1 + MONTH_TARGETS.m2 + MONTH_TARGETS.m3} />
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 4 }}>
            90-day total: ${(m1Rev + m2Rev + m3Rev).toLocaleString()} / ${(MONTH_TARGETS.m1 + MONTH_TARGETS.m2 + MONTH_TARGETS.m3).toLocaleString()}
          </p>
        </div>
      </Card>

      {/* Clients */}
      <Card>
        <SectionTitle>Coaching</SectionTitle>
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontFamily: F.heading, fontSize: 32, color: C.gold }}>{activeClients}</p>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>active clients</p>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontFamily: F.heading, fontSize: 32, color: C.cream }}>{MAX_CLIENTS - activeClients}</p>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>spots open</p>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontFamily: F.heading, fontSize: 32, color: C.green }}>${monthlyRecurring.toLocaleString()}</p>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>MRR</p>
          </div>
        </div>
        <ProgressBar value={activeClients} max={MAX_CLIENTS} color={C.green} />
      </Card>

      {/* Bio lines */}
      <Card>
        <SectionTitle>Bio Template</SectionTitle>
        {BIO_LINES.map((line, i) => (
          <p key={i} style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight, lineHeight: 1.8 }}>{line}</p>
        ))}
      </Card>
    </div>
  )
}

// ─── Tab: Film ────────────────────────────────────────────────────────────────

function FilmTab({ state, onToggleBatch }: { state: PlanState; onToggleBatch: (batch: number) => void }) {
  const currentWeek = getCurrentWeek(state.startDate)

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle>Filming Schedule</SectionTitle>
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted, marginBottom: 12 }}>Film 10 videos per batch, one batch per week. Check off when done.</p>
      </Card>

      {FILMING_BATCHES.map(fb => {
        const done = !!state.filmedBatches[fb.batch]
        const isCurrent = fb.week === currentWeek
        const isPast = fb.week < currentWeek
        return (
          <Card key={fb.batch} style={{ opacity: isPast && !done ? 0.6 : 1, borderColor: isCurrent ? C.gold + "66" : C.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontFamily: F.heading, fontSize: 18, color: done ? C.green : C.cream }}>
                    Batch {fb.batch}
                  </p>
                  {isCurrent && <PillBadge label="This Week" color={C.gold} />}
                  {done && <PillBadge label="Filmed" color={C.green} />}
                </div>
                <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>Week {fb.week} · {fb.theme}</p>
              </div>
              <button
                onClick={() => onToggleBatch(fb.batch)}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: `2px solid ${done ? C.green : C.border}`,
                  background: done ? C.green + "22" : "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: done ? C.green : C.muted, fontSize: 14,
                }}
              >
                {done ? "✓" : ""}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {fb.episodeIds.map(eid => {
                const ep = EPISODE_MAP.get(eid)
                if (!ep) return null
                return (
                  <div key={eid} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                    <span style={{ fontFamily: F.body, fontSize: 11, color: C.muted, minWidth: 32 }}>{eid}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight }}>{ep.title}</p>
                      <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, fontStyle: "italic" }}>&quot;{ep.hook}&quot;</p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {ep.platform.map(pl => (
                        <PillBadge key={pl} label={platformEmoji(pl)} color={platformColor(pl)} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Tab: Post ────────────────────────────────────────────────────────────────

function PostTab({ state, onToggleStatus, onLogPerformance }: {
  state: PlanState
  onToggleStatus: (postId: string) => void
  onLogPerformance: (perf: PostPerformance) => void
}) {
  const currentDay = getCurrentDay(state.startDate)
  const [selectedDay, setSelectedDay] = useState<number>(Math.max(1, currentDay))
  const [showPerfForm, setShowPerfForm] = useState<string | null>(null)
  const [perfForm, setPerfForm] = useState({ views: "", likes: "", comments: "", rating: "check" as PostRating, notes: "" })

  const dayPosts = getPostsForDay(selectedDay)

  function cycleDays(dir: 1 | -1) {
    setSelectedDay(d => Math.max(1, Math.min(90, d + dir)))
  }

  function submitPerf(postId: string) {
    const p = POST_MAP.get(postId)
    if (!p) return
    onLogPerformance({
      postId,
      postedDate: state.startDate ? addDays(state.startDate, selectedDay - 1) : "",
      platform: p.platform,
      views: parseInt(perfForm.views) || 0,
      likes: parseInt(perfForm.likes) || 0,
      comments: parseInt(perfForm.comments) || 0,
      rating: perfForm.rating,
      notes: perfForm.notes,
    })
    setShowPerfForm(null)
    setPerfForm({ views: "", likes: "", comments: "", rating: "check", notes: "" })
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Day selector */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <GhostBtn onClick={() => cycleDays(-1)} small>◀</GhostBtn>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: F.heading, fontSize: 22, color: C.cream }}>Day {selectedDay}</p>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>
              {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          <GhostBtn onClick={() => cycleDays(1)} small>▶</GhostBtn>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {[1, 7, 14, 21, 28, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setSelectedDay(d)} style={{
              padding: "4px 8px", fontSize: 11, fontFamily: F.body,
              background: selectedDay === d ? C.gold : "transparent",
              color: selectedDay === d ? C.bg : C.muted,
              border: `1px solid ${selectedDay === d ? C.gold : C.border}`,
              borderRadius: 6, cursor: "pointer",
            }}>
              {d}
            </button>
          ))}
        </div>
      </Card>

      {/* Posts for selected day */}
      {dayPosts.length === 0 ? (
        <Card><p style={{ fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: "center" }}>No posts scheduled for Day {selectedDay}</p></Card>
      ) : (
        dayPosts.map(p => {
          const ep = EPISODE_MAP.get(p.episodeId)
          const status = state.postStatuses[p.id]
          const perfEntry = state.performance.find(pf => pf.postId === p.id)
          return (
            <Card key={p.id}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <PillBadge label={platformEmoji(p.platform)} color={platformColor(p.platform)} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream }}>{ep?.title ?? p.episodeId}</p>
                  <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 2 }}>&quot;{ep?.hook}&quot;</p>
                  <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 4 }}>{p.timeSlot}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => onToggleStatus(p.id)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 12,
                    background: status === "posted" ? C.green + "22" : status === "skipped" ? C.error + "22" : C.border + "44",
                    color: status === "posted" ? C.green : status === "skipped" ? C.error : C.mutedLight,
                    border: `1px solid ${status === "posted" ? C.green + "66" : status === "skipped" ? C.error + "66" : C.border}`,
                  }}
                >
                  {status === "posted" ? "✓ Posted" : status === "skipped" ? "✗ Skipped" : "· Scheduled"}
                </button>
                {status === "posted" && !perfEntry && (
                  <GhostBtn small onClick={() => setShowPerfForm(p.id)}>Log Stats</GhostBtn>
                )}
                {perfEntry && (
                  <PillBadge label={ratingLabel(perfEntry.rating)} color={perfEntry.rating === "fire" ? C.gold : perfEntry.rating === "check" ? C.green : perfEntry.rating === "neutral" ? C.mutedLight : C.error} />
                )}
              </div>

              {perfEntry && (
                <div style={{ display: "flex", gap: 16, marginTop: 10, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                  <StatRow label="Views" value={perfEntry.views.toLocaleString()} />
                  <StatRow label="Likes" value={perfEntry.likes.toLocaleString()} />
                  <StatRow label="Comments" value={perfEntry.comments.toLocaleString()} />
                </div>
              )}

              {showPerfForm === p.id && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, padding: "12px", background: C.bg, borderRadius: 8 }}>
                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>Log performance</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <Input value={perfForm.views} onChange={v => setPerfForm(f => ({ ...f, views: v }))} placeholder="Views" />
                    <Input value={perfForm.likes} onChange={v => setPerfForm(f => ({ ...f, likes: v }))} placeholder="Likes" />
                    <Input value={perfForm.comments} onChange={v => setPerfForm(f => ({ ...f, comments: v }))} placeholder="Comments" />
                  </div>
                  <Select
                    value={perfForm.rating}
                    onChange={v => setPerfForm(f => ({ ...f, rating: v as PostRating }))}
                    options={[
                      { label: "🔥 Fire", value: "fire" },
                      { label: "✓ Good", value: "check" },
                      { label: "— OK", value: "neutral" },
                      { label: "✗ Miss", value: "miss" },
                    ]}
                  />
                  <Input value={perfForm.notes} onChange={v => setPerfForm(f => ({ ...f, notes: v }))} placeholder="Notes (optional)" />
                  <div style={{ display: "flex", gap: 8 }}>
                    <GoldBtn small onClick={() => submitPerf(p.id)}>Save</GoldBtn>
                    <GhostBtn small onClick={() => setShowPerfForm(null)}>Cancel</GhostBtn>
                  </div>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// ─── Tab: Stats ───────────────────────────────────────────────────────────────

function StatsTab({ state, onUpdateMetrics }: { state: PlanState; onUpdateMetrics: (m: Metrics) => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Metrics>(state.metrics)

  const postedCount = Object.values(state.postStatuses).filter(s => s === "posted").length
  const skippedCount = Object.values(state.postStatuses).filter(s => s === "skipped").length
  const totalScheduled = SCHEDULED_POSTS.length
  const engagementTotal = state.performance.reduce((acc, p) => acc + p.views + p.likes + p.comments, 0)
  const fireCount = state.performance.filter(p => p.rating === "fire").length
  const missCount = state.performance.filter(p => p.rating === "miss").length

  function save() {
    onUpdateMetrics(form)
    setEditing(false)
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Content stats */}
      <Card>
        <SectionTitle>Content Performance</SectionTitle>
        <StatRow label="Total posts" value={totalScheduled} />
        <StatRow label="Posted" value={postedCount} color={C.green} />
        <StatRow label="Skipped" value={skippedCount} color={C.error} />
        <StatRow label="Total engagement" value={engagementTotal.toLocaleString()} color={C.gold} />
        <StatRow label="Fire posts" value={fireCount} color={C.goldLight} />
        <StatRow label="Missed posts" value={missCount} color={C.error} />
        <div style={{ marginTop: 12 }}>
          <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginBottom: 4 }}>Content completion</p>
          <ProgressBar value={postedCount} max={totalScheduled} />
        </div>
      </Card>

      {/* Platform metrics */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Platform Metrics</SectionTitle>
          {!editing ? (
            <GhostBtn small onClick={() => { setForm(state.metrics); setEditing(true) }}>Edit</GhostBtn>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <GoldBtn small onClick={save}>Save</GoldBtn>
              <GhostBtn small onClick={() => setEditing(false)}>Cancel</GhostBtn>
            </div>
          )}
        </div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(
              [
                { key: "tiktokFollowers", label: "TikTok Followers" },
                { key: "tiktokViews", label: "TikTok Views" },
                { key: "igFollowers", label: "IG Followers" },
                { key: "igReach", label: "IG Reach" },
                { key: "emailSubscribers", label: "Email Subscribers" },
                { key: "websiteVisits", label: "Website Visits" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</p>
                <Input
                  type="number"
                  value={String(form[key])}
                  onChange={v => setForm(f => ({ ...f, [key]: parseInt(v) || 0 }))}
                  placeholder={label}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <StatRow label="TikTok Followers" value={state.metrics.tiktokFollowers.toLocaleString()} />
            <StatRow label="TikTok Views" value={state.metrics.tiktokViews.toLocaleString()} />
            <StatRow label="IG Followers" value={state.metrics.igFollowers.toLocaleString()} />
            <StatRow label="IG Reach" value={state.metrics.igReach.toLocaleString()} />
            <StatRow label="Email Subscribers" value={state.metrics.emailSubscribers.toLocaleString()} />
            <StatRow label="Website Visits" value={state.metrics.websiteVisits.toLocaleString()} />
          </>
        )}
      </Card>

      {/* Top posts */}
      {state.performance.length > 0 && (
        <Card>
          <SectionTitle>Top Posts by Views</SectionTitle>
          {[...state.performance]
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
            .map(perf => {
              const post = POST_MAP.get(perf.postId)
              const ep = post ? EPISODE_MAP.get(post.episodeId) : undefined
              return (
                <div key={perf.postId} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream }}>{ep?.title ?? perf.postId}</p>
                      <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>{perf.postedDate}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: F.heading, fontSize: 16, color: C.gold }}>{perf.views.toLocaleString()}</p>
                      <p style={{ fontFamily: F.body, fontSize: 10, color: C.muted }}>views</p>
                    </div>
                  </div>
                </div>
              )
            })}
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Sales ───────────────────────────────────────────────────────────────

function SalesTab({ state, onAddSale, onDeleteSale }: {
  state: PlanState
  onAddSale: (sale: SaleEntry) => void
  onDeleteSale: (id: string) => void
}) {
  const currentDay = getCurrentDay(state.startDate)
  const currentMonth = getMonthFromDay(Math.max(1, currentDay))

  const [form, setForm] = useState({ product: PRODUCTS[0].value, amount: "", notes: "", month: String(currentMonth) as "1" | "2" | "3" })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const m1Total = computedSalesTotal(state.sales, 1)
  const m2Total = computedSalesTotal(state.sales, 2)
  const m3Total = computedSalesTotal(state.sales, 3)

  function addSale() {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    onAddSale({
      id: uid(),
      date: new Date().toISOString().split("T")[0],
      product: form.product,
      amount: amt,
      month: parseInt(form.month) as 1 | 2 | 3,
      notes: form.notes,
    })
    setForm(f => ({ ...f, amount: "", notes: "" }))
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Targets */}
      <Card>
        <SectionTitle>Revenue Targets</SectionTitle>
        {([1, 2, 3] as const).map(m => {
          const total = m === 1 ? m1Total : m === 2 ? m2Total : m3Total
          const target = m === 1 ? MONTH_TARGETS.m1 : m === 2 ? MONTH_TARGETS.m2 : MONTH_TARGETS.m3
          return (
            <div key={m} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight }}>Month {m}</span>
                <span style={{ fontFamily: F.heading, fontSize: 16, color: total >= target ? C.green : C.cream }}>
                  ${total.toLocaleString()} / ${target.toLocaleString()}
                </span>
              </div>
              <ProgressBar value={total} max={target} color={total >= target ? C.green : C.gold} />
            </div>
          )
        })}
      </Card>

      {/* Add sale */}
      <Card>
        <SectionTitle>Log a Sale</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Select value={form.product} onChange={v => setForm(f => ({ ...f, product: v }))} options={PRODUCTS} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="Amount ($)" />
            <Select
              value={form.month}
              onChange={v => setForm(f => ({ ...f, month: v as "1" | "2" | "3" }))}
              options={[
                { label: "Month 1", value: "1" },
                { label: "Month 2", value: "2" },
                { label: "Month 3", value: "3" },
              ]}
            />
          </div>
          <Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notes (optional)" />
          <GoldBtn onClick={addSale}>Add Sale</GoldBtn>
        </div>
      </Card>

      {/* Sales log */}
      {state.sales.length > 0 && (
        <Card>
          <SectionTitle>Sales Log</SectionTitle>
          {[...state.sales].reverse().map(sale => (
            <div key={sale.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream }}>{sale.product}</p>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>{sale.date} · Month {sale.month}</p>
                {sale.notes && <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, fontStyle: "italic" }}>{sale.notes}</p>}
              </div>
              <p style={{ fontFamily: F.heading, fontSize: 18, color: C.gold }}>${sale.amount.toLocaleString()}</p>
              {confirmDelete === sale.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { onDeleteSale(sale.id); setConfirmDelete(null) }} style={{ background: C.error + "22", color: C.error, border: `1px solid ${C.error}44`, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: F.body }}>Delete</button>
                  <GhostBtn small onClick={() => setConfirmDelete(null)}>Cancel</GhostBtn>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(sale.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>×</button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Clients ─────────────────────────────────────────────────────────────

function ClientsTab({ state, onAddClient, onUpdateClient, onDeleteClient }: {
  state: PlanState
  onAddClient: (c: Client) => void
  onUpdateClient: (c: Client) => void
  onDeleteClient: (id: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", startDate: "", nextCall: "",
    tier: "foundation" as CoachingTier,
    paymentType: "monthly" as Client["paymentType"],
    status: "active" as Client["status"],
    notes: "", testimonialReceived: false,
  })

  const activeClients = state.clients.filter(c => c.status === "active")
  const canAdd = state.clients.filter(c => c.status === "active").length < MAX_CLIENTS

  function resetForm() {
    setForm({ name: "", startDate: "", nextCall: "", tier: "foundation", paymentType: "monthly", status: "active", notes: "", testimonialReceived: false })
  }

  function startAdd() {
    resetForm()
    setEditId(null)
    setShowAdd(true)
  }

  function startEdit(c: Client) {
    setForm({ name: c.name, startDate: c.startDate, nextCall: c.nextCall, tier: c.tier, paymentType: c.paymentType, status: c.status, notes: c.notes, testimonialReceived: c.testimonialReceived })
    setEditId(c.id)
    setShowAdd(true)
  }

  function saveClient() {
    if (!form.name.trim()) return
    const fee = CLIENT_TIERS[form.tier]
    const t30 = form.startDate ? addDays(form.startDate, 30) : ""
    const t60 = form.startDate ? addDays(form.startDate, 60) : ""
    const t90 = form.startDate ? addDays(form.startDate, 90) : ""
    if (editId) {
      const existing = state.clients.find(c => c.id === editId)
      if (!existing) return
      onUpdateClient({ ...existing, ...form, monthlyFee: fee, testimonialDue30: t30, testimonialDue60: t60, testimonialDue90: t90 })
    } else {
      onAddClient({ id: uid(), ...form, monthlyFee: fee, testimonialDue30: t30, testimonialDue60: t60, testimonialDue90: t90 })
    }
    setShowAdd(false)
    setEditId(null)
    resetForm()
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Capacity bar */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <p style={{ fontFamily: F.heading, fontSize: 22, color: C.cream }}>{activeClients.length} / {MAX_CLIENTS} clients</p>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>
              ${clientMonthlyTotal(state.clients).toLocaleString()}/mo MRR
            </p>
          </div>
          {canAdd && <GoldBtn onClick={startAdd} small>+ Add Client</GoldBtn>}
          {!canAdd && <PillBadge label="Full" color={C.error} />}
        </div>
        <ProgressBar value={activeClients.length} max={MAX_CLIENTS} color={activeClients.length >= MAX_CLIENTS ? C.error : C.green} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {(["founding", "foundation", "premium", "elite"] as CoachingTier[]).map(tier => (
            <div key={tier} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <PillBadge label={`${tier} $${CLIENT_TIERS[tier]}`} color={tier === "elite" ? C.goldLight : tier === "premium" ? C.gold : tier === "foundation" ? C.blue : C.green} />
            </div>
          ))}
        </div>
      </Card>

      {/* Add / edit form */}
      {showAdd && (
        <Card style={{ borderColor: C.gold + "44" }}>
          <SectionTitle>{editId ? "Edit Client" : "New Client"}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Client name" />
            <Select
              value={form.tier}
              onChange={v => setForm(f => ({ ...f, tier: v as CoachingTier }))}
              options={[
                { label: "Founding — $350/mo", value: "founding" },
                { label: "Foundation — $500/mo", value: "foundation" },
                { label: "Premium — $700/mo", value: "premium" },
                { label: "Elite — $1,200/mo", value: "elite" },
              ]}
            />
            <Select
              value={form.paymentType}
              onChange={v => setForm(f => ({ ...f, paymentType: v as Client["paymentType"] }))}
              options={[
                { label: "Monthly", value: "monthly" },
                { label: "3-Month Prepay", value: "3month-prepay" },
                { label: "6-Month Prepay", value: "6month-prepay" },
              ]}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginBottom: 4 }}>Start date</p>
                <Input type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
              </div>
              <div>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginBottom: 4 }}>Next call</p>
                <Input type="date" value={form.nextCall} onChange={v => setForm(f => ({ ...f, nextCall: v }))} />
              </div>
            </div>
            <Select
              value={form.status}
              onChange={v => setForm(f => ({ ...f, status: v as Client["status"] }))}
              options={[
                { label: "Active", value: "active" },
                { label: "Paused", value: "paused" },
                { label: "Completed", value: "completed" },
              ]}
            />
            <Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notes" />
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.testimonialReceived}
                onChange={e => setForm(f => ({ ...f, testimonialReceived: e.target.checked }))}
              />
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight }}>Testimonial received</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <GoldBtn onClick={saveClient}>{editId ? "Update" : "Add"}</GoldBtn>
              <GhostBtn onClick={() => { setShowAdd(false); setEditId(null) }}>Cancel</GhostBtn>
            </div>
          </div>
        </Card>
      )}

      {/* Client list */}
      {state.clients.length === 0 && !showAdd && (
        <Card>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: "center" }}>No clients yet. Add your first client above.</p>
        </Card>
      )}

      {state.clients.map(c => {
        const tierColor = c.tier === "elite" ? C.goldLight : c.tier === "premium" ? C.gold : c.tier === "foundation" ? C.blue : C.green
        return (
          <Card key={c.id} style={{ opacity: c.status !== "active" ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <p style={{ fontFamily: F.heading, fontSize: 20, color: C.cream }}>{c.name}</p>
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <PillBadge label={c.tier} color={tierColor} />
                  <PillBadge label={`$${c.monthlyFee}/mo`} color={C.gold} />
                  <PillBadge label={c.status} color={c.status === "active" ? C.green : c.status === "paused" ? C.mutedLight : C.error} />
                </div>
              </div>
              <GhostBtn small onClick={() => startEdit(c)}>Edit</GhostBtn>
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
              {c.startDate && (
                <div>
                  <p style={{ fontFamily: F.body, fontSize: 10, color: C.muted }}>Started</p>
                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight }}>{formatDate(c.startDate)}</p>
                </div>
              )}
              {c.nextCall && (
                <div>
                  <p style={{ fontFamily: F.body, fontSize: 10, color: C.muted }}>Next call</p>
                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight }}>{formatDate(c.nextCall)}</p>
                </div>
              )}
              {c.paymentType && (
                <div>
                  <p style={{ fontFamily: F.body, fontSize: 10, color: C.muted }}>Payment</p>
                  <p style={{ fontFamily: F.body, fontSize: 12, color: C.mutedLight }}>{c.paymentType}</p>
                </div>
              )}
            </div>

            {/* Testimonial tracking */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {c.testimonialDue30 && (
                <div style={{ fontSize: 11, fontFamily: F.body, color: C.muted }}>30d due: {formatDate(c.testimonialDue30)}</div>
              )}
              {c.testimonialDue60 && (
                <div style={{ fontSize: 11, fontFamily: F.body, color: C.muted }}>60d due: {formatDate(c.testimonialDue60)}</div>
              )}
              {c.testimonialDue90 && (
                <div style={{ fontSize: 11, fontFamily: F.body, color: C.muted }}>90d due: {formatDate(c.testimonialDue90)}</div>
              )}
            </div>

            {c.testimonialReceived && <PillBadge label="Testimonial received" color={C.green} />}

            {c.notes && (
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted, fontStyle: "italic", marginTop: 8 }}>{c.notes}</p>
            )}

            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => onDeleteClient(c.id)}
                style={{ background: "transparent", border: "none", color: C.error + "88", fontSize: 11, fontFamily: F.body, cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Tab: Tasks ───────────────────────────────────────────────────────────────

function TasksTab({ state, onToggleTask }: { state: PlanState; onToggleTask: (id: string) => void }) {
  const currentWeek = getCurrentWeek(state.startDate)
  const [filterPhase, setFilterPhase] = useState<0 | 1 | 2 | 3>(0)
  const [filterCat, setFilterCat] = useState<Task["category"] | "all">("all")

  const filtered = TASKS.filter(t => {
    if (filterPhase !== 0 && t.phase !== filterPhase) return false
    if (filterCat !== "all" && t.category !== filterCat) return false
    return true
  })

  const completedCount = TASKS.filter(t => state.completedTasks[t.id]).length

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Progress */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.mutedLight }}>{completedCount} / {TASKS.length} tasks complete</p>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>Week {currentWeek}</p>
        </div>
        <ProgressBar value={completedCount} max={TASKS.length} />
      </Card>

      {/* Filters */}
      <Card>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {([0, 1, 2, 3] as const).map(p => (
            <button key={p} onClick={() => setFilterPhase(p)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: F.body, cursor: "pointer",
              background: filterPhase === p ? C.gold : "transparent",
              color: filterPhase === p ? C.bg : C.muted,
              border: `1px solid ${filterPhase === p ? C.gold : C.border}`,
            }}>
              {p === 0 ? "All" : `Phase ${p}`}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button onClick={() => setFilterCat("all")} style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: F.body, cursor: "pointer",
            background: filterCat === "all" ? C.gold : "transparent",
            color: filterCat === "all" ? C.bg : C.muted,
            border: `1px solid ${filterCat === "all" ? C.gold : C.border}`,
          }}>
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as Task["category"][]).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: F.body, cursor: "pointer",
              background: filterCat === cat ? CATEGORY_COLORS[cat] : "transparent",
              color: filterCat === cat ? C.bg : C.muted,
              border: `1px solid ${filterCat === cat ? CATEGORY_COLORS[cat] : C.border}`,
            }}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </Card>

      {/* Task list */}
      {(() => {
        const byWeek = filtered.reduce<Record<number, Task[]>>((acc, t) => {
          if (!acc[t.week]) acc[t.week] = []
          acc[t.week].push(t)
          return acc
        }, {})

        return Object.entries(byWeek)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([week, tasks]) => (
            <Card key={week}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontFamily: F.heading, fontSize: 17, color: parseInt(week) === currentWeek ? C.gold : C.cream }}>
                  Week {week}
                  {parseInt(week) === currentWeek && <span style={{ fontFamily: F.body, fontSize: 11, color: C.gold, marginLeft: 8 }}>← current</span>}
                </p>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>
                  {tasks.filter(t => state.completedTasks[t.id]).length}/{tasks.length}
                </p>
              </div>
              {tasks.map(t => {
                const done = !!state.completedTasks[t.id]
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => onToggleTask(t.id)}
                      style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        border: `2px solid ${done ? CATEGORY_COLORS[t.category] : C.border}`,
                        background: done ? CATEGORY_COLORS[t.category] + "33" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: done ? CATEGORY_COLORS[t.category] : C.muted, fontSize: 11,
                      }}
                    >
                      {done ? "✓" : ""}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.body, fontSize: 13, color: done ? C.muted : C.cream, textDecoration: done ? "line-through" : "none", lineHeight: 1.4 }}>
                        {t.text}
                      </p>
                      <PillBadge label={CATEGORY_LABELS[t.category]} color={CATEGORY_COLORS[t.category]} />
                    </div>
                  </div>
                )
              })}
            </Card>
          ))
      })()}
    </div>
  )
}

// ─── Tab: Ads ─────────────────────────────────────────────────────────────────

function AdsTab({ state, currentDay, onAddCampaign, onUpdateCampaign }: {
  state: PlanState
  currentDay: number
  onAddCampaign: (c: AdCampaign) => void
  onUpdateCampaign: (c: AdCampaign) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    platform: "tiktok" as Platform, startDate: "", budget: "", spent: "",
    impressions: "", clicks: "", conversions: "", notes: "",
  })

  if (currentDay < 91) {
    return (
      <div style={{ padding: "32px 16px" }}>
        <Card style={{ textAlign: "center" }}>
          <p style={{ fontFamily: F.heading, fontSize: 28, color: C.gold, marginBottom: 12 }}>✦</p>
          <p style={{ fontFamily: F.heading, fontSize: 22, color: C.cream, marginBottom: 8 }}>Ads unlock in Month 4</p>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
            After your founding clients deliver testimonials, you&apos;ll have social proof to make paid ads profitable.
            Focus on organic growth and coaching delivery for now.
          </p>
          <div style={{ background: C.bg, borderRadius: 8, padding: "12px 16px", display: "inline-block" }}>
            <p style={{ fontFamily: F.heading, fontSize: 20, color: C.gold }}>Day {currentDay} of 90</p>
            <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>{Math.max(0, 91 - currentDay)} days until Ads unlock</p>
          </div>
        </Card>
      </div>
    )
  }

  function addCampaign() {
    const budget = parseFloat(form.budget)
    if (!budget) return
    onAddCampaign({
      id: uid(),
      platform: form.platform,
      startDate: form.startDate,
      budget,
      spent: parseFloat(form.spent) || 0,
      impressions: parseInt(form.impressions) || 0,
      clicks: parseInt(form.clicks) || 0,
      conversions: parseInt(form.conversions) || 0,
      notes: form.notes,
    })
    setForm({ platform: "tiktok", startDate: "", budget: "", spent: "", impressions: "", clicks: "", conversions: "", notes: "" })
    setShowAdd(false)
  }

  const totalSpent = state.adCampaigns.reduce((acc, c) => acc + c.spent, 0)
  const totalConversions = state.adCampaigns.reduce((acc, c) => acc + c.conversions, 0)

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTitle>Ad Campaigns</SectionTitle>
          <GoldBtn small onClick={() => setShowAdd(s => !s)}>+ Campaign</GoldBtn>
        </div>
        <StatRow label="Total spent" value={`$${totalSpent.toLocaleString()}`} />
        <StatRow label="Total conversions" value={totalConversions} />
        {totalSpent > 0 && totalConversions > 0 && (
          <StatRow label="Cost per conversion" value={`$${(totalSpent / totalConversions).toFixed(2)}`} color={C.gold} />
        )}
      </Card>

      {showAdd && (
        <Card style={{ borderColor: C.gold + "44" }}>
          <SectionTitle>New Campaign</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Select
              value={form.platform}
              onChange={v => setForm(f => ({ ...f, platform: v as Platform }))}
              options={[
                { label: "TikTok Ads", value: "tiktok" },
                { label: "Instagram Ads", value: "instagram" },
              ]}
            />
            <div>
              <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginBottom: 4 }}>Start date</p>
              <Input type="date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input type="number" value={form.budget} onChange={v => setForm(f => ({ ...f, budget: v }))} placeholder="Budget ($)" />
              <Input type="number" value={form.spent} onChange={v => setForm(f => ({ ...f, spent: v }))} placeholder="Spent ($)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input type="number" value={form.impressions} onChange={v => setForm(f => ({ ...f, impressions: v }))} placeholder="Impressions" />
              <Input type="number" value={form.clicks} onChange={v => setForm(f => ({ ...f, clicks: v }))} placeholder="Clicks" />
              <Input type="number" value={form.conversions} onChange={v => setForm(f => ({ ...f, conversions: v }))} placeholder="Conversions" />
            </div>
            <Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notes" />
            <div style={{ display: "flex", gap: 8 }}>
              <GoldBtn onClick={addCampaign}>Add Campaign</GoldBtn>
              <GhostBtn onClick={() => setShowAdd(false)}>Cancel</GhostBtn>
            </div>
          </div>
        </Card>
      )}

      {state.adCampaigns.map(campaign => (
        <Card key={campaign.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <PillBadge label={platformEmoji(campaign.platform)} color={platformColor(campaign.platform)} />
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 4 }}>{campaign.startDate}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: F.heading, fontSize: 20, color: C.cream }}>${campaign.spent.toLocaleString()}</p>
              <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted }}>of ${campaign.budget.toLocaleString()} budget</p>
            </div>
          </div>
          <ProgressBar value={campaign.spent} max={campaign.budget} color={campaign.spent > campaign.budget ? C.error : C.gold} />
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            <StatRow label="Impressions" value={campaign.impressions.toLocaleString()} />
            <StatRow label="Clicks" value={campaign.clicks.toLocaleString()} />
            <StatRow label="Conversions" value={campaign.conversions} />
          </div>
          {campaign.notes && <p style={{ fontFamily: F.body, fontSize: 11, color: C.muted, marginTop: 8, fontStyle: "italic" }}>{campaign.notes}</p>}
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <GhostBtn small onClick={() => {
              const updated: AdCampaign = { ...campaign, spent: campaign.spent }
              onUpdateCampaign(updated)
            }}>Update</GhostBtn>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function PlanPageClient() {
  const [state, setState] = useState<PlanState>(defaultState)
  const [tab, setTab] = useState<Tab>("home")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  const persist = useCallback((next: PlanState) => {
    setState(next)
    saveState(next)
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSetStart = useCallback((d: string) => {
    persist({ ...state, startDate: d })
  }, [state, persist])

  const handleToggleTask = useCallback((id: string) => {
    persist({ ...state, completedTasks: { ...state.completedTasks, [id]: !state.completedTasks[id] } })
  }, [state, persist])

  const handleToggleBatch = useCallback((batch: number) => {
    persist({ ...state, filmedBatches: { ...state.filmedBatches, [batch]: !state.filmedBatches[batch] } })
  }, [state, persist])

  const handleTogglePostStatus = useCallback((postId: string) => {
    const current = state.postStatuses[postId]
    const next: PostStatus = current === "scheduled" || !current ? "posted" : current === "posted" ? "skipped" : "scheduled"
    persist({ ...state, postStatuses: { ...state.postStatuses, [postId]: next } })
  }, [state, persist])

  const handleLogPerformance = useCallback((perf: PostPerformance) => {
    const existing = state.performance.filter(p => p.postId !== perf.postId)
    persist({ ...state, performance: [...existing, perf] })
  }, [state, persist])

  const handleUpdateMetrics = useCallback((m: Metrics) => {
    persist({ ...state, metrics: m })
  }, [state, persist])

  const handleAddSale = useCallback((sale: SaleEntry) => {
    persist({ ...state, sales: [...state.sales, sale] })
  }, [state, persist])

  const handleDeleteSale = useCallback((id: string) => {
    persist({ ...state, sales: state.sales.filter(s => s.id !== id) })
  }, [state, persist])

  const handleAddClient = useCallback((c: Client) => {
    persist({ ...state, clients: [...state.clients, c] })
  }, [state, persist])

  const handleUpdateClient = useCallback((c: Client) => {
    persist({ ...state, clients: state.clients.map(x => x.id === c.id ? c : x) })
  }, [state, persist])

  const handleDeleteClient = useCallback((id: string) => {
    persist({ ...state, clients: state.clients.filter(c => c.id !== id) })
  }, [state, persist])

  const handleAddCampaign = useCallback((c: AdCampaign) => {
    persist({ ...state, adCampaigns: [...state.adCampaigns, c] })
  }, [state, persist])

  const handleUpdateCampaign = useCallback((c: AdCampaign) => {
    persist({ ...state, adCampaigns: state.adCampaigns.map(x => x.id === c.id ? c : x) })
  }, [state, persist])

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: F.heading, fontSize: 18, color: C.muted }}>Loading…</p>
      </div>
    )
  }

  const currentDay = getCurrentDay(state.startDate)

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", maxWidth: 640, margin: "0 auto" }}>
      {/* Top nav */}
      <div style={{ borderBottom: `1px solid ${C.border}`, flexShrink: 0, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {TABS.map(({ id, icon, label }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "12px 18px",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
                  color: active ? C.gold : C.muted,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontFamily: F.body, fontSize: 10, letterSpacing: "0.08em" }}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "home" && <HomeTab state={state} onSetStart={handleSetStart} />}
        {tab === "film" && <FilmTab state={state} onToggleBatch={handleToggleBatch} />}
        {tab === "post" && <PostTab state={state} onToggleStatus={handleTogglePostStatus} onLogPerformance={handleLogPerformance} />}
        {tab === "stats" && <StatsTab state={state} onUpdateMetrics={handleUpdateMetrics} />}
        {tab === "sales" && <SalesTab state={state} onAddSale={handleAddSale} onDeleteSale={handleDeleteSale} />}
        {tab === "clients" && <ClientsTab state={state} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />}
        {tab === "tasks" && <TasksTab state={state} onToggleTask={handleToggleTask} />}
        {tab === "ads" && <AdsTab state={state} currentDay={currentDay} onAddCampaign={handleAddCampaign} onUpdateCampaign={handleUpdateCampaign} />}
      </div>
    </div>
  )
}
