"use client"

import type { CSSProperties, ReactNode, Ref, UIEventHandler } from "react"
import { attachmentKeys, SignedImage } from "@/components/coaching/NutritionComposer.client"
import { CollapsibleBody } from "./CollapsibleBody.client"
import { formatClock, formatFull, groupThread } from "./threadGroups"

export type NutritionKind = "nutrition-meal" | "nutrition-day" | "nutrition-question"

const NUTRITION_KIND_LABEL: Record<NutritionKind, string> = {
  "nutrition-meal": "Nutrition · Meal",
  "nutrition-day": "Nutrition · Day of eating",
  "nutrition-question": "Nutrition · Question",
}

export type ThreadMessage = {
  id: string
  fromEmail: string
  body: string
  sentAt: string
  readAt: string | null
  kind?: NutritionKind
  attachmentS3Keys?: string
}

export type ThreadTheme = {
  font: string
  bodySize: string
  metaSize: string
  mineBg: string
  mineFg: string
  otherBg: string
  otherFg: string
  kindMine: string
  kindOther: string
  kindSize: string
  toggleMine: string
  toggleOther: string
  avatarBg: string
  avatarBorder: string
  avatarFg: string
  avatarSize: string
  line: string
  muted: string
  imageBg: string
  imageMaxHeight: number
  imageMinCol: number
  bubbleMaxWidth: string
}

const LINE_HEIGHT = 1.55

const srOnly: CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden",
  clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
}

export function ThreadStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      .lfm-thread-btn:focus-visible, .lfm-thread-input:focus-visible { outline: 2px solid var(--lfm-focus); outline-offset: 2px; }
    `}</style>
  )
}

export function MessageThread({
  messages, isMine, senderName, avatarInitial, theme, listRef, onScroll, empty, label, style,
}: {
  messages: ThreadMessage[]
  isMine: (msg: ThreadMessage) => boolean
  senderName: (mine: boolean) => string
  avatarInitial: string
  theme: ThreadTheme
  listRef: Ref<HTMLDivElement>
  onScroll: UIEventHandler<HTMLDivElement>
  empty: ReactNode
  label: string
  style: CSSProperties
}) {
  const days = groupThread(messages)

  return (
    <div
      ref={listRef}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
      aria-label={label}
      tabIndex={0}
      className="lfm-thread-btn"
      style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", ...style }}
    >
      {messages.length === 0 ? empty : days.map((day) => (
        <section key={day.key} aria-label={day.label}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.5rem 0 1rem" }}>
            <div style={{ flex: 1, height: 1, background: theme.line }} />
            <h2 style={{ fontFamily: theme.font, fontSize: theme.metaSize, fontWeight: 500, color: theme.muted, letterSpacing: "0.08em", margin: 0, flexShrink: 0 }}>{day.label}</h2>
            <div style={{ flex: 1, height: 1, background: theme.line }} />
          </div>
          {day.runs.map((run) => {
            const mine = isMine(run.messages[0])
            const name = senderName(mine)
            const last = run.messages[run.messages.length - 1]
            return (
              <div key={run.key} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: "0.9rem" }}>
                {!mine && (
                  <div aria-hidden="true" style={{ width: 30, height: 30, borderRadius: "50%", background: theme.avatarBg, border: `1.5px solid ${theme.avatarBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, alignSelf: "flex-end", marginBottom: 20 }}>
                    <span style={{ fontFamily: theme.font, fontSize: theme.avatarSize, fontWeight: 700, color: theme.avatarFg }}>{avatarInitial}</span>
                  </div>
                )}
                <div style={{ maxWidth: theme.bubbleMaxWidth, minWidth: 0, display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 }}>
                  {run.messages.map((msg, i) => {
                    const imageKeys = attachmentKeys(msg.attachmentS3Keys)
                    const kindLabel = msg.kind ? NUTRITION_KIND_LABEL[msg.kind] : null
                    const first = i === 0
                    const lastInRun = i === run.messages.length - 1
                    const tail = mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px"
                    const mid = mine ? "12px 4px 4px 12px" : "4px 12px 12px 4px"
                    const radius = lastInRun ? (first ? tail : mine ? "12px 4px 2px 12px" : "4px 12px 12px 2px") : first ? (mine ? "12px 12px 4px 12px" : "12px 12px 12px 4px") : mid
                    return (
                      <div
                        key={msg.id}
                        title={formatFull(msg.sentAt)}
                        style={{
                          maxWidth: "100%",
                          minWidth: 0,
                          background: mine ? theme.mineBg : theme.otherBg,
                          color: mine ? theme.mineFg : theme.otherFg,
                          borderRadius: radius,
                          padding: "0.6rem 0.9rem",
                          fontFamily: theme.font,
                          fontSize: theme.bodySize,
                          lineHeight: LINE_HEIGHT,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span style={srOnly}>{name}, {formatFull(msg.sentAt)}:</span>
                        {kindLabel && (
                          <p style={{ fontFamily: theme.font, fontSize: theme.kindSize, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: mine ? theme.kindMine : theme.kindOther, margin: "0 0 6px" }}>
                            {kindLabel}
                          </p>
                        )}
                        {imageKeys.length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: imageKeys.length === 1 ? "1fr" : `repeat(auto-fit, minmax(min(${theme.imageMinCol}px, 100%), 1fr))`, gap: 6, marginBottom: msg.body ? 8 : 0 }}>
                            {imageKeys.map((k) => (
                              <div key={k} style={{ borderRadius: 6, overflow: "hidden", background: theme.imageBg, aspectRatio: imageKeys.length === 1 ? "auto" : "4 / 3" }}>
                                <SignedImage s3Key={k} style={{ width: "100%", height: "100%", display: "block", maxHeight: theme.imageMaxHeight, objectFit: "cover" }} />
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.body && <CollapsibleBody body={msg.body} lineHeight={LINE_HEIGHT} toggleColor={mine ? theme.toggleMine : theme.toggleOther} />}
                      </div>
                    )
                  })}
                  <p aria-hidden="true" style={{ fontFamily: theme.font, fontSize: theme.metaSize, color: theme.muted, margin: "1px 4px 0" }}>
                    {mine ? "" : `${name} · `}<time dateTime={last.sentAt}>{formatClock(last.sentAt)}</time>
                  </p>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
