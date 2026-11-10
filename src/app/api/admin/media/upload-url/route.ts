import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { planAdminUpload } from "@/lib/mediaKeys"
import { presignUpload, publicMediaUrl, uploadHeaders } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null) as { folder?: unknown; fileName?: unknown; contentType?: unknown } | null
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })

  const plan = planAdminUpload(body.folder, body.fileName, body.contentType)
  if ("error" in plan) return NextResponse.json({ error: plan.error }, { status: 400 })

  return NextResponse.json({
    key: plan.key,
    url: presignUpload(plan.key, plan.contentType),
    publicUrl: publicMediaUrl(plan.key),
    headers: uploadHeaders(plan.contentType),
  })
}
