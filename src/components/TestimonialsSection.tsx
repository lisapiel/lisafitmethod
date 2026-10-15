import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { getPublishedPhotoUrl, getPublishedVideoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings, computeVideoCropCSS } from "@/lib/siteSettings"
import type { TestimonialRecord } from "@/app/api/admin/testimonials/route"

async function getPublishedTestimonials(): Promise<TestimonialRecord[]> {
  try {
    const db = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.COGNITO_REGION ?? "us-east-2",
        credentials: {
          accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
        },
      })
    )
    const result = await db.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE ?? "lfm-user-progress",
        FilterExpression: "begins_with(userId, :prefix) AND #s = :published",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":prefix": "testimonial_", ":published": "published" },
      })
    )
    return (result.Items ?? [])
      .map((item) => item as Record<string, unknown>)
      .filter((item) => typeof item.id === "string")
      .map((item) => ({
        id: item.id as string,
        clientName: (item.clientName as string) ?? "",
        clientDescription: (item.clientDescription as string) ?? "",
        type: (item.type as "transformation" | "experience") ?? "experience",
        headline: (item.headline as string) ?? "",
        writtenTestimonial: (item.writtenTestimonial as string) ?? "",
        featuredQuote: (item.featuredQuote as string) ?? "",
        metrics: (item.metrics as TestimonialRecord["metrics"]) ?? [],
        photoSlotBefore: (item.photoSlotBefore as string) ?? "",
        photoSlotProgress: (item.photoSlotProgress as string) ?? "",
        photoSlotPortrait: (item.photoSlotPortrait as string) ?? "",
        videoSlot: (item.videoSlot as string) ?? "",
        displayOrder: (item.displayOrder as number) ?? 0,
        status: "published" as const,
        createdAt: (item.createdAt as string) ?? "",
        updatedAt: (item.updatedAt as string) ?? "",
      } satisfies TestimonialRecord))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  } catch {
    return []
  }
}

