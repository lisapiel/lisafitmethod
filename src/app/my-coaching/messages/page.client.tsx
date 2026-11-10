"use client"

import { useState, useEffect, useCallback } from "react"
import type { CSSProperties } from "react"
import { MessageThread, ThreadStyles } from "@/components/coaching/messages/MessageThread.client"
import type { ThreadMessage, ThreadTheme } from "@/components/coaching/messages/MessageThread.client"
import { MessageComposer } from "@/components/coaching/messages/MessageComposer.client"
import type { ComposerTheme } from "@/components/coaching/messages/MessageComposer.client"
import { useThreadScroll } from "@/components/coaching/messages/useThreadScroll"

const accent = "#c8a97e"
const accentInk = "#a8895e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"
const sans = "var(--font-dm-sans), sans-serif"

type Message = ThreadMessage & { toEmail: string }

const threadTheme: ThreadTheme = {
  font: sans,
  bodySize: "0.9375rem",
  metaSize: "0.6875rem",
  mineBg: black,
  mineFg: white,
  otherBg: "#f5f2ee",
  otherFg: black,
  kindMine: accent,
  kindOther: accentInk,
  kindSize: "0.625rem",
  toggleMine: accent,
  toggleOther: black,
  avatarBg: `${accent}18`,
  avatarBorder: accent,
  avatarFg: accentInk,
  avatarSize: "0.6875rem",
  line: border,
  muted,
  imageBg: "rgba(0,0,0,0.08)",
  imageMaxHeight: 320,
  imageMinCol: 120,
  bubbleMaxWidth: "min(80%, 34rem)",
}

const composerTheme: ComposerTheme = {
  font: sans,
  bar: { background: white, border: `1px solid ${border}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: "0.75rem" },
  inputBg: "#faf8f5",
  inputBorder: border,
  inputFg: black,
  buttonBg: black,
  buttonFg: white,
  buttonIdleBg: "#f0ece8",
  buttonIdleFg: "#aaa",
  spinnerTrack: "#888",
  error: "#b4483a",
  hint: muted,
}

function Spinner() {
  return (
    <div role="status" aria-label="Loading messages" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <ThreadStyles />
      </div>
    </div>
  )
}

function EmptyThread() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "2rem" }}>
      <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", background: `${accent}18`, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 4h16v11H13l-4 3.5V15H3V4Z" stroke={accent} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      </div>
      <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", color: black, margin: "0 0 8px" }}>Ask me anything</p>
      <p style={{ fontFamily: sans, fontSize: "0.875rem", color: muted, margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
        Questions, wins, anything that hurts or feels off. I reply within a day or two.
      </p>
    </div>
  )
}

export default function MessagesClient() {
  const [loading, setLoading] = useState(true)
  const [myEmail, setMyEmail] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const { listRef, onScroll, keepPinned, markSent } = useThreadScroll(messages.length, !loading)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/coaching/messages")
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { /* network error */ }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/member/access")
        const data = await res.json()
        if (data.email) setMyEmail(data.email)
      } catch { /* ignore */ }
      await loadMessages()
      setLoading(false)
    }
    init()
  }, [loadMessages])

  useEffect(() => {
    if (!myEmail) return
    const interval = setInterval(loadMessages, 30_000)
    const onFocus = () => loadMessages()
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [myEmail, loadMessages])

  async function send(text: string) {
    try {
      const res = await fetch("/api/coaching/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) return false
      markSent()
      await loadMessages()
      return true
    } catch {
      return false
    }
  }

  if (loading) return <Spinner />

  const isMine = (msg: ThreadMessage) => (myEmail ? msg.fromEmail.toLowerCase() === myEmail.toLowerCase() : false)

  return (
    <div className="coaching-messages-pane" style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 58px - 4rem)", minWidth: 0, ...({ "--lfm-focus": accentInk } as CSSProperties) }}>
      <ThreadStyles />
      <style>{`
        @media (max-width: 768px) {
          .coaching-messages-pane {
            height: calc(100dvh - 58px - env(safe-area-inset-top) - 2rem - 64px - env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
      <div style={{ marginBottom: "1.25rem", flexShrink: 0 }}>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>Messages</h1>
      </div>

      <MessageThread
        messages={messages}
        isMine={isMine}
        senderName={(mine) => (mine ? "You" : "Lisa")}
        avatarInitial="L"
        theme={threadTheme}
        listRef={listRef}
        onScroll={onScroll}
        label="Conversation with Lisa"
        mediaViewer="client"
        empty={<EmptyThread />}
        style={{ background: white, border: `1px solid ${border}`, borderRadius: "8px 8px 0 0", padding: "0.5rem clamp(10px, 3vw, 1.25rem) 1rem" }}
      />

      <MessageComposer
        placeholder="Message me"
        label="Write a message to Lisa"
        onSend={send}
        onViewportChange={keepPinned}
        theme={composerTheme}
      />
    </div>
  )
}
