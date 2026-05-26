import Link from "next/link"

export function PromoFooter() {
  return (
    <div
      style={{
        borderTop: "1px solid #161616",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        flexShrink: 0,
        background: "#0a0a0a",
      }}
    >
      <a
        href="https://lisafitmethod.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 9, color: "#3a3a3a", textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        lisafitmethod.com
      </a>
      <span style={{ color: "#1e1e1e", fontSize: 9 }}>·</span>
      <Link
        href="/courses"
        style={{ fontSize: 9, color: "#3a3a3a", textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        Courses
      </Link>
      <span style={{ color: "#1e1e1e", fontSize: 9 }}>·</span>
      <Link
        href="/coaching"
        style={{ fontSize: 9, color: "#3a3a3a", textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        1:1 Coaching
      </Link>
      <span style={{ color: "#1e1e1e", fontSize: 9 }}>·</span>
      <Link
        href="/training-foundations"
        style={{ fontSize: 9, color: "#3a3a3a", textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        My Course
      </Link>
    </div>
  )
}
