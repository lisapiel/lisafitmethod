import type { Metadata } from "next"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { getPublishedPhotoUrl, getPublishedVideoUrl } from "@/lib/mediaClient"
import { fetchSiteSettings } from "@/lib/siteSettings"
import type { TestimonialRecord } from "@/app/api/admin/testimonials/route"

export const metadata: Metadata = { title: "Testimonials Preview – Admin" }
export const dynamic = "force-dynamic"

async function getAllTestimonials(): Promise<TestimonialRecord[]> {
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
        FilterExpression: "begins_with(userId, :prefix)",
        ExpressionAttributeValues: { ":prefix": "testimonial_" },
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
        status: (item.status as "draft" | "published") ?? "draft",
        createdAt: (item.createdAt as string) ?? "",
        updatedAt: (item.updatedAt as string) ?? "",
      } satisfies TestimonialRecord))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  } catch {
    return []
  }
}

export default async function TestimonialsPreviewPage() {
  const [testimonials, settings] = await Promise.all([getAllTestimonials(), fetchSiteSettings()])

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
      const isVideo = testimonials.some((t) => t.videoSlot === slot)
      mediaMap[slot] = isVideo
        ? await getPublishedVideoUrl(slot)
        : await getPublishedPhotoUrl(slot)
    })
  )

  const crops = settings.crops

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Banner */}
      <div style={{
        background: "#1a1200", borderBottom: "2px solid #c9a96e",
        padding: "14px 24px", position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <span style={{
            fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem",
            letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700,
            color: "#c9a96e",
          }}>
            DRAFT PREVIEW
          </span>
          <span style={{
            fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem",
            color: "#888", marginLeft: 16,
          }}>
            This is what visitors will see once you publish. Draft records are shown here — nothing on the public site until you click Publish.
          </span>
        </div>
        <a
          href="/admin/testimonials"
          style={{
            fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem",
            letterSpacing: "0.14em", textTransform: "uppercase", color: "#888",
            textDecoration: "none", border: "1px solid #2a2a2a", padding: "7px 14px",
          }}
        >
          ← Back to admin
        </a>
      </div>

      {testimonials.length === 0 ? (
        <div style={{ padding: "80px 40px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#555" }}>
            No testimonial records found. Visit{" "}
            <a href="/admin/testimonials" style={{ color: "#c9a96e" }}>Admin → Testimonials</a>
            {" "}to create them.
          </p>
        </div>
      ) : (
        <TestimonialsPreview testimonials={testimonials} mediaMap={mediaMap} crops={crops} />
      )}
    </div>
  )
}

type CropsType = Awaited<ReturnType<typeof fetchSiteSettings>>["crops"]

