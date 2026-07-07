"use client"

import { useEffect, useState } from "react"

const gold = "#c9a96e"
const border = "#2a2a2a"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const STORAGE_KEY = "lfm-admin-install-hint-dismissed"

// Shows a one-time install prompt on the admin coaching dashboard:
// - On Android/desktop Chrome: uses the native beforeinstallprompt event to
//   trigger the install flow with a single tap.
// - On iOS Safari: shows a manual "Share → Add to Home Screen" instruction
//   card because iOS doesn't expose the prompt event.
// Dismissable and remembers the dismissal in localStorage.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem(STORAGE_KEY) === "1") return

    // Already installed / running standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    const ua = window.navigator.userAgent
    const iOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)
    setIsIOS(iOS)

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)

    if (iOS) setVisible(true)

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, "1") } catch { /* ignore */ }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!visible) return null

  return (
    <div style={{
      background: "#161616", border: `1px solid ${gold}44`, borderRadius: 4,
      padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex",
      alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, margin: "0 0 4px" }}>
          📲 Install as app
        </p>
        {isIOS ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#ccc", margin: 0, lineHeight: 1.55 }}>
            Tap the <strong>Share</strong> icon in Safari, then <strong>&ldquo;Add to Home Screen&rdquo;</strong>. LFM Coaching will live on your phone like a native app.
          </p>
        ) : (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#ccc", margin: 0, lineHeight: 1.55 }}>
            Install LFM Coaching on your phone — one-tap access to messages, check-ins, and clients.
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {deferred && (
          <button onClick={install} style={{
            background: gold, color: "#0a0a0a", border: "none", padding: "9px 20px",
            fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem",
            fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
          }}>Install</button>
        )}
        <button onClick={dismiss} style={{
          background: "transparent", color: "#888", border: `1px solid ${border}`,
          padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem", cursor: "pointer",
        }}>Dismiss</button>
      </div>
    </div>
  )
}
