import { Reveal, RevealLines } from "../Reveal.client"
import { Atmosphere } from "./FlowD"
import { LISA_STATEMENT } from "./testimonialContent"

// Lisa's statement, carrying the page out of the hero.
//
// This is the slot the duplicated pathways section used to occupy. Rather
// than repeating the choice the hero has already offered, the page pauses on
// something Lisa actually says — and because the sentence is about having a
// plan, it sets up everything that follows: the story, then the courses that
// are the plan.
//
// It sits on paper rather than on the hero's black. A dark hero followed by
// a dark statement is some fourteen hundred pixels of night before the page
// opens at all; on warm white the quote becomes the first calm breath after
// the film, which suits the brand better and keeps the page light-led.
export function StatementD({ backdrop }: { backdrop?: string }) {
  return (
    <section className="pv-d-statement pv-d-light" data-tone="light" aria-label="A note from Lisa">
      <style>{`
        .pv-d-statement {
          position: relative; overflow: hidden;
          padding: clamp(72px, 9vw, 150px) var(--d-gutter);
        }
        .pv-d-statement-inner {
          position: relative; z-index: 2; max-width: 1020px; margin: 0 auto; text-align: center;
        }
        .pv-d-statement-mark {
          display: block; font-family: var(--font-playfair), serif;
          font-size: clamp(3rem, 6.5vw, 5.4rem); line-height: 0.6;
          color: rgba(168,137,94,0.38); user-select: none; margin-bottom: 0.14em;
        }
        .pv-d-statement-text {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.28rem, 2.5vw, 2.3rem); line-height: 1.42;
          color: var(--d-text); margin: 0 auto; max-width: 30ch; text-wrap: balance;
        }
        .pv-d-statement-cite {
          display: block; margin-top: var(--d-step-3); font-style: normal;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--d-accent-dark);
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="light" opacity={0.26} position="center 58%" />}

      <figure className="pv-d-statement-inner pv-d-above">
        <span className="pv-d-statement-mark" aria-hidden="true">
          &ldquo;
        </span>
        <blockquote className="pv-d-statement-text">
          <RevealLines lines={[LISA_STATEMENT.quote]} />
        </blockquote>
        <Reveal variant="up" delay={200}>
          <cite className="pv-d-statement-cite">{LISA_STATEMENT.attribution}</cite>
        </Reveal>
      </figure>
    </section>
  )
}
