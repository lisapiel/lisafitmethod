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
import { TestimonialsSection } from "@/components/TestimonialsSection"
import PreviewBar from "@/components/preview/PreviewBar.client"
import { StylesC } from "@/components/preview/c/StylesC"
import { ToneShift } from "@/components/preview/c/ToneShift"
import NavC from "@/components/preview/c/NavC.client"
import HeroC from "@/components/preview/c/HeroC.client"
import { PathC, PhotoBandC } from "@/components/preview/c/PathC"
import { StoryC } from "@/components/preview/c/StoryC"
import { CoursesC } from "@/components/preview/c/CoursesC"
import { BundleC } from "@/components/preview/c/BundleC"
import FaqC from "@/components/preview/c/FaqC.client"
import { FinalCtaC, FooterC } from "@/components/preview/c/FinalCtaC"

export const revalidate = 60

// noindex: internal design prototype sharing the live app. Never indexed.
export const metadata: Metadata = {
  title: "Direction C · Combined — Redesign Prototype",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BLACK = "#0a0a0a"
const WARM_WHITE = "#faf8f5"
const OFF_WHITE = "#f5f2ee"

// Eight clips from the published movement library, shown silently under the
// courses as evidence for the "50+ exercise videos" the card already claims.
const REEL_SLOTS = [
  "m1_goblet_squat",
  "m1_hip_hinge",
  "m2_rdl",
  "m1_db_row",
  "m1_db_bench_press",
  "m2_hip_thrust",
]

export default async function PreviewDirectionCPage() {
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
    <div className="pv-c">
      <StylesC />
      <NavC />

      <main>
        {/* Night: the hero and the choice it opens with. */}
        <HeroC trailerSrc={trailerSrc} posterSrc={derivePosterUrl(trailerSrc)} />
        <PathC />
        {heroPhotoUrl && <PhotoBandC src={heroPhotoUrl} objectPosition={settings.crops.hero} />}

        {/* Night into day — the page opens up for the reading. */}
        <ToneShift from={BLACK} to={WARM_WHITE} />
        <StoryC portraitUrl={portraitUrl} portraitCrop={settings.crops.about_bio} />

        {bannerUrl && <PhotoBandC src={bannerUrl} objectPosition={settings.crops.banner} />}

        <ToneShift from={BLACK} to={WARM_WHITE} rule={false} />
        <CoursesC coursePrice={coursePrice} movementUrls={orderedReel} />

        {/* Back to night for the offer. */}
        <ToneShift from={WARM_WHITE} to={BLACK} />
        <BundleC coursePrice={coursePrice} />

        {/* Day again for the questions. Renders only when testimonials are
            published; production currently has none, so this is dormant. */}
        <ToneShift from={BLACK} to={OFF_WHITE} />
        <div data-tone="light">
          <TestimonialsSection />
        </div>
        <FaqC />

        {/* Final night beat, then the guides close on paper. */}
        <ToneShift from={OFF_WHITE} to={BLACK} />
        <FinalCtaC />
        <ToneShift from={BLACK} to={WARM_WHITE} />
        <div data-tone="light">
          <FreeGuideTeaser />
        </div>
      </main>

      <FooterC />
      <PreviewBar current="c" tone="dark" />
    </div>
  )
}
