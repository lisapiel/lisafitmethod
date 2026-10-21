// The live /courses page, in Direction D.
import Image from "next/image"
import Link from "next/link"
import VideoPlayer from "@/components/VideoPlayer.client"
import FreeGuideTeaser from "@/components/FreeGuideTeaser.client"
import { getPublishedVideoUrl, getPublishedPhotoUrl, derivePosterUrl, heroTrailerUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import {
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
  TRACKER_PRICE_DISPLAY,
} from "@/lib/pricing"
import { TRAINING_MODULES, NUTRITION_MODULES } from "@/app/courses/content"
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift } from "@/components/preview/d/FlowD"
import { SectionD, OpenD, MarkerListD, ModuleRailD, PriceBlockD, QaListD } from "@/components/preview/d/Sections"
import {
  COURSES_INTRO,
  INSIDE_LABEL,
  TRAINING,
  TESTIMONIAL_BAND,
  NUTRITION,
  BUNDLE_BAND,
  TRACKER,
  IS_THIS_FOR_ME,
  COURSES_FAQ,
  COURSES_FINAL,
} from "@/components/preview/d/content/coursesPage"

const BG_DUMBBELLS = "/preview/bg-dumbbells.jpg"
const BG_LIGHT = "/preview/bg-light.jpg"
const BG_LIGHT_2 = "/preview/bg-light-2.jpg"
const BG_STUDIO = "/preview/bg-studio.jpg"
const BG_DARK = "/preview/bg-dark.jpg"
const BG_DARK_2 = "/preview/bg-dark-2.jpg"

