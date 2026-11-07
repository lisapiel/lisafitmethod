import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { clientWarmupSettings, putWarmupProfile } from "@/lib/warmups/store"
import type { WarmupProfile } from "@/lib/warmups/profile"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = decodeURIComponent((await params).email).toLowerCase()
  return NextResponse.json(await clientWarmupSettings(email))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = decodeURIComponent((await params).email).toLowerCase()
  const body = (await req.json().catch(() => null)) as WarmupProfile | null
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  await putWarmupProfile(email, body)
  return NextResponse.json(await clientWarmupSettings(email))
}
