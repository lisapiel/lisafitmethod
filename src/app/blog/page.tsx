import Link from "next/link"
import { getBlogIndex } from "@/lib/blogClient"
import type { Metadata } from "next"

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default async function BlogPage() {
  const posts = await getBlogIndex()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Lisa Fit Method Blog",
    description: "Strength training tips and advice for women, by certified personal trainer Lisa McPherson.",
    url: "https://lisafitmethod.com/blog",
    author: {
      "@type": "Person",
      name: "Lisa McPherson",
      jobTitle: "Certified Personal Trainer",
      url: "https://lisafitmethod.com/about",
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.excerpt,
      datePublished: p.date,
      url: `https://lisafitmethod.com/blog/${p.slug}`,
      author: { "@type": "Person", name: "Lisa McPherson" },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "70vh" }}>
      <style>{`
        :root { --accent: #c8a97e; --accent-dark: #a8895e; --muted: #6b6560; }
        .blog-card:hover .blog-title { color: #a8895e; }
        .blog-card:hover .blog-arrow { transform: translateX(4px); }
        .blog-arrow { transition: transform 0.2s; display: inline-block; }
      `}</style>

      {/* HEADER */}
      <section style={{ background: "#0a0a0a", padding: "100px 80px 80px" }} className="blog-header">
        <style>{`
          @media (max-width: 768px) { .blog-header { padding: 72px 28px 60px !important; } }
        `}</style>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20 }}>Blog</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(36px, 4.5vw, 60px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 20 }}>
            Train smarter.<br />
            <em style={{ fontStyle: "italic", color: "#c8a97e" }}>Not just harder.</em>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(245,242,238,0.5)", lineHeight: 1.7 }}>
            Real information on strength training, movement, and building a body that lasts. Written by a certified personal trainer who had to relearn everything the hard way.
          </p>
        </div>
      </section>

      {/* ARTICLE LIST */}
      <section style={{ padding: "80px 80px" }} className="blog-list">
        <style>{`
          @media (max-width: 768px) { .blog-list { padding: 60px 28px !important; } }
        `}</style>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
              style={{
                display: "block",
                textDecoration: "none",
                padding: "40px 0",
                borderBottom: i < posts.length - 1 ? "1px solid rgba(0,0,0,0.08)" : "none",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a8895e", marginBottom: 12 }}>
                {formatDate(post.date)} · {post.readingTime} min read
              </p>
              <h2
                className="blog-title"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: "clamp(22px, 2.5vw, 30px)",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  lineHeight: 1.25,
                  marginBottom: 14,
                  transition: "color 0.2s",
                }}
              >
                {post.title}
              </h2>
              <p style={{ fontSize: 15, color: "#6b6560", lineHeight: 1.75, marginBottom: 20, maxWidth: 580 }}>
                {post.excerpt}
              </p>
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a8895e" }}>
                Read article <span className="blog-arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
    </>
  )
}
