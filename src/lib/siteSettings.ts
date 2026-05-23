export type SiteSettings = {
  crops: {
    hero: string
    about_bio: string
    banner: string
  }
  typography: {
    headingScale: number
    bodyScale: number
  }
  colors: {
    accent: string
  }
  text: {
    homeHeroHeadline: string
    homeHeroSubtext: string
    homeStoryHeadline: string
    homeStoryPara1: string
    homeStoryPara2: string
    homeStoryPara3: string
    homeStoryQuote: string
    homeFinalHeadline: string
    homeFinalSubtext: string
    coursePrice: string
    aboutHeroHeadline: string
    aboutHeroSubtext: string
    aboutPara1: string
    aboutPara2: string
    aboutPara3: string
    aboutPara4: string
    aboutPara5: string
    aboutQuote: string
    aboutCred1Label: string
    aboutCred1Body: string
    aboutCred2Label: string
    aboutCred2Body: string
    aboutCred3Label: string
    aboutCred3Body: string
    coursesHeroHeadline: string
    coursesHeroSubtext: string
    mod1Title: string
    mod1Desc: string
    mod2Title: string
    mod2Desc: string
    mod3Title: string
    mod3Desc: string
    mod4Title: string
    mod4Desc: string
    coursesFinalHeadline: string
    coachingHeroHeadline: string
    coachingHeroSubtext: string
    coachingFeature1Title: string
    coachingFeature1Body: string
    coachingFeature2Title: string
    coachingFeature2Body: string
    coachingFeature3Title: string
    coachingFeature3Body: string
    coachingFeature4Title: string
    coachingFeature4Body: string
    coachingFormHeadline: string
    coachingFormSubtext: string
    footerTagline: string
  }
}

