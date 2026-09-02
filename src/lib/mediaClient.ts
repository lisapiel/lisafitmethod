// These are public read-only values — the API key only allows listMediaAssets reads.
const APPSYNC_URL = process.env.APPSYNC_URL ?? "https://kcr4zqjknjerveglimvj5ogi2m.appsync-api.us-east-2.amazonaws.com/graphql"
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY ?? "da2-y44brrwzkncnhcjg6wxr23xnve"

type MediaItem = { assignedTo: string; url: string | null }

async function fetchPublishedAssets(type: "VIDEO" | "PHOTO"): Promise<MediaItem[]> {
  if (!APPSYNC_URL || !APPSYNC_API_KEY) return []
  try {
    const res = await fetch(APPSYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: `query {
          listMediaAssets(filter: {
            and: [{ isPublished: { eq: true } }, { type: { eq: ${type} } }]
          }) { items { assignedTo url } }
        }`,
      }),
      next: { revalidate: 60 },
    })
    const json = await res.json()
    return json.data?.listMediaAssets?.items ?? []
  } catch {
    return []
  }
}

export async function getPublishedVideoUrls(
  slotKeys: string[]
): Promise<Record<string, string>> {
  const items = await fetchPublishedAssets("VIDEO")
  const map: Record<string, string> = {}
  for (const item of items) {
    if (slotKeys.includes(item.assignedTo) && item.url) {
      map[item.assignedTo] = item.url
    }
  }
  return map
}

export async function getPublishedPhotoUrl(slot: string): Promise<string | null> {
  const items = await fetchPublishedAssets("PHOTO")
  return items.find((i) => i.assignedTo === slot)?.url ?? null
}

export async function getPublishedVideoUrl(slot: string): Promise<string | null> {
  const items = await fetchPublishedAssets("VIDEO")
  return items.find((i) => i.assignedTo === slot)?.url ?? null
}

// Deterministic fallback URL for the homepage / courses hero trailer.
// The AppSync CMS lookup (getPublishedVideoUrl("lp_trailer")) is the
// primary source so the trailer can be swapped in the admin, but a
// public marketing page can never be allowed to render a <video> with
// no src just because a transient CMS fetch missed. Callers should
// use `heroTrailerUrl(cmsUrl)` below rather than the raw CMS return.
// URL points at the same optimized H.264 asset in the Amplify media
// bucket that the CMS assigns to the "lp_trailer" slot today; overwriting
// that S3 key updates both the CMS path and this fallback simultaneously.
export const HERO_TRAILER_FALLBACK_URL =
  "https://amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov.s3.us-east-2.amazonaws.com/media/videos/lp_trailer.mp4"

export function heroTrailerUrl(cmsUrl: string | null | undefined): string {
  return cmsUrl && cmsUrl.length > 0 ? cmsUrl : HERO_TRAILER_FALLBACK_URL
}

// Derive the companion poster URL for a hero video by swapping the .mp4
// extension for .jpg. Matches the co-located naming convention used for
// exercise videos (name.mp4 / name.jpg) and lets the hero use a matching
// still frame without introducing a second media-asset architecture.
// Returns undefined when input is null/empty so callers can pass the
// result straight into VideoPlayer's optional `poster` prop.
export function derivePosterUrl(videoUrl: string | null | undefined): string | undefined {
  if (!videoUrl) return undefined
  return videoUrl.replace(/\.mp4(\?.*)?$/i, ".jpg$1")
}

// ─── Exercise Video (Masterclass) ─────────────────────────────────────────────

export type ExerciseVideoItem = {
  slug: string
  name: string
  url: string
  s3Key: string
  durationSeconds: number | null
  muscleGroups: string | null
  equipment: string | null
  tags: string | null
  isPublished: boolean
}

async function fetchExerciseVideos(filter?: string): Promise<ExerciseVideoItem[]> {
  if (!APPSYNC_URL || !APPSYNC_API_KEY) return []
  try {
    const filterArg = filter ? `(filter: ${filter})` : ""
    const res = await fetch(APPSYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: `query {
          listExerciseVideos${filterArg} {
            items { slug name url s3Key durationSeconds muscleGroups equipment tags isPublished }
          }
        }`,
      }),
      next: { revalidate: 60 },
    })
    const json = await res.json() as { data?: { listExerciseVideos?: { items?: ExerciseVideoItem[] } } }
    return json.data?.listExerciseVideos?.items ?? []
  } catch {
    return []
  }
}

export async function getExerciseVideo(slug: string): Promise<ExerciseVideoItem | null> {
  const items = await fetchExerciseVideos(`{ slug: { eq: "${slug}" } }`)
  return items[0] ?? null
}

export async function listPublishedExerciseVideos(): Promise<ExerciseVideoItem[]> {
  return fetchExerciseVideos(`{ isPublished: { eq: true } }`)
}
