"use client"

import { useId, useRef, useState } from "react"

const LONG_CHARS = 600
const LONG_LINES = 12
const COLLAPSED_LINES = 8

export function isLongMessage(body: string) {
  return body.length > LONG_CHARS || body.split("\n").length > LONG_LINES
}

export function CollapsibleBody({ body, lineHeight, toggleColor }: { body: string; lineHeight: number; toggleColor: string }) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const long = isLongMessage(body)
  const collapsed = long && !expanded
  const fade = "linear-gradient(to bottom, #000 65%, transparent)"

  function toggle() {
    setExpanded((v) => !v)
    if (expanded) requestAnimationFrame(() => buttonRef.current?.scrollIntoView({ block: "nearest" }))
  }

  return (
    <>
      <div
        id={id}
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          ...(collapsed ? { maxHeight: `${COLLAPSED_LINES * lineHeight}em`, overflow: "hidden", maskImage: fade, WebkitMaskImage: fade } : {}),
        }}
      >
        {body}
      </div>
      {long && (
        <button
          ref={buttonRef}
          type="button"
          className="lfm-thread-btn"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={toggle}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 36,
            marginTop: 4,
            padding: "0 2px",
            background: "none",
            border: "none",
            color: toggleColor,
            font: "inherit",
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
          }}
        >
          {expanded ? "Show less" : "Show full message"}
        </button>
      )}
    </>
  )
}
