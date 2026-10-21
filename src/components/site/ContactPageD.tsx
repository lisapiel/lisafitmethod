// The live /contact page, in Direction D.
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift } from "@/components/preview/d/FlowD"
import { SectionD } from "@/components/preview/d/Sections"
import { ContactFormD } from "@/components/preview/d/ContactFormD.client"

const BG_ARCH = "/preview/bg-arch.jpg"
const BG_LIGHT = "/preview/bg-light.jpg"

export function ContactPageD() {
  return (
    <PageShellD>
      <style>{`
        /* Contact is a two-element page: a greeting and a form. At the full
           hero height it read as a large empty room, so the opening is
           shortened here and carries the invitation and the Instagram link
           rather than leaving them to rattle around below it. Scoped to this
           page: every other page keeps the standard opening. */
        .pv-d-contact-page .pv-d-phero {
          padding-top: clamp(118px, 14vh, 168px);
          padding-bottom: clamp(52px, 6vw, 84px);
        }
        .pv-d-contact-page .pv-d-section { padding-top: clamp(56px, 6vw, 92px); }
        .pv-d-contact-social {
          display: inline-flex; align-items: center; gap: 11px; margin-top: var(--d-step-4);
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.88rem; font-weight: 500;
          color: var(--d-accent); text-decoration: none;
          border-bottom: 1px solid rgba(200,169,126,0.35); padding-bottom: 3px;
          transition: color 420ms ease;
        }
        .pv-d-contact-social:hover { color: var(--d-off-white); }
        .pv-d-contact-social-icon { font-size: 1.1rem; }
        .pv-d-contact-form { max-width: 760px; }
      `}</style>

      <div className="pv-d-contact-page">
        <PageHeroD
          eyebrow="Get in touch"
          headingLines={["Questions?", <i key="em">I&apos;m here.</i>]}
          lede="Whether it's about the course, coaching, or just a question about training, feel free to reach out. I'll get back to you within 48 hours."
          backdrop={BG_ARCH}
        >
          <Reveal variant="up" delay={240}>
            <a
              href="https://instagram.com/lisafitmethod"
              target="_blank"
              rel="noopener noreferrer"
              className="pv-d-contact-social"
            >
              <span className="pv-d-contact-social-icon" aria-hidden="true">
                📸
              </span>
              @lisafitmethod on Instagram
            </a>
          </Reveal>
        </PageHeroD>

        <ToneShift from="dark" to="light" />

        <SectionD label="Send a message" backdrop={BG_LIGHT} opacity={0.16} scrim="right">
          <Reveal variant="up">
            <div className="pv-d-contact-form">
              <ContactFormD />
            </div>
          </Reveal>
        </SectionD>
      </div>
    </PageShellD>
  )
}
