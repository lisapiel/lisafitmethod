"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"
import { VIDEO_SLOTS, PHOTO_SLOTS } from "@/lib/videoSlots"

const gold = "#c9a96e"
const border = "#2a2a2a"

interface Stats {
  videosPublished: number
  videosDraft: number
  photosPublished: number
  photosDraft: number
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "0.75rem" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.5rem", fontWeight: 300, color: gold, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", marginTop: "0.5rem" }}>
        {sub}
      </p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.MediaAsset.list({ authMode: "userPool" }).then(({ data }) => {
      const videos = data.filter((a) => a.type === "VIDEO")
      const photos = data.filter((a) => a.type === "PHOTO")
      setStats({
        videosPublished: videos.filter((v) => v.isPublished).length,
        videosDraft: videos.filter((v) => !v.isPublished).length,
        photosPublished: photos.filter((p) => p.isPublished).length,
        photosDraft: photos.filter((p) => !p.isPublished).length,
      })
    })
  }, [])

  const totalVideoSlots = Object.keys(VIDEO_SLOTS).length
  const totalPhotoSlots = Object.keys(PHOTO_SLOTS).length

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Content Dashboard
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
        Manage videos and photos for lisafitmethod.com
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
        <StatCard label="Videos Live" value={stats?.videosPublished ?? 0} sub={`of ${totalVideoSlots} slots`} />
        <StatCard label="Videos Draft" value={stats?.videosDraft ?? 0} sub="uploaded, not published" />
        <StatCard label="Photos Live" value={stats?.photosPublished ?? 0} sub={`of ${totalPhotoSlots} slots`} />
        <StatCard label="Photos Draft" value={stats?.photosDraft ?? 0} sub="uploaded, not published" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Link href="/admin/videos" style={{ display: "block", background: "#161616", border: `1px solid ${border}`, padding: "2rem", textDecoration: "none" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem" }}>
            Manage →
          </p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "#f0e6d3" }}>
            Videos
          </p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", marginTop: "0.5rem" }}>
            Upload exercise videos to replace YouTube embeds across all training modules.
          </p>
        </Link>
        <Link href="/admin/photos" style={{ display: "block", background: "#161616", border: `1px solid ${border}`, padding: "2rem", textDecoration: "none" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem" }}>
            Manage →
          </p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "#f0e6d3" }}>
            Photos
          </p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", marginTop: "0.5rem" }}>
            Upload and manage photos for the landing page, module covers, and about section.
          </p>
        </Link>
      </div>
    </div>
  )
}
