import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getPublishedPhotoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import { ParallaxMedia } from "@/components/preview/ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift, Atmosphere } from "@/components/preview/d/FlowD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "About — Direction D Preview",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BLACK = "#0a0a0a"
const WARM_WHITE = "#faf8f5"
const OFF_WHITE = "#f5f2ee"

// The eight story paragraphs are hardcoded on the live /about page rather
// than held in settings, so they are transcribed here verbatim. Everything
// else on this page is read from the same siteSettings source production
// uses, which means it cannot drift.
const STORY_PARAGRAPHS = [
  "Like a lot of people, when I first started training, I focused mostly on classes, cardio, and random workouts. I was consistent. I worked hard. And I still had almost nothing to show for it. Years of effort without real progress.",
  "About seven years ago, I started taking strength training seriously for the first time. That's when everything changed. Within months, I realized what had been missing all along: structure, progressive overload, and real programming. My body started changing in a way it never had before, and I became obsessed with understanding how fitness actually works.",
  "But I also made the mistake a lot of people make once they finally start seeing progress. I pushed heavier weights before building the foundation to support them. Warm-ups felt optional. Mobility work wasn't even on my radar. Eventually, my back gave out.",
  "For almost a year, I dealt with serious pain. That period forced me to slow down, relearn movement mechanics, and completely rethink the way I approached training.",
  "I rebuilt everything from the ground up: movement quality, mobility, recovery, warm-ups, and programming. I became a certified personal trainer because I genuinely needed to understand what I had been missing all along.",
  "I came back pain-free, stronger than before, and with a completely different perspective on fitness.",
  "That's why Lisa Fit Method exists: to help people build strength the right way from the beginning through movement quality, intelligent programming, and training that actually lasts.",
  "Whether you're completely new to lifting or you've been winging it for years, this is the approach I wish someone had handed me from the start.",
]

