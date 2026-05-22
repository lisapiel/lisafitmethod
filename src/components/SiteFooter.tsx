"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { DEFAULTS, S3_SETTINGS_URL } from "@/lib/siteSettings"

const HIDDEN_PREFIXES = ["/admin", "/training-foundations"]
const DEFAULT_TAGLINE = DEFAULTS.text.footerTagline

export default function SiteFooter() {
  const pathname = usePathname()
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE)

  useEffect(() => {
    fetch(S3_SETTINGS_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { text?: { footerTagline?: string } } | null) => {
        const t = json?.text?.footerTagline
        if (t) setTagline(t)
      })
      .catch(() => {})
  }, [])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <footer
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "60px 48px 40px",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .footer-inner { flex-direction: column !important; gap: 40px !important; }
          .footer-inner { padding: 0 !important; }
        }
      `}</style>
      <div
        className="footer-inner"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 60,
        }}
      >
        <div>
          <p style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "#f0e6d3",
            marginBottom: 8,
          }}>
            Lisa Fit Method
          </p>
          <p style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 12,
            color: "rgba(240,230,211,0.4)",
            lineHeight: 1.6,
            maxWidth: 240,
          }}>
            {tagline}
          </p>
          <a
            href="https://instagram.com/lisafitmethod"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 16,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#c8a97e",
              textDecoration: "none",
            }}
          >
            @lisafitmethod ↗
          </a>
        </div>

        <nav style={{ display: "flex", gap: 64 }}>
          <div>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(240,230,211,0.3)",
              marginBottom: 16,
            }}>
              Site
            </p>
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/courses", label: "Courses" },
              { href: "/coaching", label: "Coaching" },
              { href: "/blog", label: "Blog" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: "block",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 12,
                  color: "rgba(240,230,211,0.55)",
                  textDecoration: "none",
                  marginBottom: 10,
                  transition: "color 0.2s",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <p style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(240,230,211,0.3)",
              marginBottom: 16,
            }}>
              Members
            </p>
            {[
              { href: "/login", label: "Member Login" },
              { href: "/checkout", label: "Get The Course" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: "block",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 12,
                  color: "rgba(240,230,211,0.55)",
                  textDecoration: "none",
                  marginBottom: 10,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "40px auto 0",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: 11,
          color: "rgba(240,230,211,0.25)",
        }}>
          © {new Date().getFullYear()} Lisa Fit Method. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Use" },
            { href: "/licensing", label: "Licensing & Copyright" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 11,
                color: "rgba(240,230,211,0.25)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
