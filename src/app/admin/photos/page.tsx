"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import SlotCard from "@/components/admin/SlotCard"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Asset = { assignedTo: string; url?: string | null; isPublished: boolean; title: string }

const GROUPS: { label: string; where: string; keys: string[]; labels: Record<string, string> }[] = [
  {
    label: "Landing Page: Home (lisafitmethod.com)",
    where: "These photos appear on the public home page that visitors see before buying.",
    keys: ["hero", "banner", "testimonials"],
    labels: {
      hero: "Hero photo",
      banner: "Banner strip",
      testimonials: "Testimonials screenshot",
    },
  },
  {
    label: "Module Covers",
    where: "Cover photos for the training module pages inside the course (not yet wired up: coming soon).",
    keys: ["module1_cover", "module2_cover", "module3_cover", "module4_cover"],
    labels: {
      module1_cover: "Module 1: Foundation Movements",
      module2_cover: "Module 2: Core & Glute Priority",
      module3_cover: "Module 3: The 4-Week Program",
      module4_cover: "Module 4: Nutrition Foundations",
    },
  },
  {
    label: "About",
    where: "Bio / about photo (not yet wired up: coming soon).",
    keys: ["about_bio"],
    labels: {
      about_bio: "About / bio photo",
    },
  },
]

const WHERE_DETAIL: Record<string, string> = {
  hero: "Right half of the hero section at the top of the home page. Tall portrait format. You're visible head-to-toe or head-to-waist.",
  banner: "Full-width horizontal strip that appears between 'Why this exists' and 'What's inside'. Wide landscape format.",
  testimonials: "Screenshot section below the preview video. Shows social proof. Can be a composite of multiple testimonials.",
}

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
    }).catch(() => {})
  }, [])

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Photos
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
        Upload and publish photos for the site. Published photos go live immediately.
      </p>

      {GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: "3.5rem" }}>
          <h2 style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: gold,
            marginBottom: "0.4rem",
            paddingBottom: "0.5rem",
            borderBottom: `1px solid ${border}`,
          }}>
            {group.label}
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: "1.25rem", lineHeight: 1.6 }}>
            {group.where}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {group.keys.map((key) => (
              <div key={key}>
                {WHERE_DETAIL[key] && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#444", marginBottom: "0.4rem", lineHeight: 1.5 }}>
                    {WHERE_DETAIL[key]}
                  </p>
                )}
                <SlotCard
                  slotKey={key}
                  label={group.labels[key] ?? key}
                  type="PHOTO"
                  asset={assetMap[key] ?? null}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
