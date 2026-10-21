import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBlogPost, getBlogIndex } from "@/lib/blogClient"
import { ArticlePageD } from "@/components/site/ArticlePageD"

export const revalidate = 60

export async function generateStaticParams() {
  const posts = await getBlogIndex()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: ["Lisa McPherson"],
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630 }]
        : [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  // The article and breadcrumb structured data are built from the post
  // exactly as before, so indexing is unaffected by the redesign.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image: { "@type": "ImageObject", url: post.coverImage ?? "https://lisafitmethod.com/hero.png", width: 1200, height: 800 },
    author: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
    publisher: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com", logo: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png", width: 1200, height: 800 } },
    url: `https://lisafitmethod.com/blog/${post.slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://lisafitmethod.com/blog/${post.slug}` },
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lisafitmethod.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://lisafitmethod.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://lisafitmethod.com/blog/${post.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
      <ArticlePageD slug={slug} />
    </>
  )
}