function TestimonialsPreview({
  testimonials,
  mediaMap,
  crops,
}: {
  testimonials: TestimonialRecord[]
  mediaMap: Record<string, string | null>
  crops: CropsType
}) {
  return (
    <section
      style={{ background: "var(--off-white, #f5f2ee)", padding: "100px 48px" }}
      aria-label="Client testimonials preview"
    >
      <style>{`
        @media (max-width: 768px) {
          .tp-section { padding: 72px 20px !important; }
          .tp-grid { flex-direction: column !important; }
          .tp-photos-row { flex-direction: column !important; }
          .tp-metrics-row { gap: 12px !important; }
          .tp-metric-tile { flex: 1 1 calc(50% - 6px) !important; min-width: 0 !important; }
          .tp-exp-inner { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .tp-metric-tile { flex: 1 1 100% !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {testimonials.map((t) => (
            <div key={t.id} style={{ position: "relative" }}>
              {/* Draft badge */}
              {t.status === "draft" && (
                <div style={{
                  position: "absolute", top: -12, right: 0, zIndex: 10,
                  background: "#c9a96e", color: "#0a0a0a",
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem",
                  fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
                  padding: "4px 12px",
                }}>
                  DRAFT
                </div>
              )}
              {t.type === "transformation"
                ? <TransformationCard t={t} mediaMap={mediaMap} crops={crops} />
                : <ExperienceCard t={t} mediaMap={mediaMap} crops={crops} />
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransformationCard({
  t,
  mediaMap,
  crops,
}: {
  t: TestimonialRecord
  mediaMap: Record<string, string | null>
  crops: CropsType
}) {
  const videoUrl = t.videoSlot ? (mediaMap[t.videoSlot] ?? null) : null
  const beforeUrl = t.photoSlotBefore ? (mediaMap[t.photoSlotBefore] ?? null) : null
  const progressUrl = t.photoSlotProgress ? (mediaMap[t.photoSlotProgress] ?? null) : null
  const videoCrop = (crops as Record<string, string>).testimonial_gino_video ?? "center 30%"
  const beforeCrop = (crops as Record<string, string>)[t.photoSlotBefore ?? ""] ?? "center 20%"
  const progressCrop = (crops as Record<string, string>)[t.photoSlotProgress ?? ""] ?? "center 20%"

  const hasMedia = videoUrl || beforeUrl || progressUrl

  return (
    <article style={{ background: "#fff", border: "1px solid rgba(168,137,94,0.12)", overflow: "hidden" }}>
      <div className="tp-grid" style={{ display: "flex", alignItems: "stretch" }}>
        {hasMedia && (
          <div style={{ flexShrink: 0, width: 340, background: "#0a0a0a", position: "relative" }}>
            {videoUrl && (
              <div style={{ position: "relative", width: "100%", paddingBottom: "133.33%", overflow: "hidden" }}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: videoCrop, background: "#0a0a0a",
                  }}
                />
              </div>
            )}
            {(beforeUrl || progressUrl) && (
              <div className="tp-photos-row" style={{ display: "flex", gap: 2, padding: videoUrl ? "2px 0 0" : 0 }}>
                {beforeUrl && (
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ position: "relative", paddingBottom: "133.33%", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={beforeUrl}
                        alt={`${t.clientName} — before coaching`}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: beforeCrop }}
                      />
                      <div style={{
                        position: "absolute", bottom: 8, left: 8,
                        background: "rgba(10,10,10,0.72)", color: "#f0e6d3",
                        fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem",
                        fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 8px",
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
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: progressCrop }}
                      />
                      <div style={{
                        position: "absolute", bottom: 8, left: 8,
                        background: "rgba(10,10,10,0.72)", color: "#f0e6d3",
                        fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem",
                        fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 8px",
                      }}>
                        3 months into coaching
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

          {t.metrics.length > 0 && (
            <div className="tp-metrics-row" style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
              {t.metrics.map((m, i) => (
                <div
                  key={i}
                  className="tp-metric-tile"
                  style={{
                    flex: "1 1 calc(33% - 9px)", minWidth: 90,
                    background: "#f5f2ee", border: "1px solid rgba(168,137,94,0.15)",
                    padding: "14px 16px", textAlign: "center",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: "#0a0a0a", marginBottom: 2, lineHeight: 1 }}>
                    {m.value}
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "#6b6560", fontWeight: 500, letterSpacing: "0.08em" }}>
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {t.featuredQuote && (
            <blockquote style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "calc(clamp(14px, 1.1vw, 17px) * var(--body-scale, 1))",
              fontStyle: "italic", color: "#1a1a1a", lineHeight: 1.65,
              borderLeft: "2px solid #c8a97e", paddingLeft: 20, margin: "0 0 20px",
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
    <article style={{ background: "#fff", border: "1px solid rgba(168,137,94,0.12)", padding: "40px 44px", maxWidth: 840 }}>
      <div className="tp-exp-inner" style={{ display: "flex", gap: 36, alignItems: "center" }}>
        {portraitUrl && (
          <div style={{ flexShrink: 0, width: 120, height: 120, borderRadius: "50%", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitUrl}
              alt={t.clientName}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: portraitCrop }}
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          {t.featuredQuote && (
            <blockquote style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "calc(clamp(15px, 1.2vw, 18px) * var(--body-scale, 1))",
              fontStyle: "italic", color: "#1a1a1a", lineHeight: 1.65, margin: "0 0 18px",
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
