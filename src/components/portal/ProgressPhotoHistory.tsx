"use client"

import { ProgressPhotoStrip } from "@/components/coaching/ProgressPhotoStrip.client"
import type { StoredPhoto } from "@/lib/progressPhotos"

const sans = "var(--font-dm-sans), sans-serif"

// Progress photos from check-ins, newest first. Hidden when there are none.
export function ProgressPhotoHistory({ entries }: { entries: Array<{ id: string; date: string; photos: StoredPhoto[] }> }) {
  if (entries.length === 0) return null
  return (
    <section aria-labelledby="photo-history-heading" style={{ background: "#fff", border: "1px solid #e8e2dc", borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
      <h2 id="photo-history-heading" style={{ fontFamily: sans, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b6560", margin: "0 0 4px" }}>
        Progress photos
      </h2>
      <p style={{ fontFamily: sans, fontSize: "0.8rem", color: "#6b6560", margin: "0 0 14px" }}>From your check-ins. Private to you and me.</p>
      <div style={{ display: "grid", gap: 16 }}>
        {entries.map((e) => (
          <div key={e.id}>
            <p style={{ fontFamily: sans, fontSize: "0.75rem", fontWeight: 600, color: "#1a1a1a", margin: "0 0 6px" }}>
              {new Date(e.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <ProgressPhotoStrip photos={e.photos} viewer="client" size={88} />
          </div>
        ))}
      </div>
    </section>
  )
}
