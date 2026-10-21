// The live /free-guide page, in Direction D.
import { Suspense } from "react"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { SectionD } from "@/components/preview/d/Sections"
import { GuideD } from "@/components/preview/d/GuideD.client"

const BG_LIGHT = "/preview/bg-light.jpg"

export function FreeGuidePageD() {
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
