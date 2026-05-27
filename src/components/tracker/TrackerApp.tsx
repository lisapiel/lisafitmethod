"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import { TrackerHeader, TrackerTab } from "./TrackerHeader"
import { WorkoutTabView } from "./WorkoutTabView"
import { ProgressTab } from "./ProgressTab"
import { CoursesTab } from "./CoursesTab"
import { SettingsView } from "./SettingsView"
import { HomeScreenPrompt } from "./HomeScreenPrompt"

export function TrackerApp() {
  const { ready } = useTracker()
  const [activeTab, setActiveTab] = useState<TrackerTab>("workout")
  const [showSettings, setShowSettings] = useState(false)

  if (!ready) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #2a2a2a", borderTop: "2px solid #c9a96e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <TrackerHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettings={() => setShowSettings(true)}
      />

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" as unknown as undefined }}>
        {activeTab === "workout" && <WorkoutTabView />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "courses" && <CoursesTab />}
      </div>

      {showSettings && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "#0a0a0a", overflowY: "auto" }}>
          <SettingsView onBack={() => setShowSettings(false)} />
        </div>
      )}

      <HomeScreenPrompt />
    </>
  )
}
