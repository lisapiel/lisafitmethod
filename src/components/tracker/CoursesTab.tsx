"use client"
import Link from "next/link"

const cream = "#f0e6d3"
const gold = "#c9a96e"
const muted = "#555"
const border = "#1e1e1e"

const links = [
  { label: "Training Foundations", description: "Your current program — modules, workout tracker, and progress.", href: "/training-foundations", external: false },
  { label: "Browse All Courses", description: "See everything Lisa offers.", href: "/courses", external: false },
  { label: "1:1 Coaching", description: "Work with Lisa directly.", href: "/coaching", external: false },
  { label: "@lisafitmethod", description: "Instagram — workouts, tips, behind the scenes.", href: "https://www.instagram.com/lisafitmethod", external: true },
]

export function CoursesTab() {
  return (
    <div style={{ padding: "24px 16px 48px" }}>
      <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 16 }}>
        Lisa Fit Method
      </p>
      <div style={{ border: `1px solid ${border}`, background: "#0d0d0d" }}>
        {links.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderTop: i > 0 ? `1px solid ${border}` : "none",
              textDecoration: "none",
            }}
          >
            <div>
              <p style={{ fontSize: "0.7rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 500, marginBottom: 3 }}>
                {link.label}
              </p>
              <p style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5 }}>
                {link.description}
              </p>
            </div>
            <span style={{ color: gold, fontSize: "1.1rem", marginLeft: 12, flexShrink: 0 }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
