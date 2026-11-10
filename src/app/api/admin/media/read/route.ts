import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { isClientUploadKey, parseKeyList } from "@/lib/mediaKeys"
import { presignRead, READ_URL_TTL_SECONDS } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

// Short-lived read URLs for any client upload (form-review videos, message photos).
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const keys = parseKeyList(await req.json().catch(() => null))
  if (!keys) return NextResponse.json({ error: "keys must be a list of up to 50 keys" }, { status: 400 })

  const urls: Record<string, string> = {}
  for (const key of keys) if (isClientUploadKey(key)) urls[key] = presignRead(key)
  return NextResponse.json({ urls, expiresIn: READ_URL_TTL_SECONDS })
}
