"use client"

import { useEffect, useRef, useState } from "react"
import { uploadData } from "aws-amplify/storage"
import { DEFAULTS, S3_SETTINGS_URL, type SiteSettings } from "@/lib/siteSettings"

const APPSYNC_URL =
  "https://kcr4zqjknjerveglimvj5ogi2m.appsync-api.us-east-2.amazonaws.com/graphql"
const APPSYNC_API_KEY = "da2-y44brrwzkncnhcjg6wxr23xnve"

const gold = "#c9a96e"
const border = "#2a2a2a"
const card = "#161616"

// ---------- helpers ----------

async function fetchPublishedPhotos(): Promise<Record<string, string>> {
  try {
    const res = await fetch(APPSYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": APPSYNC_API_KEY },
      body: JSON.stringify({
        query: `query {
          listMediaAssets(filter: {
            and: [{ isPublished: { eq: true } }, { type: { eq: PHOTO } }]
          }) { items { assignedTo url } }
        }`,
      }),
      cache: "no-store",
    })
    const json = await res.json()
    const items: Array<{ assignedTo: string; url: string }> =
      json.data?.listMediaAssets?.items ?? []
    const map: Record<string, string> = {}
    for (const item of items) {
      if (item.url) map[item.assignedTo] = item.url
    }
    return map
  } catch {
    return {}
  }
}

function parseObjPos(pos: string): [number, number] {
  const parts = pos.trim().split(/\s+/)
  const parse = (v: string) => {
    if (v === "center") return 50
    if (v === "top" || v === "left") return 0
    if (v === "bottom" || v === "right") return 100
    return parseInt(v) || 50
  }
  return [parse(parts[0] ?? "center"), parse(parts[1] ?? "center")]
}

// ---------- sub-components ----------

function SectionHeader({
  title,
  onReset,
}: {
  title: string
  onReset: () => void
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: `1px solid ${border}`,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {title}
      </p>
      <button
        onClick={onReset}
        style={{
          background: "none",
          border: `1px solid ${border}`,
          color: "#555",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.55rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "4px 12px",
          cursor: "pointer",
        }}
      >
        Reset to defaults
      </button>
    </div>
  )
}

