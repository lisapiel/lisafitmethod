"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

const NEAR_BOTTOM_PX = 120

export function useThreadScroll(count: number, ready: boolean) {
  const listRef = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  const initialDone = useRef(false)
  const forceNext = useRef(false)

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" })
    pinned.current = true
  }, [])

  const onScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
  }, [])

  const keepPinned = useCallback(() => {
    if (pinned.current) scrollToBottom(false)
  }, [scrollToBottom])

  const markSent = useCallback(() => {
    forceNext.current = true
  }, [])

  useLayoutEffect(() => {
    if (!ready) return
    if (!initialDone.current) {
      initialDone.current = true
      scrollToBottom(false)
      return
    }
    if (forceNext.current || pinned.current) {
      forceNext.current = false
      scrollToBottom(true)
    }
  }, [count, ready, scrollToBottom])

  // Photos load after the first scroll and push the newest message out of view.
  useEffect(() => {
    const el = listRef.current
    if (!el || !ready) return
    el.addEventListener("load", keepPinned, true)
    return () => el.removeEventListener("load", keepPinned, true)
  }, [ready, keepPinned])

  return { listRef, onScroll, keepPinned, markSent }
}
