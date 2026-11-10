import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { isAdminDeletableKey } from "@/lib/mediaKeys"
import { deleteMediaObject } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null) as { key?: unknown } | null
  if (!body || !isAdminDeletableKey(body.key)) {
    return NextResponse.json({ error: "Only photos, videos and blog files can be deleted here" }, { status: 400 })
  }

  try {
    await deleteMediaObject(body.key)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin/media/delete] S3 delete failed:", err instanceof Error ? err.name : "unknown")
    return NextResponse.json({ error: "Delete failed" }, { status: 502 })
  }
}