export async function TestimonialsSection() {
  const [testimonials, settings] = await Promise.all([
    getPublishedTestimonials(),
    fetchSiteSettings(),
  ])

  if (testimonials.length === 0) return null

  const allSlots = new Set<string>()
  for (const t of testimonials) {
    if (t.photoSlotBefore) allSlots.add(t.photoSlotBefore)
    if (t.photoSlotProgress) allSlots.add(t.photoSlotProgress)
    if (t.photoSlotPortrait) allSlots.add(t.photoSlotPortrait)
    if (t.videoSlot) allSlots.add(t.videoSlot)
  }

  const mediaMap: Record<string, string | null> = {}
  await Promise.all(
    [...allSlots].map(async (slot) => {
      const isVideo = slot.startsWith("testimonial_") && testimonials.some((t) => t.videoSlot === slot)
      if (isVideo) {
        mediaMap[slot] = await getPublishedVideoUrl(slot)
      } else {
        mediaMap[slot] = await getPublishedPhotoUrl(slot)
      }
    })
  )

  const crops = settings.crops

  return (
    <section
      style={{ background: "var(--off-white, #f5f2ee)", padding: "100px 48px" }}
      className="testimonials-real"
      aria-label="Client testimonials"
    >
      <style>{`
        @media (max-width: 768px) {
          .testimonials-real { padding: 72px 20px !important; }
          .testimonial-transformation-grid { flex-direction: column !important; }
          .testimonial-photos-row { flex-direction: column !important; }
          .testimonial-metrics-row { gap: 12px !important; }
          .testimonial-metric-tile { flex: 1 1 calc(50% - 6px) !important; min-width: 0 !important; }
          .testimonial-experience-inner { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .testimonial-metric-tile { flex: 1 1 100% !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#a8895e", marginBottom: 14, fontFamily: "var(--font-dm-sans), sans-serif",
          }}>
            Real results
          </p>
          <h2 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "calc(clamp(28px, 3.2vw, 44px) * var(--heading-scale, 1))",
            fontWeight: 700, color: "#0a0a0a", lineHeight: 1.15, margin: "0 auto 16px",
          }}>
            Real People. Real Progress.
          </h2>
          <p style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "calc(15px * var(--body-scale, 1))",
            color: "#6b6560", maxWidth: 460, margin: "0 auto", lineHeight: 1.65,
          }}>
            Real progress starts with a plan that fits your life. Here&rsquo;s what personalized training can look like.
          </p>
        </div>

        {/* Testimonial cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {testimonials.map((t) =>
            t.type === "transformation"
              ? <TransformationCard key={t.id} t={t} mediaMap={mediaMap} crops={crops} videoCrops={settings.videoCrops} />
              : <ExperienceCard key={t.id} t={t} mediaMap={mediaMap} crops={crops} />
          )}
        </div>
      </div>
    </section>
  )
}

type CropsType = Awaited<ReturnType<typeof fetchSiteSettings>>["crops"]
type VideoCropsType = Awaited<ReturnType<typeof fetchSiteSettings>>["videoCrops"]

function TransformationCard({
  t,
  mediaMap,
  crops,
  videoCrops,
}: {
  t: TestimonialRecord
  mediaMap: Record<string, string | null>
  crops: CropsType
  videoCrops?: VideoCropsType
}) {
  const videoUrl = t.videoSlot ? (mediaMap[t.videoSlot] ?? null) : null
  const beforeUrl = t.photoSlotBefore ? (mediaMap[t.photoSlotBefore] ?? null) : null
  const progressUrl = t.photoSlotProgress ? (mediaMap[t.photoSlotProgress] ?? null) : null
  const savedVideoCrop = videoCrops?.[t.videoSlot ?? ""]
  const videoCropStyle = savedVideoCrop ? computeVideoCropCSS(savedVideoCrop, 3 / 4) : null
  const beforeCrop = (crops as Record<string, string>)[t.photoSlotBefore ?? ""] ?? "center 20%"
  const progressCrop = (crops as Record<string, string>)[t.photoSlotProgress ?? ""] ?? "center 20%"

  const hasMedia = videoUrl || beforeUrl || progressUrl

  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid rgba(168,137,94,0.12)",
        overflow: "hidden",
      }}
    >
      <div
        className="testimonial-transformation-grid"
        style={{ display: "flex", alignItems: "stretch" }}
      >
        {/* Left: media column */}
        {hasMedia && (
          <div style={{ flexShrink: 0, width: 340, background: "#0a0a0a", position: "relative" }}>
            {/* Video */}
            {videoUrl && (
              <div style={{ position: "relative", width: "100%", paddingBottom: "133.33%", overflow: "hidden" }}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  style={videoCropStyle ?? {
                    position: "absolute", inset: 0, width: "100%", height: "100%",
                    objectFit: "cover", background: "#0a0a0a",
                  }}
                />
              </div>
            )}
            {/* Before / Progress photos */}
            {(beforeUrl || progressUrl) && (
              <div
                className="testimonial-photos-row"
                style={{ display: "flex", gap: 2, padding: videoUrl ? "2px 0 0" : 0 }}
              >
                {beforeUrl && (
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ position: "relative", paddingBottom: "133.33%", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={beforeUrl}
                        alt={`${t.clientName} — before coaching`}
                        style={{
                          position: "absolute", inset: 0, width: "100%", height: "100%",
                          objectFit: "cover", objectPosition: beforeCrop,
                        }}
                      />
                      <div style={{
                        position: "absolute", bottom: 8, left: 8,
                        background: "rgba(10,10,10,0.72)", color: "#f0e6d3",
                        fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem",
                        fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "4px 8px",
                      }}>
                        Before coaching
                      </div>
                    </div>
                  </div>
                )}
                {progressUrl && (
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ position: "relative", paddingBottom: "133.33%", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={progressUrl}
                        alt={`${t.clientName} — 3 months into coaching`}
                        style={{
                          position: "absolute", inset: 0, width: "100%", height: "100%",
                          objectFit: "cover", objectPosition: progressCrop,
                        }}
                      />
                      <div style={{
                        position: "absolute", bottom: 8, left: 8,
                        background: "rgba(10,10,10,0.72)", color: "#f0e6d3",
                        fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem",
                        fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "4px 8px",
                      }}>
                        3 months in
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right: content */}
        <div style={{ flex: 1, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {t.headline && (
            <h3 style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "calc(clamp(18px, 1.6vw, 24px) * var(--heading-scale, 1))",
              fontWeight: 700, color: "#0a0a0a", lineHeight: 1.25, marginBottom: 20,
            }}>
              {t.headline}
            </h3>
          )}

          {/* Metrics */}
          {t.metrics.length > 0 && (
            <div
              className="testimonial-metrics-row"
              style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}
            >
              {t.metrics.map((m, i) => (
                <div
                  key={i}
                  className="testimonial-metric-tile"
                  style={{
                    flex: "1 1 calc(33% - 9px)", minWidth: 90,
                    background: "#f5f2ee", border: "1px solid rgba(168,137,94,0.15)",
                    padding: "14px 16px", textAlign: "center",
                  }}
                >
                  <p style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: "1.35rem", fontWeight: 700, color: "#0a0a0a", marginBottom: 2, lineHeight: 1,
                  }}>
                    {m.value}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: "0.65rem", color: "#6b6560", fontWeight: 500, letterSpacing: "0.08em",
                  }}>
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Featured quote */}
          {t.featuredQuote && (
            <blockquote style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "calc(clamp(14px, 1.1vw, 17px) * var(--body-scale, 1))",
              fontStyle: "italic", color: "#1a1a1a", lineHeight: 1.65,
              borderLeft: "2px solid #c8a97e", paddingLeft: 20,
              margin: "0 0 20px",
            }}>
              &ldquo;{t.featuredQuote}&rdquo;
            </blockquote>
          )}

          {/* Attribution */}
          <p style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#a8895e",
          }}>
            {t.clientName}{t.clientDescription ? ` | ${t.clientDescription}` : ""}
          </p>
        </div>
      </div>
    </article>
  )
}

function ExperienceCard({
  t,
  mediaMap,
  crops,
}: {
  t: TestimonialRecord
  mediaMap: Record<string, string | null>
  crops: CropsType
}) {
  const portraitUrl = t.photoSlotPortrait ? (mediaMap[t.photoSlotPortrait] ?? null) : null
  const portraitCrop = (crops as Record<string, string>)[t.photoSlotPortrait ?? ""] ?? "center 20%"

  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid rgba(168,137,94,0.12)",
        padding: "40px 44px",
        maxWidth: 840,
      }}
    >
      <div className="testimonial-experience-inner" style={{ display: "flex", gap: 36, alignItems: "center" }}>
        {portraitUrl && (
          <div style={{ flexShrink: 0, width: 120, height: 120, borderRadius: "50%", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitUrl}
              alt={`${t.clientName}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: portraitCrop }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          {t.featuredQuote && (
            <blockquote style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "calc(clamp(15px, 1.2vw, 18px) * var(--body-scale, 1))",
              fontStyle: "italic", color: "#1a1a1a", lineHeight: 1.65,
              margin: "0 0 18px",
            }}>
              &ldquo;{t.featuredQuote}&rdquo;
            </blockquote>
          )}
          <p style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#a8895e",
          }}>
            {t.clientName}{t.clientDescription ? ` | ${t.clientDescription}` : ""}
          </p>
        </div>
      </div>
    </article>
  )
}
