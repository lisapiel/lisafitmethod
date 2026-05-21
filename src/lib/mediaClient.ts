const APPSYNC_URL = process.env.APPSYNC_URL ?? ""
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY ?? ""

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
