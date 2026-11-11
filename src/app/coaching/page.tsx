import type { Metadata } from "next"
import { CoachingPageD } from "@/components/site/CoachingPageD"
import { COACHING_3MONTH_CENTS, COACHING_MTM_CENTS, COACHING_3MONTH_DISPLAY, COACHING_MTM_DISPLAY } from "@/lib/pricing"

export const metadata: Metadata = {
  title: "Online 1:1 Coaching | Lisa Fit Method",
  description:
    "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent. Every program is built around you.",
  openGraph: {
    // Next replaces the parent openGraph rather than merging into it, so a
    // page that sets any field here inherits no image at all. Without this
    // the card is blank, which is the fault this change exists to fix.
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
    siteName: "Lisa Fit Method",
    type: "website",
    locale: "en_US",
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
  alternates: { canonical: "https://lisafitmethod.com/coaching" },
}

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://lisafitmethod.com/coaching#service",
    name: "1:1 Online Personal Training Coaching",
    description: "Personalized online coaching with custom programming, form review, and weekly check-ins. Two options: a 3-month commitment program or flexible month-to-month.",
    provider: {
      "@type": "Organization",
      "@id": "https://lisafitmethod.com/#organization",
      name: "Lisa Fit Method",
      url: "https://lisafitmethod.com",
    },
    url: "https://lisafitmethod.com/coaching",
    serviceType: "Personal Training",
    areaServed: "Online",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: "https://lisafitmethod.com/coaching",
      availableLanguage: "en",
    },
    offers: [
      {
        "@type": "Offer",
        name: "3-Month Coaching Program",
        price: COACHING_3MONTH_CENTS / 100,
        priceCurrency: "USD",
        description: `${COACHING_3MONTH_DISPLAY}/month · 3-month minimum commitment, then continues month-to-month`,
        eligibleDuration: { "@type": "QuantitativeValue", minValue: 3, unitCode: "MON" },
      },
      {
        "@type": "Offer",
        name: "Month-to-Month Coaching",
        price: COACHING_MTM_CENTS / 100,
        priceCurrency: "USD",
        description: `${COACHING_MTM_DISPLAY}/month · Cancel anytime, no minimum commitment`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "Coaching", item: "https://lisafitmethod.com/coaching" },
    ],
  },
]

export default function CoachingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CoachingPageD />
    </>
  )
}
