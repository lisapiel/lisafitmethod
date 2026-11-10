import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { appSyncUrl, signedAppSyncFetch } from "@/lib/awsSigV4"
import { catalogMutation, catalogResultField, parseCatalogRequest, type MediaAsset } from "@/lib/mediaCatalog"

export const dynamic = "force-dynamic"

type GraphQLResponse = { data?: Record<string, MediaAsset | null> | null; errors?: Array<{ message?: string; errorType?: string }> }

// Create, update or delete a MediaAsset record. The Data API only accepts
// these mutations from the server IAM user, so the browser never calls it directly.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = parseCatalogRequest(await req.json().catch(() => null))
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const body = JSON.stringify({ query: catalogMutation(parsed.action), variables: { input: parsed.input } })
  let json: GraphQLResponse
  try {
    const res = await signedAppSyncFetch(appSyncUrl(), body)
    json = await res.json() as GraphQLResponse
    if (!res.ok && !json.errors) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error("[admin/media/catalog] Data API call failed:", err instanceof Error ? err.message : "unknown")
    return NextResponse.json({ error: "The media catalogue could not be updated" }, { status: 502 })
  }

  if (json.errors?.length) {
    console.error("[admin/media/catalog] Data API errors:", json.errors.map((e) => e.errorType ?? "error").join(", "))
    return NextResponse.json({ error: json.errors[0]?.message ?? "The media catalogue could not be updated" }, { status: 502 })
  }
  const asset = json.data?.[catalogResultField(parsed.action)] ?? null
  return NextResponse.json({ asset })
}
