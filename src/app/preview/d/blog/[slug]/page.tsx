import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getBlogPost } from "@/lib/blogClient"
import MarkdownBody from "@/components/blog/MarkdownBody"
import { Reveal, RevealLines, DrawRule } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { ToneShift, Atmosphere } from "@/components/preview/d/FlowD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Article — Direction D Preview",
  robots: { index: false, follow: false, nocache: true },
}

const BLACK = "#0a0a0a"
const WARM_WHITE = "#faf8f5"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// The article reads the same getBlogPost() and renders the same MarkdownBody
// the live page does, so the writing itself is untouched. Direction D
// contributes the page opening, the reading measure and the closing ask.
export default async function PreviewPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  return (
    <PageShellD>
      <style>{`
        .pv-d-post-hero { position: relative; overflow: hidden; padding: clamp(136px, 17vh, 200px) var(--d-gutter) clamp(56px, 7vw, 92px); }
        .pv-d-post-hero-inner { position: relative; z-index: 2; max-width: 820px; margin: 0 auto; }
        .pv-d-post-back {
          display: inline-flex; align-items: center; gap: 9px; text-decoration: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(200,169,126,0.72);
          margin-bottom: var(--d-step-4); transition: gap 520ms cubic-bezier(0.16,1,0.3,1), color 420ms ease;
        }
        .pv-d-post-back:hover { gap: 18px; color: var(--d-accent); }
        .pv-d-post-h1 { font-size: clamp(2rem, 4.2vw, 3.4rem); margin: var(--d-step-3) 0 var(--d-step-3); }
        .pv-d-post-by {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,242,238,0.42); margin: 0;
        }
        .pv-d-post-cover { width: 100%; max-height: 520px; overflow: hidden; background: var(--d-black); }
        .pv-d-post-cover img { width: 100%; height: 520px; object-fit: cover; display: block; }
        .pv-d-article { max-width: 720px; margin: 0 auto; }
        .pv-d-article p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.02rem, 1.12vw, 1.125rem); line-height: 1.84;
          color: var(--d-text); margin: 0 0 var(--d-step-3);
        }
        .pv-d-article h2 {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.5rem, 2.3vw, 2.05rem); line-height: 1.2; color: var(--d-text);
          margin: var(--d-step-5) 0 var(--d-step-3);
        }
        .pv-d-article h3 {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.18rem, 1.6vw, 1.42rem); line-height: 1.28; color: var(--d-text);
          margin: var(--d-step-4) 0 var(--d-step-2);
        }
        .pv-d-article ul { margin: 0 0 var(--d-step-3); padding-left: 22px; }
        .pv-d-article li {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.02rem, 1.12vw, 1.125rem); line-height: 1.84; color: var(--d-text);
          padding-bottom: 6px;
        }
        .pv-d-article a { color: var(--d-accent-dark); text-decoration: underline; text-underline-offset: 3px; }
        .pv-d-article a:hover { color: var(--d-text); }
        .pv-d-post-sig {
          margin-top: var(--d-step-4); padding-top: var(--d-step-3); border-top: 1px solid var(--d-rule);
        }
        .pv-d-post-sig p:first-child {
          font-family: var(--font-playfair), serif; font-weight: 500; font-size: 1.05rem;
          color: var(--d-text); margin: 0 0 3px;
        }
        .pv-d-post-sig p:last-child {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px; color: var(--d-muted); margin: 0;
        }
        .pv-d-post-end { position: relative; overflow: hidden; text-align: center; }
        .pv-d-post-end-inner { position: relative; max-width: 740px; margin: 0 auto; }
        .pv-d-post-end-ctas { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
      `}</style>

      <header className="pv-d-post-hero pv-d-dark" data-tone="dark">
        <Atmosphere src="/preview/bg-dark-2.jpg" tone="dark" opacity={0.3} position="center 45%" scrim="left" />
        <div className="pv-d-post-hero-inner pv-d-above">
          <Link href="/blog" className="pv-d-post-back">
            <span aria-hidden="true">&larr;</span> Blog
          </Link>
          <p className="pv-d-eyebrow">
            {formatDate(post.date)} &middot; {post.readingTime} min read
          </p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(200,169,126,0.5)" />
          </div>
          <h1 className="pv-d-display pv-d-post-h1">
            <RevealLines lines={[post.title]} />
          </h1>
          <p className="pv-d-post-by">By Lisa McPherson, CPT</p>
        </div>
      </header>

      {post.coverImage && (
        <div className="pv-d-post-cover pv-d-dark" data-tone="dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} />
        </div>
      )}

      <ToneShift from={BLACK} to={WARM_WHITE} />

      <article className="pv-d-light pv-d-section" data-tone="light" style={{ paddingTop: 0 }}>
        <div className="pv-d-article">
          {post.sections.map((section, i) => (
            <div key={i}>
              {section.heading && <h2>{section.heading}</h2>}
              <MarkdownBody body={section.body} />
            </div>
          ))}

          <div className="pv-d-post-sig">
            <p>Lisa McPherson</p>
            <p>Certified Personal Trainer &middot; Lisa Fit Method</p>
          </div>
        </div>
      </article>

      <ToneShift from={WARM_WHITE} to={BLACK} />

      <section className="pv-d-post-end pv-d-dark pv-d-section" data-tone="dark">
        <Atmosphere src="/preview/bg-dark.jpg" tone="dark" opacity={0.28} position="center 50%" />
        <div className="pv-d-post-end-inner pv-d-above">
          <p className="pv-d-eyebrow">Ready to train the right way?</p>
          <div className="pv-d-open-rule" style={{ marginLeft: "auto", marginRight: "auto" }}>
            <DrawRule color="rgba(200,169,126,0.5)" origin="center" />
          </div>
          <h2 className="pv-d-display pv-d-h2" style={{ maxWidth: "18ch", margin: "0 auto var(--d-step-4)" }}>
            <RevealLines lines={["Stop reading.", <i key="em">Start building.</i>]} stagger={130} />
          </h2>
          <Reveal variant="up" delay={180}>
            <div className="pv-d-post-end-ctas">
              <Link href="/courses" className="pv-d-btn pv-d-btn--gold">
                <span>Get Training Foundations</span>
              </Link>
              <Link href="/coaching" className="pv-d-btn pv-d-btn--ghost-dark">
                <span>Work with me 1:1</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShellD>
  )
}
