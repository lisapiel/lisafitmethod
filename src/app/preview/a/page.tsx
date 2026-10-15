import type { Metadata } from "next"
import {
  getPublishedPhotoUrl,
  getPublishedVideoUrl,
  getPublishedVideoUrls,
  heroTrailerUrl,
  derivePosterUrl,
} from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import PreviewBar from "@/components/preview/PreviewBar.client"
import { StylesA } from "@/components/preview/a/StylesA"
import NavA from "@/components/preview/a/NavA.client"
import HeroA from "@/components/preview/a/HeroA.client"
import MarqueeA from "@/components/preview/a/MarqueeA.client"
import { StoryA } from "@/components/preview/a/StoryA"
import { InsideA } from "@/components/preview/a/InsideA"
import { CoursesA, BundleA } from "@/components/preview/a/CoursesA"
import { CoachingA } from "@/components/preview/a/CoachingA"
import { TestimonialsA } from "@/components/preview/a/TestimonialsA"
import FaqA from "@/components/preview/a/FaqA.client"
import { ClosingA, FooterA } from "@/components/preview/a/ClosingA"
import { MOVEMENT_SHOWCASE, TESTIMONIALS } from "@/components/preview/previewContent"

export const revalidate = 60

// noindex: this is an internal design prototype living on the same app as the
// live site. It must never be indexed or shared as a public page.
export const metadata: Metadata = {
  title: "Direction A · Atelier — Redesign Prototype",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

export default async function PreviewDirectionAPage() {
  const testimonialSlots = TESTIMONIALS.map((t) => t.videoSlot).filter(Boolean)

  const [portraitUrl, trailerUrl, movementUrls, testimonialUrls, settings] = await Promise.all([
    getPublishedPhotoUrl("about_bio"),
    getPublishedVideoUrl("lp_trailer"),
    getPublishedVideoUrls(MOVEMENT_SHOWCASE.map((m) => m.slot)),
    getPublishedVideoUrls(testimonialSlots),
    fetchSiteSettings(),
  ])

  const trailerSrc = heroTrailerUrl(trailerUrl)

  return (
    <>
      <StylesA />
      <NavA />
      <main style={{ background: "#f7f4ef", color: "#121110" }}>
        <HeroA trailerSrc={trailerSrc} posterSrc={derivePosterUrl(trailerSrc)} />
        <MarqueeA />
        <StoryA portraitUrl={portraitUrl} portraitCrop={settings.crops.about_bio} />
        <InsideA videoUrls={movementUrls} />
        <CoursesA />
        <BundleA />
        <CoachingA />
        <TestimonialsA videoUrls={testimonialUrls} />
        <FaqA />
        <ClosingA />
      </main>
      <FooterA />
      <PreviewBar current="a" tone="light" />
    </>
  )
}