export async function CoursesPageD() {
  const [trailerUrl, testimonialsUrl, settings] = await Promise.all([
    getPublishedVideoUrl("lp_trailer"),
    getPublishedPhotoUrl("testimonials"),
    fetchSiteSettings(),
  ])
  const t = settings.text

  return (
    <PageShellD>
      <style>{`
        /* The offer foot: price on the left, what you get on the right, with
           one hairline above it. Replaces the production sticky price box,
           which was the only boxed element left on the page. */
        .pv-d-offer-foot {
          display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(28px, 4vw, 72px); align-items: start;
          margin-top: var(--d-step-5); padding-top: var(--d-step-4);
          border-top: 1px solid var(--d-rule);
        }
        .pv-d-dark .pv-d-offer-foot { border-top-color: var(--d-rule-dark); }
        @media (max-width: 820px) {
          .pv-d-offer-foot { grid-template-columns: 1fr; gap: var(--d-step-4); }
        }
        .pv-d-jumps { display: flex; gap: clamp(18px, 2.4vw, 34px); flex-wrap: wrap; margin-top: var(--d-step-4); }
        .pv-d-jumps a {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none;
          color: rgba(245,242,238,0.6); border-bottom: 1px solid rgba(200,169,126,0.4);
          padding-bottom: 3px; transition: color 420ms ease;
        }
        .pv-d-jumps a:hover { color: var(--d-accent); }
        .pv-d-trailer { width: 100%; height: 62vh; min-height: 320px; overflow: hidden; background: #111; }
        @media (max-width: 768px) { .pv-d-trailer { height: 56vw; min-height: 220px; } }
        .pv-d-testimonial-shot { max-width: 900px; margin: 0 auto; }
        .pv-d-testimonial-shot img { width: 100%; height: auto; display: block; }
        .pv-d-tracker-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(26px, 3.4vw, 60px);
        }
        @media (max-width: 820px) { .pv-d-tracker-grid { grid-template-columns: 1fr; gap: var(--d-step-3); } }
        .pv-d-tracker-title {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.05rem, 1.4vw, 1.25rem); margin: 0 0 var(--d-step-1);
        }
        .pv-d-tracker-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.86rem, 0.98vw, 0.94rem); line-height: 1.75;
          color: var(--d-muted); margin: 0;
        }
        .pv-d-tracker-head {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: var(--d-step-3); flex-wrap: wrap; margin-bottom: var(--d-step-4);
        }
        .pv-d-tracker-price {
          font-family: var(--font-playfair), serif; font-weight: 500; line-height: 1;
          font-size: clamp(1.6rem, 2.4vw, 2.1rem); color: var(--d-accent-dark);
        }
        .pv-d-tracker-once {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          color: rgba(26,26,26,0.4); margin-left: 10px;
        }
        .pv-d-tracker-foot {
          margin-top: var(--d-step-4); padding-top: var(--d-step-3);
          border-top: 1px solid var(--d-rule);
          display: flex; flex-wrap: wrap; gap: var(--d-step-3); align-items: center;
        }
        .pv-d-tracker-alt {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--d-accent-dark); text-decoration: none;
          border-bottom: 1px solid rgba(168,137,94,0.4); padding-bottom: 2px;
        }
        .pv-d-bundle-lines { display: flex; flex-direction: column; gap: 10px; margin-bottom: var(--d-step-3); }
        .pv-d-bundle-line {
          display: flex; align-items: center; gap: 11px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.92rem;
          color: rgba(245,242,238,0.62);
        }
        .pv-d-bundle-line span:first-child { color: var(--d-accent); font-size: 11px; }
        .pv-d-save {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.06em;
          color: rgba(200,169,126,0.68);
        }
        .pv-d-final-links {
          margin-top: var(--d-step-5); padding-top: var(--d-step-4);
          border-top: 1px solid var(--d-rule-dark);
          display: flex; flex-wrap: wrap; gap: var(--d-step-3); justify-content: center;
        }
        .pv-d-final-links a {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; letter-spacing: 0.05em;
          color: rgba(200,169,126,0.62); text-decoration: none; transition: color 420ms ease;
        }
        .pv-d-final-links a:hover { color: var(--d-accent); }
      `}</style>

      <PageHeroD
        eyebrow={COURSES_INTRO.eyebrow}
        headingLines={[COURSES_INTRO.headingLine1, <i key="em">{COURSES_INTRO.headingLine2}</i>]}
        lede={COURSES_INTRO.body}
        backdrop={BG_STUDIO}
      >
        <Reveal variant="up" delay={260}>
          <nav className="pv-d-jumps" aria-label="Jump to a course">
            {COURSES_INTRO.jumps.map((j) => (
              <a key={j.href} href={j.href}>
                {j.label}
              </a>
            ))}
          </nav>
        </Reveal>
      </PageHeroD>

      {/* The trailer keeps its own black band, as on the live page. */}
      <section style={{ background: "#000" }} data-tone="dark" aria-label="Course trailer">
        <VideoPlayer
          src={heroTrailerUrl(trailerUrl)}
          poster={derivePosterUrl(heroTrailerUrl(trailerUrl))}
          className="pv-d-trailer"
        />
      </section>

      <ToneShift from="dark" to="light" />

      <SectionD id="training" label="Training Foundations" backdrop={BG_DUMBBELLS} opacity={0.16} scrim="right">
        <OpenD
          eyebrow={TRAINING.eyebrow}
          lines={[t.coursesHeroHeadline]}
          lede={t.coursesHeroSubtext}
          maxWidth="18ch"
        />
        <ModuleRailD modules={TRAINING_MODULES} label={INSIDE_LABEL} />
        <div className="pv-d-offer-foot">
          <PriceBlockD
            now={`$${t.coursePrice}`}
            was={COURSE_REGULAR_PRICE_DISPLAY}
            noteLines={[TRAINING.priceNoteLine1, TRAINING.priceNoteLine2]}
            cta={TRAINING.cta}
            href={TRAINING.href}
          />
          <MarkerListD items={TRAINING.points} marker="check" />
        </div>
      </SectionD>

      {testimonialsUrl && (
        <SectionD alt label="Testimonials" backdrop={BG_LIGHT_2} opacity={0.18} scrim="edges">
          <OpenD
            eyebrow={TESTIMONIAL_BAND.eyebrow}
            lines={[TESTIMONIAL_BAND.headingLine1, <i key="em">{TESTIMONIAL_BAND.headingLine2}</i>]}
            centre
          />
          <Reveal variant="fade" duration={1200}>
            <div className="pv-d-testimonial-shot">
              <Image
                src={testimonialsUrl}
                alt={TESTIMONIAL_BAND.alt}
                width={1800}
                height={1200}
                sizes="(max-width: 900px) 92vw, 900px"
              />
            </div>
          </Reveal>
        </SectionD>
      )}

      <SectionD id="nutrition" label="Nutrition Foundations" backdrop={BG_LIGHT} opacity={0.2} scrim="left">
        <OpenD
          eyebrow={NUTRITION.eyebrow}
          lines={[NUTRITION.headingLine1, <i key="em">{NUTRITION.headingLine2}</i>]}
          lede={NUTRITION.body}
          maxWidth="18ch"
        />
        <ModuleRailD modules={NUTRITION_MODULES} label={INSIDE_LABEL} />
        <div className="pv-d-offer-foot">
          <PriceBlockD
            now={NUTRITION_COURSE_PRICE_DISPLAY}
            was={NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}
            noteLines={[NUTRITION.priceNoteLine1, NUTRITION.priceNoteLine2]}
            cta={NUTRITION.cta}
            href={NUTRITION.href}
            secondary={NUTRITION.detailsLink}
            secondaryHref={NUTRITION.detailsHref}
          />
          <MarkerListD items={NUTRITION.points} marker="arrow" />
        </div>
      </SectionD>

      <ToneShift from="light" to="dark" />

      <SectionD id="bundle" tone="dark" label="Foundations Bundle" backdrop={BG_DARK_2} opacity={0.24} scrim="center">
        <OpenD
          eyebrow={BUNDLE_BAND.eyebrow}
          lines={[BUNDLE_BAND.heading]}
          lede={BUNDLE_BAND.body}
          maxWidth="20ch"
        />
        <div className="pv-d-offer-foot">
          <div>
            <div className="pv-d-bundle-lines">
              {BUNDLE_BAND.includes.map((name) => (
                <p key={name} className="pv-d-bundle-line">
                  <span aria-hidden="true">✓</span>
                  <span>{name}</span>
                </p>
              ))}
            </div>
            <PriceBlockD
              now={BUNDLE_PRICE_DISPLAY}
              was={BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}
              cta={BUNDLE_BAND.cta}
              href={BUNDLE_BAND.href}
              ctaVariant="gold"
              noteLines={[BUNDLE_BAND.note]}
            />
          </div>
          <p className="pv-d-save">save {BUNDLE_SAVINGS_DISPLAY}</p>
        </div>
      </SectionD>

      <ToneShift from="dark" to="light" />

      <SectionD label="Progress Tracker add-on">
        <div className="pv-d-tracker-head">
          <div>
            <p className="pv-d-eyebrow">{TRACKER.eyebrow}</p>
            <h2 className="pv-d-display" style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.3rem)", margin: "var(--d-step-2) 0 0" }}>
              {TRACKER.heading}
            </h2>
          </div>
          <p style={{ margin: 0 }}>
            <span className="pv-d-tracker-price">{TRACKER_PRICE_DISPLAY}</span>
            <span className="pv-d-tracker-once">{TRACKER.priceSuffix}</span>
          </p>
        </div>
        <div className="pv-d-tracker-grid">
          {TRACKER.items.map((it, i) => (
            <Reveal key={it.title} variant="up" delay={Math.min(i * 90, 300)}>
              <h3 className="pv-d-tracker-title">{it.title}</h3>
              <p className="pv-d-tracker-body">{it.body}</p>
            </Reveal>
          ))}
        </div>
        <div className="pv-d-tracker-foot">
          <Link href={TRACKER.href} className="pv-d-btn pv-d-btn--outline">
            <span>{TRACKER.cta}</span>
          </Link>
          <Link href={TRACKER.altHref} className="pv-d-tracker-alt">
            {TRACKER.altLink}
          </Link>
        </div>
      </SectionD>

      <SectionD alt label="Is this for me?" backdrop={BG_LIGHT_2} opacity={0.16} scrim="right">
        <OpenD
          eyebrow={IS_THIS_FOR_ME.eyebrow}
          lines={[IS_THIS_FOR_ME.headingLine1, <i key="em">{IS_THIS_FOR_ME.headingLine2}</i>]}
          maxWidth="20ch"
        />
        <MarkerListD items={IS_THIS_FOR_ME.items} marker="check" columns={2} />
      </SectionD>

      <SectionD label="Common questions">
        <OpenD
          eyebrow={COURSES_FAQ.eyebrow}
          lines={[COURSES_FAQ.heading]}
          aside={
            <Link href={COURSES_FAQ.allHref} className="pv-d-open-aside">
              {COURSES_FAQ.allLink}
            </Link>
          }
        />
        <QaListD items={COURSES_FAQ.items} />
      </SectionD>

      <ToneShift from="light" to="dark" />

      <SectionD tone="dark" label="Ready to start?" backdrop={BG_DARK} opacity={0.22} scrim="center">
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <OpenD
            eyebrow={COURSES_FINAL.eyebrow}
            lines={t.coursesFinalHeadline.replace(/\\n/g, "\n").split("\n")}
            lede={COURSES_FINAL.body}
            centre
          />
          <PriceBlockD
            now={`$${t.coursePrice}`}
            was={COURSE_REGULAR_PRICE_DISPLAY}
            cta={COURSES_FINAL.cta}
            href={COURSES_FINAL.href}
            ctaVariant="gold"
            noteLines={[COURSES_FINAL.note]}
            align="center"
          />
          <div className="pv-d-final-links">
            <Link href="/checkout?product=nutrition">
              Nutrition Foundations · {NUTRITION_COURSE_PRICE_DISPLAY} →
            </Link>
            <Link href="/checkout?product=bundle">Both Courses · {BUNDLE_PRICE_DISPLAY} →</Link>
          </div>
        </div>
      </SectionD>

      <FreeGuideTeaser />
    </PageShellD>
  )
}
