// The live /faq page, in Direction D.
import Link from "next/link"
import { FAQ_CATEGORIES } from "@/app/faq/content"
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift } from "@/components/preview/d/FlowD"
import { SectionD, OpenD } from "@/components/preview/d/Sections"
import { AccordionD } from "@/components/preview/d/AccordionD.client"
import { FAQ_HEAD, FAQ_CTA } from "@/components/preview/d/content/faqPage"

const BG_ARCH = "/preview/bg-arch.jpg"
const BG_LIGHT = "/preview/bg-light.jpg"
const BG_DARK = "/preview/bg-dark.jpg"

export function FaqPageD() {
  return (
    <PageShellD>
      <style>{`
        /* A sticky category label beside its questions, so the reader always
           knows which group they are in on a page this long. */
        .pv-d-faq-group {
          display: grid; grid-template-columns: 210px minmax(0, 1fr);
          gap: clamp(20px, 3vw, 56px);
          padding-top: var(--d-step-5);
        }
        .pv-d-faq-group + .pv-d-faq-group { margin-top: var(--d-step-5); }
        @media (max-width: 900px) {
          .pv-d-faq-group { grid-template-columns: 1fr; gap: var(--d-step-3); padding-top: var(--d-step-4); }
        }
        .pv-d-faq-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--d-accent-dark);
          margin: 0;
        }
        @media (min-width: 901px) {
          .pv-d-faq-label { position: sticky; top: 120px; }
        }
        .pv-d-faq-cards {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: clamp(28px, 3.6vw, 64px);
        }
        @media (max-width: 860px) { .pv-d-faq-cards { grid-template-columns: 1fr; gap: var(--d-step-4); } }
        .pv-d-faq-card { padding-top: var(--d-step-3); border-top: 1px solid var(--d-rule-dark); position: relative; }
        .pv-d-faq-card-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--d-accent);
          margin: 0 0 var(--d-step-2);
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .pv-d-faq-badge {
          font-size: 8.5px; letter-spacing: 0.16em; color: var(--d-black);
          background: var(--d-accent); padding: 3px 8px;
        }
        .pv-d-faq-card-h {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.2rem, 1.7vw, 1.55rem); line-height: 1.3;
          color: var(--d-off-white); margin: 0 0 var(--d-step-2);
        }
        .pv-d-faq-card-b {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.86rem, 0.98vw, 0.94rem); line-height: 1.78;
          color: rgba(245,242,238,0.55); margin: 0 0 var(--d-step-3);
        }
        .pv-d-faq-card-actions { display: flex; align-items: center; gap: var(--d-step-3); flex-wrap: wrap; }
        .pv-d-faq-card-sec {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.08em;
          color: rgba(200,169,126,0.7); text-decoration: none;
        }
        .pv-d-faq-card-sec:hover { color: var(--d-accent); }
        .pv-d-faq-card-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          color: rgba(245,242,238,0.3); margin: var(--d-step-2) 0 0;
        }
        .pv-d-faq-foot {
          margin-top: var(--d-step-5); padding-top: var(--d-step-4);
          border-top: 1px solid var(--d-rule-dark); text-align: center;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: rgba(245,242,238,0.3);
        }
        .pv-d-faq-foot a { color: var(--d-accent); text-decoration: none; }
      `}</style>

      <PageHeroD
        eyebrow={FAQ_HEAD.eyebrow}
        headingLines={[FAQ_HEAD.heading]}
        lede={FAQ_HEAD.lede}
        backdrop={BG_ARCH}
      />

      <ToneShift from="dark" to="light" />

      <SectionD label="Questions by topic" backdrop={BG_LIGHT} opacity={0.14} scrim="edges">
        {FAQ_CATEGORIES.map((category) => (
          <div key={category.label} className="pv-d-faq-group">
            <p className="pv-d-faq-label">{category.label}</p>
            <AccordionD
              items={category.items.map((it) => ({ q: it.q, a: it.a }))}
              idPrefix={`faq-${category.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            />
          </div>
        ))}
      </SectionD>

      <ToneShift from="light" to="dark" />

      <SectionD tone="dark" label="Ready to start?" backdrop={BG_DARK} opacity={0.2} scrim="center">
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <OpenD
            eyebrow={FAQ_CTA.eyebrow}
            lines={[FAQ_CTA.heading]}
            lede={FAQ_CTA.lede}
            centre
          />
        </div>
        <div className="pv-d-faq-cards">
          {FAQ_CTA.cards.map((card, i) => (
            <Reveal key={card.label} variant="up" delay={Math.min(i * 90, 300)} className="pv-d-faq-card">
              <p className="pv-d-faq-card-label">
                <span>{card.label}</span>
                {"badge" in card && card.badge && <span className="pv-d-faq-badge">{card.badge}</span>}
              </p>
              <h3 className="pv-d-faq-card-h">{card.headline}</h3>
              <p className="pv-d-faq-card-b">{card.body}</p>
              <div className="pv-d-faq-card-actions">
                <Link href={card.href} className="pv-d-btn pv-d-btn--gold">
                  <span>{card.cta}</span>
                </Link>
                {"secondary" in card && card.secondary && card.secondaryHref && (
                  <Link href={card.secondaryHref} className="pv-d-faq-card-sec">
                    {card.secondary}
                  </Link>
                )}
              </div>
              {"note" in card && card.note && <p className="pv-d-faq-card-note">{card.note}</p>}
            </Reveal>
          ))}
        </div>
        <p className="pv-d-faq-foot">
          {FAQ_CTA.footLead}
          <Link href={FAQ_CTA.footHref}>{FAQ_CTA.footLink}</Link>
        </p>
      </SectionD>
    </PageShellD>
  )
}
