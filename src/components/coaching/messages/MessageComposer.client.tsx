"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, FormEvent, KeyboardEvent } from "react"

const MAX_LINES = 6
const SEND_ERROR = "That didn't send. Check your connection and try again."

export type ComposerTheme = {
  font: string
  bar: CSSProperties
  inputBg: string
  inputBorder: string
  inputFg: string
  buttonBg: string
  buttonFg: string
  buttonIdleBg: string
  buttonIdleFg: string
  spinnerTrack: string
  error: string
  hint: string
}

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return coarse
}

export function MessageComposer({
  placeholder, label, onSend, onViewportChange, theme,
}: {
  placeholder: string
  label: string
  onSend: (text: string) => Promise<boolean>
  onViewportChange?: () => void
  theme: ComposerTheme
}) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const coarse = useCoarsePointer()
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const errorId = useId()
  const hintId = useId()
  const canSend = value.trim().length > 0 && !sending

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    const cs = window.getComputedStyle(el)
    const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5
    const borders = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    const max = lineHeight * MAX_LINES + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + borders
    el.style.height = "auto"
    const full = el.scrollHeight + borders
    el.style.height = `${Math.min(full, max)}px`
    el.style.overflowY = full > max + 1 ? "auto" : "hidden"
  }, [value])

  // Keeps the composer and newest message in view while the on-screen keyboard opens or closes.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      if (document.activeElement !== inputRef.current) return
      onViewportChange?.()
      formRef.current?.scrollIntoView({ block: "end" })
    }
    vv.addEventListener("resize", onResize)
    return () => vv.removeEventListener("resize", onResize)
  }, [onViewportChange])

  async function send() {
    const text = value.trim()
    if (!text || sending) return
    setSending(true)
    setError("")
    let ok = false
    try {
      ok = await onSend(text)
    } catch {
      ok = false
    }
    setSending(false)
    if (ok) {
      setValue("")
      if (!coarse) inputRef.current?.focus()
    } else {
      setError(SEND_ERROR)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (coarse || e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    send()
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} style={{ flexShrink: 0, ...theme.bar }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          ref={inputRef}
          className="lfm-thread-input"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError("") }}
          onKeyDown={onKeyDown}
          onFocus={onViewportChange}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={error ? errorId : coarse ? undefined : hintId}
          aria-invalid={error ? true : undefined}
          rows={1}
          enterKeyHint={coarse ? "enter" : "send"}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 44,
            background: theme.inputBg,
            border: `1px solid ${error ? theme.error : theme.inputBorder}`,
            borderRadius: 6,
            padding: "0.6rem 0.75rem",
            fontFamily: theme.font,
            fontSize: 16,
            lineHeight: 1.5,
            color: theme.inputFg,
            resize: "none",
            overflowY: "hidden",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          className="lfm-thread-btn"
          disabled={!canSend}
          aria-label={sending ? "Sending message" : "Send message"}
          aria-busy={sending || undefined}
          style={{
            background: canSend || sending ? theme.buttonBg : theme.buttonIdleBg,
            border: "none",
            borderRadius: 6,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canSend ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {sending ? (
            <span aria-hidden="true" style={{ width: 16, height: 16, border: `2px solid ${theme.spinnerTrack}`, borderTop: `2px solid ${theme.buttonFg}`, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          ) : (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l10-6-3 6 3 6-10-6Z" fill={canSend ? theme.buttonFg : theme.buttonIdleFg} />
            </svg>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" style={{ fontFamily: theme.font, fontSize: "0.8125rem", color: theme.error, margin: "6px 2px 0" }}>{error}</p>
      ) : !coarse ? (
        <p id={hintId} style={{ fontFamily: theme.font, fontSize: "0.6875rem", color: theme.hint, margin: "6px 2px 0" }}>Enter to send, Shift and Enter for a new line</p>
      ) : null}
    </form>
  )
}
