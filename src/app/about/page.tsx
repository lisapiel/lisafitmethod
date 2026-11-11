import type { Metadata } from "next"
import { AboutPageD } from "@/components/site/AboutPageD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "About Lisa McPherson | NASM Certified Personal Trainer",
  description:
    "NASM Certified Personal Trainer and founder of Lisa Fit Method. Spent years in classes before finding structured strength training. Learned the foundation the hard way, now here to give it to you straight.",
  openGraph: {
    title: "About Lisa McPherson | NASM Certified Personal Trainer",
    description: "NASM Certified Personal Trainer and founder of Lisa Fit Method. Learned the foundation the hard way. Now here to give it to you straight.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
    siteName: "Lisa Fit Method",
    type: "website",
    locale: "en_US",
  },
  alternates: { canonical: "https://lisafitmethod.com/about" },
}

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://lisafitmethod.com/about#lisa-mcpherson",
    name: "Lisa McPherson",
    jobTitle: "NASM Certified Personal Trainer",
    url: "https://lisafitmethod.com/about",
    image: "https://lisafitmethod.com/lisa-about-hero.jpg",
    description: "NASM Certified Personal Trainer and founder of Lisa Fit Method. Rebuilt training from scratch after a serious back injury. Specializes in foundational strength training for beginners and returners.",
    sameAs: ["https://www.instagram.com/lisafitmethod"],
    worksFor: { "@type": "Organization", "@id": "https://lisafitmethod.com/#organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
    knowsAbout: ["Strength Training", "Beginner Weightlifting", "Movement Correction", "Corrective Exercise", "Progressive Overload", "Core Stability", "Injury Prevention"],
    hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Certification", name: "NASM Certified Personal Trainer (CPT)" },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "About", item: "https://lisafitmethod.com/about" },
    ],
  },
]

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <AboutPageD />
    </>
  )
}
