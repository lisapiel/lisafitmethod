import type { Metadata } from "next"
import { BlogPageD } from "@/components/site/BlogPageD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Blog |Training Tips & Advice for Women",
  description:
    "Articles on strength training for women, building a workout routine, fixing back pain, and training the right way. Written by Lisa McPherson, certified personal trainer.",
  openGraph: {
    title: "Blog |Lisa Fit Method",
    description: "Strength training tips and advice for women, by certified personal trainer Lisa McPherson.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

export default function BlogPage() {
  return <BlogPageD />
}
