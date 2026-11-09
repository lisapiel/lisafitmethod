import { NextRequest, NextResponse } from "next/server"
import { getPromoCodes } from "@/lib/promoCodes"
import { verifyAdminRequest } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const codes = await getPromoCodes()
  return NextResponse.json({ codes })
}
