import { NextResponse } from "next/server"
import { generateNutritionGuidePDF } from "@/lib/generateNutritionGuidePDF"

export async function GET() {
  try {
    const buffer = await generateNutritionGuidePDF()
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="lisa-fit-method-nutrition-guide.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[NutritionGuidePDF] generation failed:", err)
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
