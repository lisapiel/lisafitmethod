import { NextResponse } from "next/server"
import { getPromoCodes } from "@/lib/promoCodes"

export const dynamic = "force-dynamic"

export async function GET() {
  const codes = await getPromoCodes()
  return NextResponse.json({ codes })
}
