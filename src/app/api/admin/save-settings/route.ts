import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { putMediaObject } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

const KEY = "media/settings.json"

export async function POST(request: NextRequest) {
  const admin = await verifyAdminRequest(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 })
  }

  try {
    await putMediaObject(KEY, JSON.stringify(body, null, 2), "application/json")
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[save-settings] S3 write failed:", err)
    return NextResponse.json({ error: "S3 write failed" }, { status: 500 })
  }
}
