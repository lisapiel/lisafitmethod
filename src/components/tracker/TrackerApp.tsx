"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import { TrackerHeader } from "./TrackerHeader"
import { DaysListView } from "./DaysListView"
import { LoggingView } from "./LoggingView"
import { ManageDayView } from "./ManageDayView"
import { SettingsView } from "./SettingsView"
import { PromoFooter } from "./PromoFooter"
import { HomeScreenPrompt } from "./HomeScreenPrompt"

export type View =
  | { kind: "days" }
  | { kind: "log"; dayId: string }
  | { kind: "manage"; dayId: string }
  | { kind: "settings" }

export function TrackerApp() {
  const { ready } = useTracker()
  const [view, setView] = useState<View>({ kind: "days" })

  if (!ready) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #2a2a2a", borderTop: "2px solid #c9a96e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const goBack = () => setView({ kind: "days" })

  const headerTitle =
    view.kind === "log" ? "Log Workout" :
    view.kind === "manage" ? "Manage Day" :
    view.kind === "settings" ? "Settings" :
    "My Tracker"

  const showBack = view.kind !== "days"

  return (
    <>
      <TrackerHeader
        title={headerTitle}
        showBack={showBack}
        onBack={goBack}
        onSettings={() => setView({ kind: "settings" })}
        showSettings={view.kind === "days"}
      />

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" as unknown as undefined }}>
        {view.kind === "days" && (
          <DaysListView
            onLog={(dayId) => setView({ kind: "log", dayId })}
            onManage={(dayId) => setView({ kind: "manage", dayId })}
          />
        )}
        {view.kind === "log" && (
          <LoggingView dayId={view.dayId} onBack={goBack} />
        )}
        {view.kind === "manage" && (
          <ManageDayView dayId={view.dayId} onBack={goBack} />
        )}
        {view.kind === "settings" && (
          <SettingsView onBack={goBack} />
        )}
      </div>

      <HomeScreenPrompt />
      <PromoFooter />
    </>
  )
}
