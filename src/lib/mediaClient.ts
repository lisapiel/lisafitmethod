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