function CropTool({
  label,
  photoUrl,
  value,
  onChange,
  heightPx,
}: {
  label: string
  photoUrl: string | undefined
  value: string
  onChange: (v: string) => void
  heightPx: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [x, y] = parseObjPos(value)

  function applyPosition(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)))
    const ny = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)))
    onChange(`${nx}% ${ny}%`)
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    applyPosition(e.clientX, e.clientY)
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (isDragging.current) applyPosition(e.clientX, e.clientY)
    }
    function onUp() { isDragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  })

  return (
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          color: "#888",
          marginBottom: 8,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 260,
          height: heightPx,
          cursor: "crosshair",
          overflow: "hidden",
          background: "#111",
          border: `1px solid ${border}`,
          userSelect: "none",
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: value,
              display: "block",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                color: "#444",
              }}
            >
              No photo published
            </p>
          </div>
        )}
        {/* focal point dot */}
        <div
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid white",
            background: "rgba(200,169,126,0.85)",
            pointerEvents: "none",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.6)",
            zIndex: 10,
          }}
        />
        {/* crosshair lines */}
        <div
          style={{
            position: "absolute",
            left: `${x}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(255,255,255,0.25)",
            pointerEvents: "none",
            transform: "translateX(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: `${y}%`,
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(255,255,255,0.25)",
            pointerEvents: "none",
            transform: "translateY(-50%)",
          }}
        />
      </div>
      <p
        style={{
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.55rem",
          color: "#555",
          marginTop: 6,
        }}
      >
        Click or drag to set focal point · {value}
      </p>
    </div>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}
      >
        <label
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            color: "#888",
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            color: gold,
          }}
        >
          {unit === "×" ? value.toFixed(2) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: gold }}
      />
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  hint?: string
}) {
  const base: React.CSSProperties = {
    width: "100%",
    background: "#0f0f0f",
    border: `1px solid ${border}`,
    color: "#f0e6d3",
    fontFamily: "var(--font-dm-sans), sans-serif",
    fontSize: "0.8rem",
    padding: "10px 12px",
    outline: "none",
    lineHeight: 1.6,
    boxSizing: "border-box",
    resize: "vertical",
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#666",
          marginBottom: 6,
        }}
      >
        {label}
        {hint && (
          <span style={{ color: "#444", marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
            {hint}
          </span>
        )}
      </label>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          style={base}
        />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={base} />
      )}
    </div>
  )
}

// ---------- main page ----------

export default function DesignPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Record<string, string>>({})

  // per-section state
  const [crops, setCrops] = useState(DEFAULTS.crops)
  const [sizes, setSizes] = useState(DEFAULTS.imageSizes)
  const [spacing, setSpacing] = useState(DEFAULTS.spacing)
  const [typography, setTypography] = useState(DEFAULTS.typography)
  const [colors, setColors] = useState(DEFAULTS.colors)
  const [text, setText] = useState(DEFAULTS.text)

  useEffect(() => {
    // load published photos for crop tool
    fetchPublishedPhotos().then(setPhotos)

    // load current settings from S3
    fetch(S3_SETTINGS_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: SiteSettings | null) => {
        if (!json) return
        if (json.crops) setCrops({ ...DEFAULTS.crops, ...json.crops })
        if (json.imageSizes) setSizes({ ...DEFAULTS.imageSizes, ...json.imageSizes })
        if (json.spacing) {
          setSpacing({
            home: { ...DEFAULTS.spacing.home, ...(json.spacing.home ?? {}) },
            about: { ...DEFAULTS.spacing.about, ...(json.spacing.about ?? {}) },
            courses: { ...DEFAULTS.spacing.courses, ...(json.spacing.courses ?? {}) },
          })
        }
        if (json.typography) setTypography({ ...DEFAULTS.typography, ...json.typography })
        if (json.colors) setColors({ ...DEFAULTS.colors, ...json.colors })
        if (json.text) setText({ ...DEFAULTS.text, ...json.text })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const settings: SiteSettings = {
      crops,
      imageSizes: sizes,
      spacing,
      typography,
      colors,
      text,
    }
    try {
      await uploadData({
        path: "media/settings.json",
        data: new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" }),
        options: { contentType: "application/json" },
      }).result
      setToast("Saved — changes will appear on the site within 60 seconds.")
      setTimeout(() => setToast(null), 6000)
    } catch (err) {
      console.error("Save failed:", err)
      setToast("Save failed — please try again.")
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: card,
    border: `1px solid ${border}`,
    padding: "28px 28px 20px",
    marginBottom: 24,
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 20,
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div
          style={{
            width: 28,
            height: 28,
            border: `2px solid ${border}`,
            borderTop: `2px solid ${gold}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "1.8rem",
              fontWeight: 300,
              color: "#f0e6d3",
              marginBottom: 4,
            }}
          >
            Design Panel
          </h1>
          <p
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem",
              color: "#555",
            }}
          >
            Changes go live on the site within ~60 seconds after saving.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "none" : gold,
            color: saving ? gold : "#0a0a0a",
            border: `1px solid ${gold}`,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "12px 28px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>

      {toast && (
        <div
          style={{
            background: toast.includes("failed") ? "#2a0a0a" : "#0a1a0a",
            border: `1px solid ${toast.includes("failed") ? "#c0392b" : gold}`,
            color: toast.includes("failed") ? "#e07070" : gold,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.7rem",
            padding: "12px 16px",
            marginBottom: 24,
          }}
        >
          {toast}
        </div>
      )}

      {/* 1. Colors & Typography */}
      <div style={sectionStyle}>
        <SectionHeader
          title="Colors & Typography"
          onReset={() => {
            setColors(DEFAULTS.colors)
            setTypography(DEFAULTS.typography)
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#666",
                marginBottom: 8,
              }}
            >
              Accent color
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="color"
                value={colors.accent}
                onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer" }}
              />
              <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#888" }}>
                {colors.accent}
              </span>
            </div>
          </div>
          <div>
            <RangeField
              label="Heading size"
              value={typography.headingScale}
              min={0.7}
              max={1.4}
              step={0.05}
              unit="×"
              onChange={(v) => setTypography({ ...typography, headingScale: v })}
            />
          </div>
          <div>
            <RangeField
              label="Body text size"
              value={typography.bodyScale}
              min={0.8}
              max={1.3}
              step={0.05}
              unit="×"
              onChange={(v) => setTypography({ ...typography, bodyScale: v })}
            />
          </div>
        </div>
      </div>

      {/* 2. Photo Crops & Sizes */}
      <div style={sectionStyle}>
        <SectionHeader
          title="Photo Crops & Sizes"
          onReset={() => {
            setCrops(DEFAULTS.crops)
            setSizes(DEFAULTS.imageSizes)
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.6rem",
            color: "#555",
            marginBottom: 24,
          }}
        >
          Click or drag on each photo to set the focal point (where the camera centers the crop).
        </p>
        <div style={gridStyle}>
          {[
            { key: "hero" as const, label: "Hero photo", h: 220, sz: { min: 400, max: 900 } },
            { key: "about_bio" as const, label: "About photo", h: 280, sz: { min: 300, max: 800 } },
            { key: "banner" as const, label: "Banner photo", h: 100, sz: { min: 120, max: 500 } },
          ].map(({ key, label, h, sz }) => (
            <div key={key}>
              <CropTool
                label={label}
                photoUrl={photos[key]}
                value={crops[key]}
                onChange={(v) => setCrops({ ...crops, [key]: v })}
                heightPx={h}
              />
              <RangeField
                label="Image height (px)"
                value={sizes[key]}
                min={sz.min}
                max={sz.max}
                step={20}
                unit="px"
                onChange={(v) => setSizes({ ...sizes, [key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Spacing */}
      <div style={sectionStyle}>
        <SectionHeader title="Section Spacing" onReset={() => setSpacing(DEFAULTS.spacing)} />
        <p
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.6rem",
            color: "#555",
            marginBottom: 24,
          }}
        >
          1× is the default spacing. Increase for more breathing room, decrease for a tighter layout.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          <div>
            <p
              style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                color: gold,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Home page
            </p>
            <RangeField
              label="Story section"
              value={spacing.home.story}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) => setSpacing({ ...spacing, home: { ...spacing.home, story: v } })}
            />
            <RangeField
              label="Course preview"
              value={spacing.home.coursePreview}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) =>
                setSpacing({ ...spacing, home: { ...spacing.home, coursePreview: v } })
              }
            />
            <RangeField
              label="Final CTA"
              value={spacing.home.cta}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) => setSpacing({ ...spacing, home: { ...spacing.home, cta: v } })}
            />
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                color: gold,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              About page
            </p>
            <RangeField
              label="Hero"
              value={spacing.about.hero}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) => setSpacing({ ...spacing, about: { ...spacing.about, hero: v } })}
            />
            <RangeField
              label="Story section"
              value={spacing.about.story}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) => setSpacing({ ...spacing, about: { ...spacing.about, story: v } })}
            />
            <RangeField
              label="Credentials"
              value={spacing.about.credentials}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) =>
                setSpacing({ ...spacing, about: { ...spacing.about, credentials: v } })
              }
            />
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                color: gold,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Courses page
            </p>
            <RangeField
              label="Hero"
              value={spacing.courses.hero}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) =>
                setSpacing({ ...spacing, courses: { ...spacing.courses, hero: v } })
              }
            />
            <RangeField
              label="Modules"
              value={spacing.courses.modules}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) =>
                setSpacing({ ...spacing, courses: { ...spacing.courses, modules: v } })
              }
            />
            <RangeField
              label="Final CTA"
              value={spacing.courses.cta}
              min={0.5}
              max={2.0}
              step={0.25}
              unit="×"
              onChange={(v) =>
                setSpacing({ ...spacing, courses: { ...spacing.courses, cta: v } })
              }
            />
          </div>
        </div>
      </div>

      {/* 4. Home Page Text */}
      <div style={sectionStyle}>
        <SectionHeader
          title="Home Page Text"
          onReset={() =>
            setText((t) => ({
              ...t,
              homeHeroHeadline: DEFAULTS.text.homeHeroHeadline,
              homeHeroSubtext: DEFAULTS.text.homeHeroSubtext,
              homeStoryHeadline: DEFAULTS.text.homeStoryHeadline,
              homeStoryPara1: DEFAULTS.text.homeStoryPara1,
              homeStoryPara2: DEFAULTS.text.homeStoryPara2,
              homeStoryPara3: DEFAULTS.text.homeStoryPara3,
              homeStoryQuote: DEFAULTS.text.homeStoryQuote,
              homeFinalHeadline: DEFAULTS.text.homeFinalHeadline,
              homeFinalSubtext: DEFAULTS.text.homeFinalSubtext,
              coursePrice: DEFAULTS.text.coursePrice,
            }))
          }
        />
        <div style={gridStyle}>
          <TextField
            label="Hero headline"
            hint="(use \\n for line breaks)"
            value={text.homeHeroHeadline}
            onChange={(v) => setText({ ...text, homeHeroHeadline: v })}
            multiline
          />
          <TextField
            label="Hero subtext"
            value={text.homeHeroSubtext}
            onChange={(v) => setText({ ...text, homeHeroSubtext: v })}
            multiline
          />
          <TextField
            label="Story section headline"
            value={text.homeStoryHeadline}
            onChange={(v) => setText({ ...text, homeStoryHeadline: v })}
            multiline
          />
          <TextField
            label="Story paragraph 1"
            value={text.homeStoryPara1}
            onChange={(v) => setText({ ...text, homeStoryPara1: v })}
            multiline
          />
          <TextField
            label="Story paragraph 2"
            value={text.homeStoryPara2}
            onChange={(v) => setText({ ...text, homeStoryPara2: v })}
            multiline
          />
          <TextField
            label="Story paragraph 3"
            value={text.homeStoryPara3}
            onChange={(v) => setText({ ...text, homeStoryPara3: v })}
            multiline
          />
          <TextField
            label="Story quote"
            value={text.homeStoryQuote}
            onChange={(v) => setText({ ...text, homeStoryQuote: v })}
            multiline
          />
          <TextField
            label="Final CTA headline"
            value={text.homeFinalHeadline}
            onChange={(v) => setText({ ...text, homeFinalHeadline: v })}
            multiline
          />
          <TextField
            label="Final CTA subtext"
            value={text.homeFinalSubtext}
            onChange={(v) => setText({ ...text, homeFinalSubtext: v })}
            multiline
          />
          <TextField
            label="Course price (display only — no $ sign)"
            value={text.coursePrice}
            onChange={(v) => setText({ ...text, coursePrice: v })}
          />
        </div>
      </div>

      {/* 5. About Page Text */}
      <div style={sectionStyle}>
        <SectionHeader
          title="About Page Text"
          onReset={() =>
            setText((t) => ({
              ...t,
              aboutHeroHeadline: DEFAULTS.text.aboutHeroHeadline,
              aboutHeroSubtext: DEFAULTS.text.aboutHeroSubtext,
              aboutPara1: DEFAULTS.text.aboutPara1,
              aboutPara2: DEFAULTS.text.aboutPara2,
              aboutPara3: DEFAULTS.text.aboutPara3,
              aboutPara4: DEFAULTS.text.aboutPara4,
              aboutPara5: DEFAULTS.text.aboutPara5,
              aboutQuote: DEFAULTS.text.aboutQuote,
              aboutCred1Label: DEFAULTS.text.aboutCred1Label,
              aboutCred1Body: DEFAULTS.text.aboutCred1Body,
              aboutCred2Label: DEFAULTS.text.aboutCred2Label,
              aboutCred2Body: DEFAULTS.text.aboutCred2Body,
              aboutCred3Label: DEFAULTS.text.aboutCred3Label,
              aboutCred3Body: DEFAULTS.text.aboutCred3Body,
            }))
          }
        />
        <div style={gridStyle}>
          <TextField
            label="Hero headline"
            value={text.aboutHeroHeadline}
            onChange={(v) => setText({ ...text, aboutHeroHeadline: v })}
            multiline
          />
          <TextField
            label="Hero subtext"
            value={text.aboutHeroSubtext}
            onChange={(v) => setText({ ...text, aboutHeroSubtext: v })}
            multiline
          />
          <TextField
            label="Story paragraph 1"
            value={text.aboutPara1}
            onChange={(v) => setText({ ...text, aboutPara1: v })}
            multiline
          />
          <TextField
            label="Story paragraph 2"
            value={text.aboutPara2}
            onChange={(v) => setText({ ...text, aboutPara2: v })}
            multiline
          />
          <TextField
            label="Story paragraph 3"
            value={text.aboutPara3}
            onChange={(v) => setText({ ...text, aboutPara3: v })}
            multiline
          />
          <TextField
            label="Story paragraph 4"
            value={text.aboutPara4}
            onChange={(v) => setText({ ...text, aboutPara4: v })}
            multiline
          />
          <TextField
            label="Story paragraph 5"
            value={text.aboutPara5}
            onChange={(v) => setText({ ...text, aboutPara5: v })}
            multiline
          />
          <TextField
            label="Quote"
            value={text.aboutQuote}
            onChange={(v) => setText({ ...text, aboutQuote: v })}
            multiline
          />
          <TextField
            label="Credential 1 — title"
            value={text.aboutCred1Label}
            onChange={(v) => setText({ ...text, aboutCred1Label: v })}
          />
          <TextField
            label="Credential 1 — body"
            value={text.aboutCred1Body}
            onChange={(v) => setText({ ...text, aboutCred1Body: v })}
            multiline
          />
          <TextField
            label="Credential 2 — title"
            value={text.aboutCred2Label}
            onChange={(v) => setText({ ...text, aboutCred2Label: v })}
          />
          <TextField
            label="Credential 2 — body"
            value={text.aboutCred2Body}
            onChange={(v) => setText({ ...text, aboutCred2Body: v })}
            multiline
          />
          <TextField
            label="Credential 3 — title"
            value={text.aboutCred3Label}
            onChange={(v) => setText({ ...text, aboutCred3Label: v })}
          />
          <TextField
            label="Credential 3 — body"
            value={text.aboutCred3Body}
            onChange={(v) => setText({ ...text, aboutCred3Body: v })}
            multiline
          />
        </div>
      </div>

      {/* 6. Courses Page Text */}
      <div style={sectionStyle}>
        <SectionHeader
          title="Courses Page Text"
          onReset={() =>
            setText((t) => ({
              ...t,
              coursesHeroHeadline: DEFAULTS.text.coursesHeroHeadline,
              coursesHeroSubtext: DEFAULTS.text.coursesHeroSubtext,
              mod1Title: DEFAULTS.text.mod1Title,
              mod1Desc: DEFAULTS.text.mod1Desc,
              mod2Title: DEFAULTS.text.mod2Title,
              mod2Desc: DEFAULTS.text.mod2Desc,
              mod3Title: DEFAULTS.text.mod3Title,
              mod3Desc: DEFAULTS.text.mod3Desc,
              mod4Title: DEFAULTS.text.mod4Title,
              mod4Desc: DEFAULTS.text.mod4Desc,
              coursesFinalHeadline: DEFAULTS.text.coursesFinalHeadline,
            }))
          }
        />
        <div style={gridStyle}>
          <TextField
            label="Hero headline"
            value={text.coursesHeroHeadline}
            onChange={(v) => setText({ ...text, coursesHeroHeadline: v })}
            multiline
          />
          <TextField
            label="Hero subtext"
            value={text.coursesHeroSubtext}
            onChange={(v) => setText({ ...text, coursesHeroSubtext: v })}
            multiline
          />
          <TextField
            label="Module 1 — title"
            value={text.mod1Title}
            onChange={(v) => setText({ ...text, mod1Title: v })}
          />
          <TextField
            label="Module 1 — description"
            value={text.mod1Desc}
            onChange={(v) => setText({ ...text, mod1Desc: v })}
            multiline
          />
          <TextField
            label="Module 2 — title"
            value={text.mod2Title}
            onChange={(v) => setText({ ...text, mod2Title: v })}
          />
          <TextField
            label="Module 2 — description"
            value={text.mod2Desc}
            onChange={(v) => setText({ ...text, mod2Desc: v })}
            multiline
          />
          <TextField
            label="Module 3 — title"
            value={text.mod3Title}
            onChange={(v) => setText({ ...text, mod3Title: v })}
          />
          <TextField
            label="Module 3 — description"
            value={text.mod3Desc}
            onChange={(v) => setText({ ...text, mod3Desc: v })}
            multiline
          />
          <TextField
            label="Module 4 — title"
            value={text.mod4Title}
            onChange={(v) => setText({ ...text, mod4Title: v })}
          />
          <TextField
            label="Module 4 — description"
            value={text.mod4Desc}
            onChange={(v) => setText({ ...text, mod4Desc: v })}
            multiline
          />
          <TextField
            label="Final CTA headline"
            value={text.coursesFinalHeadline}
            onChange={(v) => setText({ ...text, coursesFinalHeadline: v })}
            multiline
          />
        </div>
      </div>

      {/* 7. Coaching Page Text */}
      <div style={sectionStyle}>
        <SectionHeader
          title="Coaching Page Text"
          onReset={() =>
            setText((t) => ({
              ...t,
              coachingHeroHeadline: DEFAULTS.text.coachingHeroHeadline,
              coachingHeroSubtext: DEFAULTS.text.coachingHeroSubtext,
              coachingFeature1Title: DEFAULTS.text.coachingFeature1Title,
              coachingFeature1Body: DEFAULTS.text.coachingFeature1Body,
              coachingFeature2Title: DEFAULTS.text.coachingFeature2Title,
              coachingFeature2Body: DEFAULTS.text.coachingFeature2Body,
              coachingFeature3Title: DEFAULTS.text.coachingFeature3Title,
              coachingFeature3Body: DEFAULTS.text.coachingFeature3Body,
              coachingFeature4Title: DEFAULTS.text.coachingFeature4Title,
              coachingFeature4Body: DEFAULTS.text.coachingFeature4Body,
              coachingFormHeadline: DEFAULTS.text.coachingFormHeadline,
              coachingFormSubtext: DEFAULTS.text.coachingFormSubtext,
            }))
          }
        />
        <div style={gridStyle}>
          <TextField
            label="Hero headline"
            value={text.coachingHeroHeadline}
            onChange={(v) => setText({ ...text, coachingHeroHeadline: v })}
            multiline
          />
          <TextField
            label="Hero subtext"
            value={text.coachingHeroSubtext}
            onChange={(v) => setText({ ...text, coachingHeroSubtext: v })}
            multiline
          />
          <TextField
            label="Feature 1 — title"
            value={text.coachingFeature1Title}
            onChange={(v) => setText({ ...text, coachingFeature1Title: v })}
          />
          <TextField
            label="Feature 1 — body"
            value={text.coachingFeature1Body}
            onChange={(v) => setText({ ...text, coachingFeature1Body: v })}
            multiline
          />
          <TextField
            label="Feature 2 — title"
            value={text.coachingFeature2Title}
            onChange={(v) => setText({ ...text, coachingFeature2Title: v })}
          />
          <TextField
            label="Feature 2 — body"
            value={text.coachingFeature2Body}
            onChange={(v) => setText({ ...text, coachingFeature2Body: v })}
            multiline
          />
          <TextField
            label="Feature 3 — title"
            value={text.coachingFeature3Title}
            onChange={(v) => setText({ ...text, coachingFeature3Title: v })}
          />
          <TextField
            label="Feature 3 — body"
            value={text.coachingFeature3Body}
            onChange={(v) => setText({ ...text, coachingFeature3Body: v })}
            multiline
          />
          <TextField
            label="Feature 4 — title"
            value={text.coachingFeature4Title}
            onChange={(v) => setText({ ...text, coachingFeature4Title: v })}
          />
          <TextField
            label="Feature 4 — body"
            value={text.coachingFeature4Body}
            onChange={(v) => setText({ ...text, coachingFeature4Body: v })}
            multiline
          />
          <TextField
            label="Form headline"
            value={text.coachingFormHeadline}
            onChange={(v) => setText({ ...text, coachingFormHeadline: v })}
            multiline
          />
          <TextField
            label="Form subtext"
            value={text.coachingFormSubtext}
            onChange={(v) => setText({ ...text, coachingFormSubtext: v })}
            multiline
          />
        </div>
      </div>

      {/* 8. Footer Text */}
      <div style={sectionStyle}>
        <SectionHeader
          title="Footer Text"
          onReset={() =>
            setText((t) => ({ ...t, footerTagline: DEFAULTS.text.footerTagline }))
          }
        />
        <div style={{ maxWidth: 480 }}>
          <TextField
            label="Tagline (under Lisa Fit Method logo)"
            value={text.footerTagline}
            onChange={(v) => setText({ ...text, footerTagline: v })}
            multiline
          />
        </div>
      </div>

      {/* bottom save */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, paddingBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "none" : gold,
            color: saving ? gold : "#0a0a0a",
            border: `1px solid ${gold}`,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "12px 28px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  )
}
