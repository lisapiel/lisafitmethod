import Link from "next/link"
import { notFound } from "next/navigation"
import { getBlogPost, getBlogIndex } from "@/lib/blogClient"
import MarkdownBody from "@/components/blog/MarkdownBody"
import type { Metadata } from "next"

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
        : [{ url: "/hero.png", width: 1200, height: 800 }],
    },
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    ...(post.coverImage ? { image: post.coverImage } : { image: "https://lisafitmethod.com/hero.png" }),
    author: { "@type": "Person", name: "Lisa McPherson", jobTitle: "Certified Personal Trainer", url: "https://lisafitmethod.com/about" },
    publisher: { "@type": "Organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com", logo: { "@type": "ImageObject", url: "https://lisafitmethod.com/hero.png" } },
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
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        :root { --accent: #c8a97e; --accent-dark: #a8895e; --muted: #6b6560; }
      `}</style>

      {/* HEADER */}
      <section style={{ background: "#0a0a0a", padding: "100px 80px 80px" }} className="post-header">
        <style>{`
          @media (max-width: 768px) { .post-header { padding: 72px 28px 60px !important; } }
        `}</style>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link href="/blog" style={{ display: "inline-block", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(200,169,126,0.6)", textDecoration: "none", marginBottom: 28 }}>
            ← Blog
          </Link>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20 }}>
            {formatDate(post.date)} · {post.readingTime} min read
          </p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 20 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,242,238,0.35)" }}>
            By Lisa McPherson, CPT
          </p>
        </div>
      </section>

      {/* COVER IMAGE */}
      {post.coverImage && (
        <div style={{ width: "100%", maxHeight: 480, overflow: "hidden", background: "#e8e0d8" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: 480, objectFit: "cover" }} />
        </div>
      )}

      {/* ARTICLE BODY */}
      <article style={{ padding: "80px 80px" }} className="post-body">
        <style>{`
          @media (max-width: 768px) { .post-body { padding: 60px 28px !important; } }
          .post-body p { font-size: 17px; line-height: 1.9; color: #3a3530; margin-bottom: 24px; }
          .post-body h2 { font-family: var(--font-playfair), serif; font-size: clamp(22px, 2.5vw, 30px); font-weight: 700; color: #1a1a1a; line-height: 1.25; margin: 48px 0 20px; }
          .post-body h3 { font-family: var(--font-playfair), serif; font-size: clamp(18px, 2vw, 22px); font-weight: 700; color: #1a1a1a; line-height: 1.3; margin: 36px 0 14px; }
          .post-body ul { margin: 0 0 24px; padding-left: 20px; }
          .post-body li { font-size: 17px; line-height: 1.9; color: #3a3530; padding-bottom: 4px; }
          .post-body a { color: #c8a97e; text-decoration: underline; }
          .post-body a:hover { color: #a8895e; }
        `}</style>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {post.sections.map((section, i) => (
            <div key={i}>
              {section.heading && <h2>{section.heading}</h2>}
              <MarkdownBody body={section.body} />
            </div>
          ))}

          <div style={{ marginTop: 16, padding: "28px 0", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>Lisa McPherson</p>
              <p style={{ fontSize: 12, color: "#6b6560" }}>Certified Personal Trainer · Lisa Fit Method</p>
            </div>
          </div>
        </div>
      </article>

      {/* CTA */}
      <section style={{ background: "#0a0a0a", padding: "80px 80px", textAlign: "center" }} className="post-cta">
        <style>{`
          @media (max-width: 768px) { .post-cta { padding: 60px 28px !important; } }
        `}</style>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 16 }}>Ready to train the right way?</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700, color: "#f5f2ee", lineHeight: 1.15, marginBottom: 32 }}>
            Stop reading. <em style={{ fontStyle: "italic", color: "#c8a97e" }}>Start building.</em>
          </h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link href="/courses" style={{ display: "inline-block", background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 40px" }}>
              Get Training Foundations
            </Link>
            <Link href="/coaching" style={{ display: "inline-block", border: "1px solid rgba(200,169,126,0.4)", color: "#c8a97e", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "16px 28px" }}>
              Work with me 1:1
            </Link>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
