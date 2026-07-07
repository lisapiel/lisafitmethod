import type { Metadata } from "next"
import CoachingClient from "./page.client"

export const metadata: Metadata = {
  title: "Online 1:1 Coaching | Lisa Fit Method",
  description:
    "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent. Every program is built around you.",
  openGraph: {
    title: "Online 1:1 Coaching | Lisa Fit Method",
    description:
      "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online 1:1 Coaching | Lisa Fit Method",
    description:
      "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent.",
  },
}

export default function CoachingPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "Coaching", item: "https://lisafitmethod.com/coaching" },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
      <CoachingClient />
    </>
  )
}
