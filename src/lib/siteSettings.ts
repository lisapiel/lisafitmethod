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
    homeHeroHeadline: "Stop guessing.\nStart training\nthe right way.",
    homeHeroSubtext:
      "A 4-week beginner program built around what actually matters. Proper movement, a real foundation, and a body built to last. No random workouts. No ego lifting. Just the method that changed everything for me.",
    homeStoryHeadline: "I learned the hard way.\nYou don't have to.",
    homeStoryPara1:
      "A few years ago I was training consistently and doing everything I thought was right. I wasn't. I was skipping warm-ups, ignoring mobility, following random programs with no structure. I thought pushing more weight was the path to results.",
    homeStoryPara2:
      "Then my back gave out. For almost a year I lived with serious pain. That year taught me more about training than all the years before it combined. I became a certified personal trainer because I needed to actually understand what I'd been doing wrong.",
    homeStoryPara3:
      "This guide is everything I wish someone had handed me before I started. The movements, structure, and habits that would have saved me a year of pain.",
    homeStoryQuote: "You don't need to learn the hard way. That's already been done.",
    homeFinalHeadline: "Build the foundation.\nTrain for life.",
    homeFinalSubtext:
      "Four weeks. Three days a week. Everything you need to actually understand how to train and a body that shows it.",
    coursePrice: "47",
    aboutHeroHeadline: "I trained wrong for years.\nThen my back gave out.",
    aboutHeroSubtext:
      "Certified personal trainer. Back from the worst training injury of my life. Now building the foundation I wish I'd had from the start.",
    aboutPara1:
      "For years I was training consistently and doing what I thought was right. I wasn't. I was skipping warm-ups, ignoring mobility work, and jumping between random programs that had no real structure. I pushed heavier weights thinking that was the path to results.",
    aboutPara2:
      "Then my back gave out. Not from one bad lift — from years of ignoring the fundamentals. For almost a year I lived with serious back pain. Getting off the couch was uncomfortable. The gym felt like something I might never go back to. That year changed everything.",
    aboutPara3:
      "I became a certified personal trainer because I needed to actually understand what I'd been doing wrong. Not just fix it — understand it. I rebuilt my body from scratch, this time with the right foundation: mobility, movement patterns, progressive structure, and real recovery.",
    aboutPara4:
      "I came back stronger than I'd ever been. Pain-free. And I've stayed that way. Not because I found some secret — because I finally stopped skipping the basics.",
    aboutPara5:
      "Lisa Fit Method exists because I don't want you to spend a year learning what I learned the hard way. The movements, the structure, the habits — everything that would have changed my trajectory if I'd had it from the beginning.",
    aboutQuote: "The fundamentals aren't optional. They're the whole game.",
    aboutCred1Label: "Certified Personal Trainer",
    aboutCred1Body:
      "Formally trained in movement, programming, and corrective exercise. I know the science and I live the practice.",
    aboutCred2Label: "Built from scratch",
    aboutCred2Body:
      "Not just study — I rebuilt my own body after a serious injury. I know what it takes to train when things go wrong.",
    aboutCred3Label: "@lisafitmethod",
    aboutCred3Body:
      "Building a community of women who train smart, not just hard. Real content, real movement, no gimmicks.",
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
      "1:1 coaching for women who want more than a template. Personalized programming built around your goals, your schedule, and where you actually are — not where a random plan assumes you are.",
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
      "A real foundation for women who want to train smart, move well, and build a body that lasts.",
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
