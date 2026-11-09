"use client"

import { useState, useEffect, useCallback, use } from "react"
import type { CSSProperties } from "react"
import { coachThreadId } from "@/lib/coachThreadKey"
import { fetchAuthSession } from "aws-amplify/auth"
import { MessageThread, ThreadStyles } from "@/components/coaching/messages/MessageThread.client"
import type { NutritionKind, ThreadMessage, ThreadTheme } from "@/components/coaching/messages/MessageThread.client"
import { MessageComposer } from "@/components/coaching/messages/MessageComposer.client"
import type { ComposerTheme } from "@/components/coaching/messages/MessageComposer.client"
import { useThreadScroll } from "@/components/coaching/messages/useThreadScroll"
import { useFitToViewport } from "@/components/coaching/messages/useFitToViewport"

const gold = "var(--ca-accent-mark)"
const border = "var(--ca-line)"
const cream = "var(--ca-text)"
const muted = "var(--ca-muted)"
const sans = "var(--font-montserrat), sans-serif"
const ADMIN_EMAILS = new Set(["lisa.p.mcpherson@gmail.com", "contact@lisafitmethod.com"])

const threadTheme: ThreadTheme = {
  font: sans,
  bodySize: "0.875rem",
  metaSize: "0.75rem",
  mineBg: gold,
  mineFg: "var(--ca-surface)",
  otherBg: "var(--ca-line)",
  otherFg: cream,
  kindMine: "var(--ca-surface)",
  kindOther: gold,
  kindSize: "0.75rem",
  toggleMine: "var(--ca-surface)",
  toggleOther: cream,
  avatarBg: "var(--ca-line)",
  avatarBorder: border,
  avatarFg: muted,
  avatarSize: "0.75rem",
  line: border,
  muted,
  imageBg: "rgba(0,0,0,0.35)",
  imageMaxHeight: 360,
  imageMinCol: 140,
  bubbleMaxWidth: "min(80%, 40rem)",
}

const composerTheme: ComposerTheme = {
  font: sans,
  bar: { background: "var(--ca-raised)", borderTop: `1px solid ${border}`, padding: "0.75rem clamp(12px, 3vw, 2rem)" },
  inputBg: "var(--ca-surface)",
  inputBorder: border,
  inputFg: cream,
  buttonBg: gold,
  buttonFg: "var(--ca-surface)",
  buttonIdleBg: "var(--ca-line)",
  buttonIdleFg: muted,
  spinnerTrack: muted,
  error: "var(--ca-danger)",
  hint: muted,
}

function Spinner() {
  return (
    <div role="status" aria-label="Loading messages" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  )
}

export default function AdminClientMessagesPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = use(params)
  const clientEmail = decodeURIComponent(encodedEmail)
  const threadId = coachThreadId(clientEmail)

  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState("")
  const [clientName, setClientName] = useState("")
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const { listRef, onScroll, keepPinned, markSent } = useThreadScroll(messages.length, !loading)
  const { ref: panelRef, height: panelHeight } = useFitToViewport(!loading)

  const loadMessages = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`/api/admin/coaching/messages/${encodeURIComponent(threadId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setMessages(
        (data.messages ?? []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          fromEmail: m.fromEmail as string,
          body: m.body as string,
          sentAt: m.sentAt as string,
          readAt: (m.readAt as string | null) ?? null,
          kind: (m.kind as NutritionKind | undefined) ?? undefined,
          attachmentS3Keys: (m.attachmentS3Keys as string | undefined) ?? undefined,
        }))
      )
    } catch { /* handled by layout */ }
  }, [threadId])

  useEffect(() => {
    async function init() {
      try {
        const session = await fetchAuthSession()
        const accessToken = session.tokens?.accessToken?.toString() ?? ""
        setToken(accessToken)
        if (!accessToken) return

        const clientsRes = await fetch("/api/admin/coaching/clients", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (clientsRes.ok) {
          const data = await clientsRes.json()
          const match = (data.clients ?? []).find(
            (c: { email: string; displayName: string }) => c.email.toLowerCase() === clientEmail.toLowerCase()
          )
          if (match) setClientName(match.displayName)
        }

        await loadMessages(accessToken)
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    init()
  }, [clientEmail, loadMessages])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => loadMessages(token), 30_000)
    const onFocus = () => loadMessages(token)
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [token, loadMessages])

  async function send(text: string) {
    if (!token) return false
    try {
      const res = await fetch(`/api/admin/coaching/messages/${encodeURIComponent(threadId)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, toEmail: clientEmail }),
      })
      if (!res.ok) return false
      markSent()
      await loadMessages(token)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const name = clientName || clientEmail

  return (
    <div ref={panelRef} style={{ height: panelHeight != null ? `${panelHeight}px` : "min(calc(100dvh - 96px), 760px)", background: "var(--ca-surface)", color: cream, fontFamily: sans, display: "flex", flexDirection: "column", minWidth: 0, ...({ "--lfm-focus": "var(--ca-focus)" } as CSSProperties) }}>
      <ThreadStyles />
      {loading ? <Spinner /> : (
        <>
          <MessageThread
            messages={messages}
            isMine={(msg) => ADMIN_EMAILS.has(msg.fromEmail.toLowerCase())}
            senderName={(mine) => (mine ? "You" : name)}
            avatarInitial={name.charAt(0).toUpperCase()}
            theme={threadTheme}
            listRef={listRef}
            onScroll={onScroll}
            label={`Conversation with ${name}`}
            empty={
              <div style={{ background: "var(--ca-raised)", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem 1.5rem", textAlign: "center", marginTop: "1rem" }}>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: muted, margin: 0 }}>No messages yet in this thread</p>
              </div>
            }
            style={{ padding: "0.5rem clamp(12px, 3vw, 2rem) 1rem" }}
          />
          <MessageComposer
            placeholder={`Message ${name}`}
            label={`Write a message to ${name}`}
            onSend={send}
            onViewportChange={keepPinned}
            theme={composerTheme}
          />
        </>
      )}
    </div>
  )
}
