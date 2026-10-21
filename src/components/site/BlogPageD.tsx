// The live /blog page, in Direction D.
import Link from "next/link"
import { getBlogIndex } from "@/lib/blogClient"
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift, Atmosphere } from "@/components/preview/d/FlowD"

const BLACK = "#0a0a0a"
const WARM_WHITE = "#faf8f5"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// The index reads the same getBlogIndex() the live page does, so the posts,
// dates, reading times and excerpts cannot drift. Only the presentation is
// Direction D: the dark page opening, the gold rule, and the articles as an
// editorial list separated by hairlines rather than cards.
export async function BlogPageD() {
  const posts = await getBlogIndex()

  return (
    <PageShellD>
      <style>{`
        .pv-d-posts { max-width: 820px; margin: 0 auto; }
        .pv-d-post {
          display: block; text-decoration: none; color: inherit;
          padding: clamp(28px, 3.2vw, 44px) 0; border-bottom: 1px solid var(--d-rule);
        }
        .pv-d-post:last-child { border-bottom: none; }
        .pv-d-post-meta {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent-dark);
          margin: 0 0 var(--d-step-2);
        }
        .pv-d-post-title {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.4rem, 2.2vw, 2rem); line-height: 1.2; color: var(--d-text);
          margin: 0 0 var(--d-step-2); max-width: 26ch;
          transition: color 520ms cubic-bezier(0.16,1,0.3,1), transform 520ms cubic-bezier(0.16,1,0.3,1);
          transform-origin: left center;
        }
        .pv-d-post:hover .pv-d-post-title { color: var(--d-accent-dark); transform: translateX(7px); }
        .pv-d-post-excerpt {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.05vw, 1.0312rem); line-height: 1.78;
          color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 62ch;
        }
        .pv-d-post-more {
          display: inline-flex; align-items: center; gap: 9px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent-dark);
          transition: gap 520ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-post:hover .pv-d-post-more { gap: 19px; }
      `}</style>

      <PageHeroD
        eyebrow="Blog"
        headingLines={["Train smarter.", <i key="em">Not just harder.</i>]}
        lede="Real information on strength training, movement, and building a body that lasts. Written by a certified personal trainer who had to relearn everything the hard way."
        backdrop="/preview/bg-dark.jpg"
      />

      <ToneShift from={BLACK} to={WARM_WHITE} />

      <section className="pv-d-light pv-d-section" data-tone="light" style={{ position: "relative" }}>
        <Atmosphere src="/preview/bg-light.jpg" tone="light" opacity={0.3} position="center 30%" scrim="edges" />
        <div className="pv-d-posts pv-d-above">
          {posts.map((post, i) => (
            <Reveal key={post.slug} variant="up" delay={i * 70} duration={1050}>
              <Link href={`/blog/${post.slug}`} className="pv-d-post">
                <p className="pv-d-post-meta">
                  {formatDate(post.date)} &middot; {post.readingTime} min read
                </p>
                <h2 className="pv-d-post-title">{post.title}</h2>
                <p className="pv-d-post-excerpt">{post.excerpt}</p>
                <span className="pv-d-post-more">
                  Read article <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShellD>
  )
}
