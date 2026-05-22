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
      "A 4-week training system for beginners, returners, and anyone who wants to rebuild their strength the right way. Learn proper form, follow a structured program, track your weights, reps, and progress, and finally understand what actually changes your body. No random workouts. No ego lifting. Just smart training built to last.",
    homeStoryHeadline: "I did it the hard way.\nYou don't have to.",
    homeStoryPara1:
      "I spent years doing fitness classes before I ever touched a barbell. Cardio, cycling, group workouts. I was consistent, I worked hard, but I wasn't actually building anything. I was burning calories without changing my body. My strength wasn't improving. My shape wasn't improving. Everything changed when I finally started following a real strength training program.",
    homeStoryPara2:
      "Then I made the mistake a lot of people make once they start seeing progress. I focused on pushing harder instead of building a proper foundation first. Warm-ups and mobility work felt optional. I was lifting heavier, but my body wasn't prepared to support it. Eventually my back had enough. For almost a year, I dealt with serious pain. And that year forced me to relearn everything I thought I understood about training. Not just exercises, but movement quality, stability, recovery, proper progression, and the fundamentals most people skip until their body forces them to pay attention.",
    homeStoryPara3:
      "I rebuilt from the ground up, became a certified personal trainer, and came back stronger than before. This course is the system I wish I had from the beginning. The structure, movement education, warm-up protocols, progression, workout tracking, nutrition foundations, and training principles that actually matter if you want a strong body that lasts.",
    homeStoryQuote: "The goal isn't just to look strong. It's to build a body that lasts.",
    homeFinalHeadline: "Stronger. Smarter. Built to last.",
    homeFinalSubtext:
      "Structured workouts, guided exercise instruction, built-in tracking, and the foundations most people never learn.",
    coursePrice: "47",
    aboutHeroHeadline: "Spent years burning calories\nwithout building strength or the body I wanted.\nThen I found structure.",
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
    coachingHeroHeadline: "Train directly\nwith me.",
    coachingHeroSubtext:
      "1:1 coaching for people who want more than a template. Personalized programming built around your goals, your schedule, and where you actually are — not where a random plan assumes you are.",
    coachingFeature1Title: "Custom programming",
    coachingFeature1Body:
      "A program built specifically for your goals, equipment, and schedule. Updated every month based on your progress.",
    coachingFeature2Title: "Form review & feedback",
    coachingFeature2Body:
      "Send me videos of your lifts. I'll review your technique and give you specific cues to improve — not just generic notes.",
    coachingFeature3Title: "Check-ins & adjustments",
    coachingFeature3Body:
      "Weekly check-ins so we can adjust what's not working before it becomes a problem. No waiting four weeks to find out.",
    coachingFeature4Title: "Direct access to me",
    coachingFeature4Body:
      "Questions between sessions? Message me directly. I'm not handing you off to an algorithm or an automated response.",
    coachingFormHeadline: "Tell me a bit about yourself.",
    coachingFormSubtext:
      "I take on a limited number of coaching clients so I can give everyone real attention. Fill out the form and I'll get back to you within 48 hours.",
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
