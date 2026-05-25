import { NextResponse } from "next/server"
import { getPromoCodesDebug } from "@/lib/promoCodes"

export const dynamic = "force-dynamic"

export async function GET() {
  const { codes, error } = await getPromoCodesDebug()
  return NextResponse.json({ codes, error: error ?? undefined })
}
