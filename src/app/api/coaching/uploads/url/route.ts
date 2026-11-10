import { NextRequest, NextResponse } from "next/server"
import { clientSessionIdentity } from "@/lib/clientSession"
import { hasCoachingAccess } from "@/lib/authTokens"
import { planClientUpload } from "@/lib/mediaKeys"
import { presignUpload, uploadHeaders } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

// An upload URL for one form-review video or message photo, always in the
// signed-in client's own folder. The URL is signed for the exact type and size.
export async function POST(req: NextRequest) {
  const me = await clientSessionIdentity()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await hasCoachingAccess(me.email))) return NextResponse.json({ error: "Coaching access required" }, { status: 403 })

  const body = await req.json().catch(() => null) as { kind?: unknown; ext?: unknown; contentType?: unknown; size?: unknown } | null
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })

  const plan = planClientUpload({ kind: body.kind, ext: body.ext, contentType: body.contentType, size: body.size }, me.sub)
  if ("error" in plan) return NextResponse.json({ error: plan.error }, { status: plan.status })

  return NextResponse.json({
    key: plan.key,
    url: presignUpload(plan.key, plan.contentType, plan.size),
    headers: uploadHeaders(plan.contentType, plan.size),
  })
}
