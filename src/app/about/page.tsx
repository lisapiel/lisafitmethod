import type { Metadata } from "next"
import { AboutPageD } from "@/components/site/AboutPageD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "About Lisa McPherson | Certified Personal Trainer",
  description:
    "Certified personal trainer and founder of Lisa Fit Method. Spent years in classes before finding structured strength training. Learned the foundation the hard way, now here to give it to you straight.",
  openGraph: {
    title: "About Lisa McPherson | Certified Personal Trainer",
    description: "Certified personal trainer and founder of Lisa Fit Method. Learned the foundation the hard way. Now here to give it to you straight.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
  },
}

export default function AboutPage() {
  return <AboutPageD />
}
