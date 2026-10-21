import type { Metadata } from "next"
import { Suspense } from "react"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { SectionD } from "@/components/preview/d/Sections"
import { GuideD } from "@/components/preview/d/GuideD.client"

export const metadata: Metadata = {
  title: "Free Training Guide — Direction D Preview",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BG_LIGHT = "/preview/bg-light.jpg"

export default function PreviewFreeGuidePage() {
  return (
    <PageShellD>
      <SectionD label="Free training guide" backdrop={BG_LIGHT} opacity={0.14} scrim="edges" className="pv-d-guide-page">
        <style>{`
          /* The guide is a reading page, so it opens straight into the
             content rather than behind a page hero. */
          .pv-d-guide-page { padding-top: clamp(130px, 16vh, 200px); }
        `}</style>
        <Suspense fallback={null}>
          <GuideD />
        </Suspense>
      </SectionD>
    </PageShellD>
  )
}
