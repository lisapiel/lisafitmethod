import { NextRequest, NextResponse } from "next/server"
import { clientSessionIdentity } from "@/lib/clientSession"
import { isOwnClientKey, parseKeyList } from "@/lib/mediaKeys"
import { presignRead, READ_URL_TTL_SECONDS } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

// Short-lived read URLs, only for files in the caller's own folders. Any
// other key is left out of the answer. Former clients can still see what
// they sent, so this checks the session only, not active coaching access.
export async function POST(req: NextRequest) {
  const me = await clientSessionIdentity()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const keys = parseKeyList(await req.json().catch(() => null))
  if (!keys) return NextResponse.json({ error: "keys must be a list of up to 50 keys" }, { status: 400 })

  const urls: Record<string, string> = {}
  for (const key of keys) if (isOwnClientKey(key, me.sub)) urls[key] = presignRead(key)
  return NextResponse.json({ urls, expiresIn: READ_URL_TTL_SECONDS })
}
