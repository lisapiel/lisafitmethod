import type React from "react"

// The gold inline-link style used inside FAQ answers. Shared so the answer
// content and the page that renders it cannot drift apart.
export const GOLD_LINK: React.CSSProperties = {
  color: "#a8895e",
  textDecoration: "underline",
  textUnderlineOffset: 2,
}
