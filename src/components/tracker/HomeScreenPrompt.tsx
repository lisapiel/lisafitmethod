"use client"
import { useEffect, useState } from "react"

const DISMISSED_KEY = "lfm_tracker_hsprompt_dismissed"

export function HomeScreenPrompt() {
  const [show, setShow] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem(DISMISSED_KEY)) return

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true
    if (isStandalone) return

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (!isMobile) return

    const android = /Android/i.test(navigator.userAgent)
    setIsAndroid(android)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler)

    setShow(true)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setShow(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") dismiss()
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div style={{
      background: "#111111",
      borderTop: "1px solid rgba(201,169,110,0.2)",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, color: "#c9a96e", flexShrink: 0 }}>↑</span>
      <span style={{ fontSize: 11, color: "#666", lineHeight: 1.4, flex: 1 }}>
        {isAndroid && deferredPrompt
          ? "Install the tracker as an app on your phone."
          : "Tap Share → Add to Home Screen to install this tracker on your phone."}
      </span>
      {isAndroid && deferredPrompt && (
        <button
          onClick={handleInstall}
          style={{ background: "#c9a96e", border: "none", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 12px", cursor: "pointer", flexShrink: 0 }}
        >
          Install
        </button>
      )}
      <button
        onClick={dismiss}
        style={{ background: "none", border: "none", color: "#333", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
