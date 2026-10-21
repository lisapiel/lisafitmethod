import type { Metadata } from "next"
import { Suspense } from "react"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { SectionD } from "@/components/preview/d/Sections"
import { GuideNutritionD } from "@/components/preview/d/GuideNutritionD.client"

export const metadata: Metadata = {
  title: "Free Nutrition Guide — Direction D Preview",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BG_LIGHT_2 = "/preview/bg-light-2.jpg"

export default function PreviewFreeGuideNutritionPage() {
  return (
    <PageShellD>
      <SectionD
        label="Free nutrition guide"
        backdrop={BG_LIGHT_2}
        opacity={0.14}
        scrim="edges"
        className="pv-d-guide-page"
      >
        <style>{`.pv-d-guide-page { padding-top: clamp(130px, 16vh, 200px); }`}</style>
        <Suspense fallback={null}>
          <GuideNutritionD />
        </Suspense>
      </SectionD>
    </PageShellD>
  )
}
