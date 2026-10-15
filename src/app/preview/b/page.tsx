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
import { StylesB } from "@/components/preview/b/StylesB"
import NavB from "@/components/preview/b/NavB.client"
import HeroB from "@/components/preview/b/HeroB.client"
import StatementB from "@/components/preview/b/StatementB.client"
import { StoryB } from "@/components/preview/b/StoryB"
import { ReelB } from "@/components/preview/b/ReelB"
import { CoursesB, BundleB } from "@/components/preview/b/CoursesB"
import { CoachingB } from "@/components/preview/b/CoachingB"
import { TestimonialsB } from "@/components/preview/b/TestimonialsB"
import { FaqB, ClosingB, FooterB } from "@/components/preview/b/ClosingB"
import { MOVEMENT_SHOWCASE, TESTIMONIALS } from "@/components/preview/previewContent"

export const revalidate = 60

// noindex: internal design prototype sharing the live app. Never indexed.
export const metadata: Metadata = {
  title: "Direction B · Nocturne — Redesign Prototype",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

export default async function PreviewDirectionBPage() {
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
      <StylesB />
      <div className="pv-b-grain" aria-hidden="true" />
      <NavB />
      <main style={{ background: "#08080a", color: "#f0e6d3" }}>
        <HeroB trailerSrc={trailerSrc} posterSrc={derivePosterUrl(trailerSrc)} />
        <StatementB />
        <StoryB portraitUrl={portraitUrl} portraitCrop={settings.crops.about_bio} />
        <ReelB videoUrls={movementUrls} />
        <CoursesB />
        <BundleB />
        <CoachingB />
        <TestimonialsB videoUrls={testimonialUrls} />
        <FaqB />
        <ClosingB />
      </main>
      <FooterB />
      <PreviewBar current="b" tone="dark" />
    </>
  )
}