export const DEFAULTS: SiteSettings = {
  crops: {
    hero: "center 15%",
    about_bio: "center 8%",
    banner: "center 30%",
  },
  typography: {
    headingScale: 1.0,
    bodyScale: 1.0,
  },
  colors: {
    accent: "#c8a97e",
  },
  text: {
    homeHeroHeadline: "Most people don't need a harder workout.\nThey need a better foundation.",
    homeHeroSubtext:
      "A 4-week training system for beginners, returners, and anyone who wants to rebuild their strength the right way. Learn proper form, follow a structured program, track your workouts and progress, and finally understand what actually changes your body. Designed to teach you how to progressively overload correctly so you can continue building strength long after the first four weeks are over. No random workouts. No ego lifting. Just intelligent training built to last.",
    homeStoryHeadline: "I did it the hard way.\nYou don't have to.",
    homeStoryPara1:
      "I spent years training hard without actually building strength or changing my body. Everything changed when I finally discovered structure, progressive overload, and proper programming.",
    homeStoryPara2:
      "Then my back injury forced me to relearn everything I thought I understood about fitness. Movement quality, stability, recovery, progression. The fundamentals most people skip until their body forces them to pay attention.",
    homeStoryPara3:
      "This course is the system I wish I had from the beginning. The structure, movement education, warm-ups, progression, workout tracking, and training principles that actually matter if you want a strong body that lasts.",
    homeStoryQuote: "The goal isn't just to look strong. It's to build a body that lasts.",
    homeFinalHeadline: "Stronger. Smarter. Built to last.",
    homeFinalSubtext:
      "Structured workouts, guided exercise instruction, built-in tracking, and the foundations most people never learn.",
    coursePrice: "47",
    aboutHeroHeadline: "Spent years burning calories without building strength or the body I wanted. Then I found structure.",
    aboutHeroSubtext:
      "Double master's in engineering. Certified personal trainer. Years of trial and error, injury, rebuilding, and relearning what actually matters in strength training. My background taught me to think in systems and structure, which completely changed the way I approach fitness. Now I help people build strong, aesthetic bodies through movement quality, intelligent programming, and training that lasts.",
    aboutPara1:
      "I grew up in France, got two master's degrees in engineering — one in France, one in Canada in renewable energy and energy efficiency — and spent most of my twenties building a career, not a body. When I moved to Australia and started my own business, I found the gym for the first time. Classes, cardio, group workouts. I was consistent, I worked hard, and I went nowhere. Years of effort without anything to show for it.",
    aboutPara2:
      "The move that changed everything was coming to the United States. Seven years ago I landed in Miami, started taking strength training seriously for the first time, and within months I finally understood what I'd been missing. Structure. Progressive overload. Real programming. My body started changing in a way it never had before. I was building something — and I got addicted.",
    aboutPara3:
      "I kept adding weight before I had the foundation to support it. Warm-ups felt like a waste of time. Mobility work wasn't on my radar. I knew the movements, but I was skipping the preparation that makes heavier loads safe. Eventually my back gave out. For almost a year I lived with serious pain — the kind that makes getting out of bed uncomfortable and the gym feel completely out of reach. That year was one of the hardest things I've been through, not just physically but mentally. Having to slow down, relearn movements I thought I already knew, and accept that the way I'd been approaching everything needed to change — that wasn't easy.",
    aboutPara4:
      "I rebuilt everything. Movement mechanics, warm-up protocols, mobility, real programming logic. I became a certified personal trainer not because it was a career plan — my plan had always been engineering — but because I needed to genuinely understand what I'd been skipping. I came back pain-free and stronger than I had ever been. And I realized the foundation I'd had to find the hard way was something I could hand to other people.",
    aboutPara5:
      "Lisa Fit Method exists because that foundation should have been the starting point. I'm an engineer by training — I think in systems and structures. That's how I approach programming: the warm-up, the movements, the progression, the recovery. Everything connects. Whether you're brand new to the gym or you've been winging it for years, this is what I wish someone had handed me.",
    aboutQuote: "The fundamentals aren't optional. They're the whole game.",
    aboutCred1Label: "Certified & Evidence-Based",
    aboutCred1Body:
      "Formally trained in movement, programming, and corrective exercise. My background in engineering taught me to approach fitness through systems, structure, and intelligent progression.",
    aboutCred2Label: "Rebuilt Through Injury",
    aboutCred2Body:
      "I didn't just study this. I had to rebuild my own body after serious back pain. I know what it feels like when training stops working — and what it takes to come back stronger.",
    aboutCred3Label: "Real-World Coaching",
    aboutCred3Body:
      "No gimmicks. No random workouts. Just intelligent training focused on movement quality, long-term progress, and building a body that actually lasts.",
    coursesHeroHeadline: "Training Foundations",
    coursesHeroSubtext:
      "A 4-week beginner program built around the movements, habits, and structure that actually create results — and keep you training for life.",
    mod1Title: "Foundation Movements",
    mod1Desc:
      "The five movement patterns every lifter needs before adding weight or complexity. Skip this and everything else becomes harder and more dangerous.",
    mod2Title: "Core & Glute Priority",
    mod2Desc:
      "Targeted training for the muscles most responsible for lower back health, posture, and strength. This is the work most programs skip.",
    mod3Title: "The 4-Week Program",
    mod3Desc:
      "Three days a week. Warm-ups, working sets, and cool-downs. Every session structured with intent. Weeks 3 and 4 include progressive overload built in.",
    mod4Title: "Nutrition Foundations",
    mod4Desc:
      "Five principles that support everything you do in the gym without obsessing over food or following a complicated diet.",
    coursesFinalHeadline: "Build the foundation.\nTrain for life.",
    coachingHeroHeadline: "Coaching built around you.",
    coachingHeroSubtext:
      "Coaching is designed for people serious about building strength, improving movement quality, and creating long-term results. I keep coaching intentionally limited so every client gets real attention, detailed feedback, and programming that evolves as they progress. Fill out the form below and I'll personally review your application.",
    coachingFeature1Title: "Custom programming",
    coachingFeature1Body:
      "Training built specifically for your goals, experience level, schedule, equipment, and recovery capacity. Updated as you progress so your body keeps adapting instead of plateauing.",
    coachingFeature2Title: "Form review & feedback",
    coachingFeature2Body:
      "Send me videos of your lifts and I'll break down your technique with detailed cues and corrections so you understand not just what to change, but why.",
    coachingFeature3Title: "Check-ins & adjustments",
    coachingFeature3Body:
      "Weekly check-ins to adjust your training, recovery, workload, or nutrition before small issues become setbacks. Real coaching means adapting as your body evolves.",
    coachingFeature4Title: "Direct access to me",
    coachingFeature4Body:
      "Questions between check-ins? Message me directly. No outsourced coaching or automated replies — just real guidance when you need it.",
    coachingFormHeadline: "Tell me about your goals.",
    coachingFormSubtext:
      "I keep coaching intentionally limited so every client gets real attention, detailed feedback, and programming built specifically around them. Fill out the form below and I'll personally review your application within 48 hours. No commitment required to apply.",
    footerTagline:
      "Strength training built on movement quality, real structure, and a body that lasts.",
  },
}

const S3_SETTINGS_URL =
  "https://amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov.s3.us-east-2.amazonaws.com/media/settings.json"

export { S3_SETTINGS_URL }

function deepMerge<T extends object>(base: T, override: unknown): T {
  if (typeof override !== "object" || override === null) return base
  const result = { ...base }
  for (const key of Object.keys(override as object)) {
    const k = key as keyof T
    const overrideVal = (override as Record<string, unknown>)[key]
    if (overrideVal !== undefined && overrideVal !== null) {
      if (
        typeof base[k] === "object" &&
        !Array.isArray(base[k]) &&
        typeof overrideVal === "object" &&
        !Array.isArray(overrideVal)
      ) {
        result[k] = deepMerge(base[k] as object, overrideVal) as T[keyof T]
      } else {
        result[k] = overrideVal as T[keyof T]
      }
    }
  }
  return result
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(S3_SETTINGS_URL, { next: { revalidate: 60 } })
    if (!res.ok) return DEFAULTS
    const json: unknown = await res.json()
    return deepMerge(DEFAULTS, json)
  } catch {
    return DEFAULTS
  }
}
