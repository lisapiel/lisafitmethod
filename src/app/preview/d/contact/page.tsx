import type { Metadata } from "next"
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift } from "@/components/preview/d/FlowD"
import { SectionD } from "@/components/preview/d/Sections"
import { ContactFormD } from "@/components/preview/d/ContactFormD.client"

export const metadata: Metadata = {
  title: "Contact — Direction D Preview",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BG_ARCH = "/preview/bg-arch.jpg"
const BG_LIGHT = "/preview/bg-light.jpg"

export default function PreviewContactPage() {
  return (
    <PageShellD>
      <style>{`
        .pv-d-contact-grid {
          display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
          gap: clamp(36px, 5vw, 96px); align-items: start;
        }
        @media (max-width: 860px) { .pv-d-contact-grid { grid-template-columns: 1fr; gap: var(--d-step-5); } }
        .pv-d-contact-social {
          display: inline-flex; align-items: center; gap: 11px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.88rem; font-weight: 500;
          color: var(--d-accent-dark); text-decoration: none;
          border-bottom: 1px solid rgba(168,137,94,0.35); padding-bottom: 3px;
          transition: color 420ms ease;
        }
        .pv-d-contact-social:hover { color: var(--d-text); }
        .pv-d-contact-social-icon { font-size: 1.1rem; }
        .pv-d-contact-aside {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.1vw, 1.05rem); line-height: 1.85;
          color: var(--d-muted); margin: 0 0 var(--d-step-4); max-width: 44ch;
        }
      `}</style>

      <PageHeroD
        eyebrow="Get in touch"
        headingLines={["Questions?", <i key="em">I&apos;m here.</i>]}
        backdrop={BG_ARCH}
      />

      <ToneShift from="dark" to="light" />

      <SectionD label="Contact" backdrop={BG_LIGHT} opacity={0.16} scrim="right">
        <div className="pv-d-contact-grid">
          <div>
            <Reveal variant="up">
              <p className="pv-d-contact-aside">
                Whether it&apos;s about the course, coaching, or just a question about training, feel
                free to reach out. I&apos;ll get back to you within 48 hours.
              </p>
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
          </div>
          <Reveal variant="up" delay={140}>
            <ContactFormD />
          </Reveal>
        </div>
      </SectionD>
    </PageShellD>
  )
}
