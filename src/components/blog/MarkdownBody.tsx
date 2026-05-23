import Link from "next/link"
import type { ReactNode } from "react"

// Parses inline markdown: **bold** and [text](url)
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match
  let n = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const tok = match[0]
    if (tok.startsWith("**")) {
      parts.push(<strong key={`${keyPrefix}-b${n++}`}>{tok.slice(2, -2)}</strong>)
    } else {
      const m = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (m) {
        const isExternal = /^https?:\/\//.test(m[2])
        parts.push(
          isExternal ? (
            <a
              key={`${keyPrefix}-a${n++}`}
              href={m[2]}
              target="_blank"
              rel="noopener noreferrer"
            >
              {m[1]}
            </a>
          ) : (
            <Link key={`${keyPrefix}-a${n++}`} href={m[2]}>
              {m[1]}
            </Link>
          )
        )
      }
    }
    lastIndex = match.index + tok.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

// Renders inline content with \n converted to <br />
function renderInlineWithBreaks(text: string, blockKey: string): ReactNode {
  const lines = text.split("\n")
  if (lines.length === 1) return <>{renderInline(text, blockKey)}</>
  return (
    <>
      {lines.map((line, i) => (
        <span key={`${blockKey}-l${i}`}>
          {renderInline(line, `${blockKey}-l${i}`)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

const BULLET_RE = /^[-*•] /

// Renders a blog body string with basic markdown support:
//   ## heading / ### heading
//   **bold**
//   [text](url) internal or external links
//   - item / * item / • item  (all on \n-separated lines within one \n\n block → <ul>)
//   \n\n = paragraph break, \n = line break within a paragraph
export default function MarkdownBody({ body }: { body: string }) {
  const blocks = body.split("\n\n").filter(Boolean)

  return (
    <>
      {blocks.map((block, i) => {
        const key = `b${i}`

        if (block.startsWith("### ")) {
          return <h3 key={key}>{renderInlineWithBreaks(block.slice(4), key)}</h3>
        }
        if (block.startsWith("## ") || block.startsWith("# ")) {
          const content = block.startsWith("## ") ? block.slice(3) : block.slice(2)
          return <h2 key={key}>{renderInlineWithBreaks(content, key)}</h2>
        }

        // Bullet list: multiple lines all starting with - * or •
        const lines = block.split("\n")
        if (lines.length > 1 && lines.every(l => BULLET_RE.test(l))) {
          return (
            <ul key={key}>
              {lines.map((line, j) => (
                <li key={j}>
                  {renderInlineWithBreaks(line.replace(BULLET_RE, ""), `${key}-li${j}`)}
                </li>
              ))}
            </ul>
          )
        }

        return <p key={key}>{renderInlineWithBreaks(block, key)}</p>
      })}
    </>
  )
}
