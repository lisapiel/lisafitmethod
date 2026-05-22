import type { Metadata } from "next"
import CoachingClient from "./page.client"
import { fetchSiteSettings } from "@/lib/siteSettings"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Online Coaching — 1:1 with Lisa McPherson",
  description:
    "Work directly with Lisa — a certified personal trainer who's been on both sides of training. Personalized programming, form feedback, and real accountability.",
  openGraph: {
    title: "Online Coaching — 1:1 with Lisa McPherson",
    description: "Work directly with Lisa. Personalized programming, form feedback, and real accountability.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

export default async function CoachingPage() {
  const settings = await fetchSiteSettings()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "1:1 Online Coaching — Lisa Fit Method",
    description: settings.text.coachingHeroSubtext,
    url: "https://lisafitmethod.com/coaching",
    provider: {
      "@type": "Person",
      name: "Lisa McPherson",
      jobTitle: "Certified Personal Trainer",
      url: "https://lisafitmethod.com/about",
      sameAs: ["https://instagram.com/lisafitmethod"],
    },
    serviceType: "Personal Training",
    areaServed: "Worldwide",
    availableChannel: { "@type": "ServiceChannel", serviceUrl: "https://lisafitmethod.com/coaching", serviceType: "Online" },
    offers: { "@type": "Offer", availability: "https://schema.org/LimitedAvailability", url: "https://lisafitmethod.com/coaching" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Coaching Inclusions",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: settings.text.coachingFeature1Title, description: settings.text.coachingFeature1Body } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: settings.text.coachingFeature2Title, description: settings.text.coachingFeature2Body } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: settings.text.coachingFeature3Title, description: settings.text.coachingFeature3Body } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: settings.text.coachingFeature4Title, description: settings.text.coachingFeature4Body } },
      ],
    },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CoachingClient settings={settings} />
    </>
  )
}
