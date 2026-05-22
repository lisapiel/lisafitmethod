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
    homeStoryHeadline: "I did it the long way.\nYou don't have to.",
    homeStoryPara1:
      "I spent years in fitness classes before I ever touched a barbell. Cardio, cycling, group workouts — I was consistent, I was working hard, but I wasn't building anything. I was burning calories without changing my body. My strength didn't improve. My shape didn't improve. Things only changed when I started following a real strength training plan.",
    homeStoryPara2:
      "I finally started making real progress — and I got ahead of myself. I kept pushing the weight without building the foundation to support it. Warm-ups were rushed. Mobility work wasn't something I took seriously. Eventually my back had enough. For almost a year I dealt with serious pain. That year forced me to actually learn what I'd been skipping.",
    homeStoryPara3:
      "I became a certified personal trainer, rebuilt from the ground up, and came back stronger than before. This guide is that foundation — the structure, the warm-up protocols, the movement knowledge I wish I'd had from day one.",
    homeStoryQuote: "You don't need to learn the hard way. That's already been done.",
    homeFinalHeadline: "Build the foundation.\nTrain for life.",
    homeFinalSubtext:
      "Four weeks. Three days a week. Everything you need to actually understand how to train and a body that shows it.",
    coursePrice: "47",
    aboutHeroHeadline: "I spent years burning calories without building anything. Then I found structure.",
    aboutHeroSubtext:
      "Certified personal trainer. Found strength training after years of classes that never changed my body. Learned the foundation the hard way — now here to give it to you straight.",
    aboutPara1:
      "I started where a lot of people start — scared of the weight room, sticking to what felt safe. Classes, cardio, group workouts. I was consistent and I was working hard. But I was burning calories, not building anything. My body wasn't changing the way I wanted it to. My strength wasn't increasing. The gym felt like maintenance, not progress.",
    aboutPara2:
      "It wasn't until I started following a real structured strength training program that things actually shifted. For the first time, I was building something. The squat got stronger week over week. I could feel my body actually changing. It was addictive — and I pushed it too hard, too fast.",
    aboutPara3:
      "I kept adding weight before I had the foundation to support it. Warm-ups felt like a waste of time. Mobility work wasn't on my radar. I knew the movements, but I was skipping the preparation that makes heavier loads safe. Eventually my back gave out. For almost a year I lived with serious pain — the kind that makes getting out of bed uncomfortable and the gym feel completely out of reach. That year was one of the hardest things I've been through, not just physically but mentally. I had built my identity around training, and suddenly I couldn't do it. Having to slow down, relearn movements I thought I already knew, and accept that the way I'd been approaching everything needed to change — that wasn't easy.",
    aboutPara4:
      "That year I rebuilt everything properly. Movement mechanics, warm-up protocols, mobility, real programming logic. I became a certified personal trainer not to teach what I was doing before, but to genuinely understand what I'd been skipping. I came back pain-free and stronger than I had ever been.",
    aboutPara5:
      "Lisa Fit Method exists because that foundation — the stuff I had to learn the hard way — should have been the starting point. Not something I figured out after a year of pain. Whether you're brand new to the gym or you've been winging it for years, this is what I wish someone had handed me.",
    aboutQuote: "The fundamentals aren't optional. They're the whole game.",
    aboutCred1Label: "Certified Personal Trainer",
    aboutCred1Body:
      "Formally trained in movement, programming, and corrective exercise. I know the science and I live the practice.",
    aboutCred2Label: "Built from scratch",
    aboutCred2Body:
      "Not just study — I rebuilt my own body after a serious injury. I know what it takes to train when things go wrong.",
    aboutCred3Label: "@lisafitmethod",
    aboutCred3Body:
      "Building a community of people who train smart, not just hard. Real content, real movement, no gimmicks.",
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
      "A real foundation for anyone who wants to train smart, move well, and build a body that lasts.",
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
