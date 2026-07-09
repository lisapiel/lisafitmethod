"use client"

import { useRef, useState, useEffect, useCallback } from "react"

export type Testimonial = {
  id: string
  name: string
  context: string
  tag: string
  stars: number
  quote: string
  initials: string
  date: string
  dateIso: string
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article
      style={{
        background: "#fff",
        padding: "32px 28px",
        borderTop: "2px solid #c8a97e",
        boxShadow: "0 1px 20px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}>
        <div
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #c8a97e 0%, #a8895e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>
            {t.initials}
          </span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.3 }}>
            {t.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#6b6560", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            {t.context}
          </p>
        </div>
      </div>
      <blockquote
        style={{
          margin: 0, flex: 1,
          fontFamily: "var(--font-playfair), serif",
          fontSize: "calc(15px * var(--body-scale, 1))",
          fontStyle: "italic",
          color: "#1a1a1a",
          lineHeight: 1.75,
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </blockquote>
    </article>
  )
}

function NavButton({ onClick, disabled, direction }: { onClick: () => void; disabled: boolean; direction: "left" | "right" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous testimonials" : "Next testimonials"}
      style={{
        width: 36, height: 36,
        border: "1px solid rgba(200,169,126,0.45)",
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
        transition: "background 0.15s, border-color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,169,126,0.1)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {direction === "left"
          ? <path d="M15 18l-6-6 6-6" stroke="#c8a97e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M9 18l6-6-6-6" stroke="#c8a97e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </button>
  )
}

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateButtons()
    const onResize = () => updateButtons()
    window.addEventListener("resize", onResize)
    el.addEventListener("scroll", updateButtons, { passive: true })
    return () => {
      window.removeEventListener("resize", onResize)
      el.removeEventListener("scroll", updateButtons)
    }
  }, [updateButtons])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "right" ? el.clientWidth : -el.clientWidth, behavior: "smooth" })
  }

  return (
    <div>
      <style>{`
        .t-track { display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -ms-overflow-style: none; }
        .t-track::-webkit-scrollbar { display: none; }
        .t-item { flex-shrink: 0; width: calc((100% - 40px) / 3); scroll-snap-align: start; }
        @media (max-width: 860px) { .t-item { width: calc(100vw - 72px); } }
      `}</style>

      <div ref={scrollRef} className="t-track">
        {testimonials.map((t) => (
          <div key={t.id} className="t-item">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 16 }}>
        <NavButton onClick={() => scroll("left")} disabled={!canScrollLeft} direction="left" />
        <NavButton onClick={() => scroll("right")} disabled={!canScrollRight} direction="right" />
      </div>
    </div>
  )
}
