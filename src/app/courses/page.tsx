import type { Metadata } from "next"
import { fetchSiteSettings } from "@/lib/siteSettings"
import { CoursesPageD } from "@/components/site/CoursesPageD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Courses | Lisa Fit Method",
  description:
    "Training Foundations and Nutrition Foundations — two structured courses built to give you the movement, strength, and eating habits that actually last. One-time payment, ongoing access.",
  openGraph: {
    title: "Courses | Lisa Fit Method",
    description: "Two structured courses. Training Foundations and Nutrition Foundations. One-time payment, yours to keep.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
  },
}

export default async function CoursesPage() {
  // The structured data is built from the live settings, exactly as before,
  // so the Course, FAQ and Breadcrumb markup this page is indexed on is
  // unchanged by the redesign.
  const settings = await fetchSiteSettings()
  const t = settings.text

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Training Foundations",
    description: "A complete strength training foundation. Learn the five foundational movement patterns, follow a structured program, and build a base that supports your training for life.",
    image: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png", width: 1200, height: 800 },
    url: "https://lisafitmethod.com/courses",
    provider: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
    instructor: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
    courseMode: "online",
    educationalLevel: "Beginner",
    timeRequired: "P4W",
    inLanguage: "en",
    teaches: ["Hip Hinge", "Squat Pattern", "Push Pattern", "Pull Pattern", "Core Stability", "Progressive Overload", "Nutrition Fundamentals"],
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", instructor: { "@type": "Person", name: "Lisa McPherson" } },
    offers: {
      "@type": "Offer",
      price: Number(t.coursePrice),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://lisafitmethod.com/checkout",
      seller: { "@type": "Organization", name: "Lisa Fit Method" },
    },
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "How long does each session take?", acceptedAnswer: { "@type": "Answer", text: "Between 45 and 60 minutes including warm-up and cool-down." } },
      { "@type": "Question", name: "Do I need a gym membership?", acceptedAnswer: { "@type": "Answer", text: "You need access to basic equipment: dumbbells, a resistance band, and a flat bench or equivalent." } },
      { "@type": "Question", name: "Is this for complete beginners?", acceptedAnswer: { "@type": "Answer", text: "Yes. It's designed for people who are new to structured training or feel like they've been winging it, regardless of experience level." } },
      { "@type": "Question", name: "Can I do more than 4 weeks?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. The program is designed to be run in multiple rounds. Each round you add weight and progress further. Four weeks is the foundation; most people who see real results run it 2 or 3 times." } },
      { "@type": "Question", name: "Is this a one-time payment?", acceptedAnswer: { "@type": "Answer", text: "Yes. One-time payment. No subscription." } },
      { "@type": "Question", name: "Can men do this program?", acceptedAnswer: { "@type": "Answer", text: "Yes. The movements and principles apply to everyone." } },
    ],
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "Courses", item: "https://lisafitmethod.com/courses" },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
      <CoursesPageD />
    </>
  )
}
