import Link from "next/link"
import Image from "next/image"

interface Asset {
  url?: string | null
  isPublished: boolean
  title: string
}

interface SlotCardProps {
  slotKey: string
  label: string
  type: "VIDEO" | "PHOTO"
  asset?: Asset | null
}

const gold = "#c9a96e"
const border = "#2a2a2a"

function StatusBadge({ asset }: { asset?: Asset | null }) {
  if (!asset) {
    return (
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Not uploaded
      </span>
    )
  }
  if (!asset.isPublished) {
    return (
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Draft
      </span>
    )
  }
  return (
    <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
      ● Live
    </span>
  )
}

export default function SlotCard({ slotKey, label, type, asset }: SlotCardProps) {
  const uploadHref = `/admin/upload?slot=${slotKey}&type=${type}`

  return (
    <div
      style={{
        background: "#161616",
        border: `1px solid ${border}`,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {type === "PHOTO" && asset?.url && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#0a0a0a" }}>
          <Image src={asset.url} alt={label} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.25rem" }}>
            {label}
          </p>
          <code style={{ fontSize: "0.6rem", color: "#555", fontFamily: "monospace" }}>{slotKey}</code>
        </div>
        <StatusBadge asset={asset} />
      </div>
      <Link
        href={uploadHref}
        style={{
          display: "inline-block",
          background: asset ? "none" : gold,
          color: asset ? gold : "#0a0a0a",
          border: `1px solid ${gold}`,
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.6rem",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textDecoration: "none",
          padding: "0.5rem 1rem",
          textAlign: "center",
        }}
      >
        {asset ? "Replace / Manage" : "Upload"}
      </Link>
    </div>
  )
}