export default async function PreviewAboutPage() {
  const [photoUrl, settings] = await Promise.all([
    getPublishedPhotoUrl("about_bio"),
    fetchSiteSettings(),
  ])

  const t = settings.text
  const [lead, ...rest] = STORY_PARAGRAPHS
  const creds = [
    { label: t.aboutCred1Label, body: t.aboutCred1Body },
    { label: t.aboutCred2Label, body: t.aboutCred2Body },
    { label: t.aboutCred3Label, body: t.aboutCred3Body },
  ]

  return (
    <PageShellD>
      <style>{`
        .pv-d-about-portrait { width: 230px; height: 230px; border-radius: 50%; overflow: hidden; margin-bottom: var(--d-step-4); border: 1px solid rgba(200,169,126,0.4); }
        .pv-d-about-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center 35%; display: block; }
        .pv-d-about-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.72fr); gap: clamp(32px, 5vw, 86px); align-items: start; }
        .pv-d-about-lead {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.08rem, 1.42vw, 1.34rem); line-height: 1.68;
          color: var(--d-text); margin: 0 0 var(--d-step-3); max-width: 56ch;
        }
        .pv-d-about-p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.05vw, 1.0625rem); line-height: 1.86;
          color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 62ch;
        }
        .pv-d-about-plate { position: sticky; top: 104px; }
        .pv-d-about-quote {
          margin-top: var(--d-step-3); padding-top: var(--d-step-3);
          border-top: 1px solid var(--d-rule);
        }
        .pv-d-about-quote blockquote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.1rem, 1.6vw, 1.4rem); line-height: 1.52; color: var(--d-text); margin: 0 0 var(--d-step-2);
        }
        .pv-d-about-cite {
          font-style: normal; font-family: var(--font-dm-sans), sans-serif; font-size: 10px;
          font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: var(--d-accent-dark);
        }
        .pv-d-about-ctas { display: flex; gap: clamp(14px, 1.8vw, 26px); align-items: center; flex-wrap: wrap; margin-top: var(--d-step-4); }
        .pv-d-creds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .pv-d-cred { padding: var(--d-step-4) var(--d-step-3); border-left: 1px solid var(--d-rule); }
        .pv-d-cred:first-child { border-left: none; padding-left: 0; }
        .pv-d-cred h3 { font-family: var(--font-playfair), serif; font-weight: 500; font-size: clamp(1.1rem, 1.4vw, 1.3rem); color: var(--d-text); margin: 0 0 var(--d-step-2); }
        .pv-d-cred p { font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.9rem; line-height: 1.78; color: var(--d-muted); margin: 0; }
        .pv-d-ig { position: relative; overflow: hidden; text-align: center; }
        .pv-d-ig-inner { position: relative; max-width: 860px; margin: 0 auto; }
        @media (max-width: 960px) {
          .pv-d-about-grid { grid-template-columns: 1fr; gap: var(--d-step-5); }
          .pv-d-about-plate { position: static; max-width: 460px; }
          .pv-d-creds { grid-template-columns: 1fr; }
          .pv-d-cred { border-left: none; border-top: 1px solid var(--d-rule); padding-left: 0; padding-right: 0; }
          .pv-d-cred:first-child { border-top: none; }
        }
      `}</style>

      <PageHeroD
        eyebrow="About Me"
        headingLines={t.aboutHeroHeadline.replace(/\\n/g, "\n").split("\n")}
        lede={t.aboutHeroSubtext}
        backdrop="/preview/bg-dark-2.jpg"
      >
        <Reveal variant="fade" duration={1200}>
          <div className="pv-d-about-portrait" style={{ marginTop: "var(--d-step-4)", marginBottom: 0 }}>
            <Image
              src="/lisa-about-hero.jpg"
              alt="Lisa McPherson, Certified Personal Trainer"
              width={460}
              height={460}
              priority
            />
          </div>
        </Reveal>
      </PageHeroD>

      <ToneShift from={BLACK} to={WARM_WHITE} />

      <section className="pv-d-light pv-d-section" data-tone="light">
        <div className="pv-d-inner">
          <div className="pv-d-about-grid">
            <div>
              <Reveal variant="up" duration={1100}>
                <p className="pv-d-about-lead">{lead}</p>
              </Reveal>
              {rest.map((para, i) => (
                <Reveal key={para.slice(0, 30)} variant="up" delay={i * 70} duration={1050}>
                  <p className="pv-d-about-p">{para}</p>
                </Reveal>
              ))}
              <Reveal variant="up" delay={120}>
                <div className="pv-d-about-ctas">
                  <Link href="/courses" className="pv-d-btn pv-d-btn--primary">
                    <span>Get The Course</span>
                  </Link>
                  <Link href="/coaching" className="pv-d-link">
                    Work With Me
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </Reveal>
            </div>

            <div>
              <Reveal variant="fade" duration={1300}>
                <div className="pv-d-about-plate">
                  <ParallaxMedia
                    src={photoUrl ?? "/hero.png"}
                    alt="Lisa McPherson, Certified Personal Trainer"
                    objectPosition={settings.crops.about_bio}
                    aspect="3 / 4"
                    shift={11}
                    sizes="(max-width: 960px) 100vw, 34vw"
                  />
                  <figure className="pv-d-about-quote">
                    <blockquote>&ldquo;{t.aboutQuote}&rdquo;</blockquote>
                    <cite className="pv-d-about-cite">Lisa McPherson, CPT</cite>
                  </figure>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="pv-d-light-alt pv-d-section" data-tone="light">
        <div className="pv-d-inner">
          <div className="pv-d-open">
            <p className="pv-d-eyebrow">What I bring</p>
            <div className="pv-d-open-rule">
              <DrawRule color="rgba(168,137,94,0.55)" />
            </div>
            <h2 className="pv-d-display pv-d-h2" style={{ maxWidth: "20ch" }}>
              <RevealLines
                lines={["Not just certification.", <i key="em">Experience from both sides.</i>]}
                stagger={120}
              />
            </h2>
          </div>
          <div className="pv-d-creds">
            {creds.map((c, i) => (
              <Reveal key={c.label} className="pv-d-cred" variant="up" delay={i * 110} duration={1050}>
                <h3>{c.label}</h3>
                <p>{c.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ToneShift from={OFF_WHITE} to={BLACK} />

      <section className="pv-d-ig pv-d-dark pv-d-section" data-tone="dark">
        <Atmosphere src="/preview/bg-dark.jpg" tone="dark" opacity={0.3} position="center 50%" />
        <div className="pv-d-ig-inner pv-d-above">
          <p className="pv-d-eyebrow">Follow along</p>
          <div className="pv-d-open-rule" style={{ marginLeft: "auto", marginRight: "auto" }}>
            <DrawRule color="rgba(200,169,126,0.5)" origin="center" />
          </div>
          <h2 className="pv-d-display pv-d-h2" style={{ maxWidth: "22ch", margin: "0 auto var(--d-step-4)" }}>
            <RevealLines
              lines={["Training, movement, and the real stuff.", <i key="em">No gimmicks.</i>]}
              stagger={130}
            />
          </h2>
          <Reveal variant="up" delay={180}>
            <a
              href="https://instagram.com/lisafitmethod"
              target="_blank"
              rel="noopener noreferrer"
              className="pv-d-btn pv-d-btn--ghost-dark"
            >
              <span>@lisafitmethod on Instagram &#8599;</span>
            </a>
          </Reveal>
        </div>
      </section>
    </PageShellD>
  )
}
