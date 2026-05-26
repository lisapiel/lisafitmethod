import { NextRequest, NextResponse } from "next/server"
import { getAuthToken } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ valid: false })

  const data = await getAuthToken(token)
  if (!data) return NextResponse.json({ valid: false, reason: "not_found" })
  if (data.used) return NextResponse.json({ valid: false, reason: "used" })
  if (new Date(data.expiresAt) < new Date()) return NextResponse.json({ valid: false, reason: "expired" })

  return NextResponse.json({ valid: true, email: data.email, type: data.type })
}
