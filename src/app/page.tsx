import type { Metadata } from "next"
import { fetchSiteSettings } from "@/lib/siteSettings"
import { HomePageD } from "@/components/site/HomePageD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Lisa Fit Method | Train the Right Way",
  description:
    "A complete strength training foundation for beginners and returners. Learn proper form, follow a structured program, track your progress, and build a body that actually lasts.",
  openGraph: {
    title: "Lisa Fit Method | Train the Right Way",
    description: "A complete strength training foundation for beginners and returners. Proper movement, real structure, and a body built to last.",
  },
}

export default async function HomePage() {
  // The homepage structured data is built from the live settings exactly as
  // before, so the redesign does not change what this page is indexed on.
  const settings = await fetchSiteSettings()
  const t = settings.text

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Lisa Fit Method",
      url: "https://lisafitmethod.com",
      description: "A complete strength training foundation for beginners and returners. Learn proper form, follow a structured program, track your progress, and build a body that lasts.",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://lisafitmethod.com/blog?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Lisa Fit Method",
      url: "https://lisafitmethod.com",
      logo: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png" },
      image: "https://lisafitmethod.com/hero.png",
      description: "Online personal training and strength programming built around proper movement, real structure, and a foundation that lasts.",
      founder: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
      sameAs: ["https://instagram.com/lisafitmethod"],
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Lisa McPherson",
      jobTitle: "Certified Personal Trainer",
      url: "https://lisafitmethod.com/about",
      image: "https://lisafitmethod.com/hero.png",
      description: "Certified personal trainer and founder of Lisa Fit Method. Rebuilt training from scratch after a serious back injury. Now helps people build strength the right way.",
      sameAs: ["https://instagram.com/lisafitmethod"],
      worksFor: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      knowsAbout: ["Strength Training", "Beginner Weightlifting", "Movement Correction", "Corrective Exercise", "Progressive Overload", "Core Stability"],
      hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Certification", name: "Certified Personal Trainer (CPT)" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Training Foundations",
      description: "A complete strength training foundation for beginners and returners. Three days a week, built around five foundational movement patterns, progressive overload, and built-in workout tracking. Start with a structured 4-week program, then repeat it stronger.",
      image: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png", width: 1200, height: 800 },
      provider: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      instructor: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
      url: "https://lisafitmethod.com/courses",
      courseMode: "online",
      educationalLevel: "Beginner",
      timeRequired: "P4W",
      inLanguage: "en",
      offers: {
        "@type": "Offer",
        price: Number(t.coursePrice),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://lisafitmethod.com/checkout",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        instructor: { "@type": "Person", name: "Lisa McPherson" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "1:1 Personal Training Coaching",
      description: "Personalized online coaching with Lisa McPherson: custom programming, form review, and weekly check-ins tailored to your goals and schedule.",
      provider: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
      url: "https://lisafitmethod.com/coaching",
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HomePageD />
    </>
  )
}
