import type { Metadata } from "next"
import {
  getPublishedPhotoUrl,
  getPublishedVideoUrl,
  getPublishedVideoUrls,
  heroTrailerUrl,
  derivePosterUrl,
} from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import FreeGuideTeaser from "@/components/FreeGuideTeaser.client"
import PreviewBar from "@/components/preview/PreviewBar.client"
import { StylesD } from "@/components/preview/d/StylesD"
import { ToneShift, PhotoBand } from "@/components/preview/d/FlowD"
import NavD from "@/components/preview/d/NavD.client"
import HeroD from "@/components/preview/d/HeroD.client"
import { StatementD } from "@/components/preview/d/StatementD"
import { StoryD } from "@/components/preview/d/StoryD"
import { CoursesD } from "@/components/preview/d/CoursesD"
import { CoachingD } from "@/components/preview/d/CoachingD"
import { BundleD } from "@/components/preview/d/BundleD"
import { TestimonialsD } from "@/components/preview/d/TestimonialsD"
import FaqD from "@/components/preview/d/FaqD.client"
import { FinalCtaD, FooterD } from "@/components/preview/d/ClosingD"

export const revalidate = 60

// noindex: internal design prototype sharing the live app. Never indexed.
export const metadata: Metadata = {
  title: "Direction D — Redesign Prototype",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BLACK = "#0a0a0a"
const WARM_WHITE = "#faf8f5"
const OFF_WHITE = "#f5f2ee"

// Supporting backdrops supplied by Lisa. Used sparingly and heavily washed:
// her own photographs stay the subject everywhere on the page.
const BG_LIGHT = "/preview/bg-light.jpg"
const BG_STUDIO = "/preview/bg-studio.jpg"
const BG_DUMBBELLS = "/preview/bg-dumbbells.jpg"
const BG_ARCH = "/preview/bg-arch.jpg"
const BG_LIGHT_2 = "/preview/bg-light-2.jpg"
const BG_DARK = "/preview/bg-dark.jpg"
const BG_DARK_2 = "/preview/bg-dark-2.jpg"

// Lisa's own images already in the repo, used as foreground photography.
const LISA_FLEX = "/lisa-coaching-hero.jpg"

const REEL_SLOTS = [
  "m1_goblet_squat",
  "m1_hip_hinge",
  "m2_rdl",
  "m1_db_row",
  "m1_db_bench_press",
  "m2_hip_thrust",
]

export default async function PreviewDirectionDPage() {
  const [heroPhotoUrl, bannerUrl, portraitUrl, trailerUrl, reelUrls, settings] = await Promise.all([
    getPublishedPhotoUrl("hero"),
    getPublishedPhotoUrl("banner"),
    getPublishedPhotoUrl("about_bio"),
    getPublishedVideoUrl("lp_trailer"),
    getPublishedVideoUrls(REEL_SLOTS),
    fetchSiteSettings(),
  ])

  const trailerSrc = heroTrailerUrl(trailerUrl)
  const coursePrice = settings.text.coursePrice
  const orderedReel = REEL_SLOTS.map((slot) => reelUrls[slot]).filter(Boolean)

  return (
    <div className="pv-d">
      <StylesD />
      <NavD />

      <main>
        {/* 1. Hero — film, headline, both routes, both prices. */}
        <HeroD trailerSrc={trailerSrc} posterSrc={derivePosterUrl(trailerSrc)} />

        {/* 2. Lisa's statement — the single personal note on the page. */}
        <ToneShift from={BLACK} to={WARM_WHITE} />
        <StatementD backdrop={BG_STUDIO} />

        {/* 3. Why this exists — her story and her first portrait. */}
        <StoryD
          portraitUrl={heroPhotoUrl ?? portraitUrl}
          portraitCrop={heroPhotoUrl ? "center 35%" : settings.crops.about_bio}
          backdrop={BG_LIGHT}
        />

        {/* 4. The courses — two sheets, then the movement reel, then the
            bundle. The reel is full bleed and runs straight into the dark,
            so it carries the transition instead of needing one. */}
        <CoursesD coursePrice={coursePrice} movementUrls={orderedReel} backdrop={BG_DUMBBELLS} />
        <BundleD coursePrice={coursePrice} portraitUrl={LISA_FLEX} backdrop={BG_DARK_2} />

        {/* 5. The banner, still on the dark run. */}
        {bannerUrl && (
          <PhotoBand
            src={bannerUrl}
            alt="Lisa Fit Method"
            objectPosition={settings.crops.banner}
            tone="dark"
            aspect="3 / 1"
          />
        )}

        {/* 6. 1:1 Coaching — what working with her actually involves. */}
        <ToneShift from={BLACK} to={OFF_WHITE} />
        <CoachingD portraitUrl={portraitUrl ?? "/lisa-coaching-about.jpg"} backdrop={BG_ARCH} />

        {/* 7. Real results, 8. Common questions. */}
        <TestimonialsD backdrop={BG_LIGHT_2} />
        <FaqD />

        {/* 9. Ready to start. */}
        <ToneShift from={OFF_WHITE} to={BLACK} />
        <FinalCtaD backdrop={BG_DARK} />

        {/* 10. Free guides, then the footer. */}
        <ToneShift from={BLACK} to={WARM_WHITE} />
        <div data-tone="light">
          <FreeGuideTeaser />
        </div>
      </main>

      <FooterD />
      <PreviewBar current="d" tone="dark" />
    </div>
  )
}
