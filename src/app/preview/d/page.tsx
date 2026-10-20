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
import { StoryD } from "@/components/preview/d/StoryD"
import { CoursesD } from "@/components/preview/d/CoursesD"
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
        {/* Dark: the opening. */}
        <HeroD trailerSrc={trailerSrc} posterSrc={derivePosterUrl(trailerSrc)} />

        {/* Into the light, and it stays there for most of the page. The hero
            already carries both pathways, both buttons and both prices, so
            the page goes straight from it into the story. */}
        <ToneShift from={BLACK} to={WARM_WHITE} />
        <StoryD
          portraitUrl={heroPhotoUrl ?? portraitUrl}
          portraitCrop={heroPhotoUrl ? "center 35%" : settings.crops.about_bio}
        />
        <CoursesD coursePrice={coursePrice} movementUrls={orderedReel} />

        {/* Dark from here to the end of the offer: the gradient, the banner
            and the bundle run together with no light band between them. */}
        <ToneShift from={WARM_WHITE} to={BLACK} />
        {bannerUrl && (
          <PhotoBand
            src={bannerUrl}
            alt="Lisa Fit Method"
            objectPosition={settings.crops.banner}
            tone="dark"
            aspect="3 / 1"
          />
        )}
        <BundleD coursePrice={coursePrice} />

        {/* Light again for the clients and the questions. */}
        <ToneShift from={BLACK} to={WARM_WHITE} />
        <TestimonialsD />
        <FaqD />

        {/* Dark: the closing ask. */}
        <ToneShift from={OFF_WHITE} to={BLACK} />
        <FinalCtaD />

        {/* And out on paper. */}
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
