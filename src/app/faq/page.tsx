import type { Metadata } from "next"

import { FAQ_CATEGORIES } from "./content"
import { FaqPageD } from "@/components/site/FaqPageD"

export const metadata: Metadata = {
  title: "FAQ | Common Questions About The Lisa Fit Method",
  description:
    "Answers to the most common questions about The Lisa Fit Method: beginner strength training, nutrition for fat loss and muscle building, how courses and coaching work, and how to get started.",
  openGraph: {
    title: "FAQ | Common Questions About The Lisa Fit Method",
    description:
      "Everything you need to know before you start. Courses, coaching, training, nutrition, equipment, results, and access. Honest answers from a certified personal trainer.",
  },
}

const ALL_ITEMS = FAQ_CATEGORIES.flatMap((c) => c.items)

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALL_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.schemaA,
    },
  })),
}

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <FaqPageD />
    </>
  )
}
