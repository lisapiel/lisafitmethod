"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import SlotCard from "@/components/admin/SlotCard"
import type { Schema } from "@/lib/amplifyConfig"
import { PHOTO_SLOTS } from "@/lib/videoSlots"


type Asset = { assignedTo: string; url?: string | null; isPublished: boolean; title: string }

export default function AdminPhotosPage() {
  const [assetMap, setAssetMap] = useState<Record<string, Asset>>({})

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.MediaAsset.list({
      filter: { type: { eq: "PHOTO" } },
      authMode: "userPool",
    }).then(({ data }) => {
      const map: Record<string, Asset> = {}
      for (const a of data) {
        map[a.assignedTo] = { assignedTo: a.assignedTo, url: a.url, isPublished: a.isPublished, title: a.title }
      }
      setAssetMap(map)
    })
  }, [])

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Photos
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
        Upload photos for key sections of the site. Published photos appear live immediately.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {Object.entries(PHOTO_SLOTS).map(([key, label]) => (
          <SlotCard
            key={key}
            slotKey={key}
            label={label}
            type="PHOTO"
            asset={assetMap[key] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
