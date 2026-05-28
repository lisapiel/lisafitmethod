"use server"
import { getPromoCodes, savePromoCodes } from "@/lib/promoCodes"
import { revalidatePath } from "next/cache"

export async function addPromoCode(
  code: string,
  discountPct: number,
  product: "training" | "nutrition" | "all" = "all"
): Promise<{ error?: string }> {
  const normalized = code.trim().toUpperCase()
  if (!normalized || normalized.length < 3) return { error: "Code must be at least 3 characters." }
  if (discountPct < 1 || discountPct > 100) return { error: "Discount must be between 1 and 100." }
  try {
    const codes = await getPromoCodes()
    codes[normalized] = { discountPct, active: true, product }
    await savePromoCodes(codes)
    revalidatePath("/admin/promo-codes")
    return {}
  } catch (err) {
    console.error("addPromoCode failed:", err)
    return { error: "Failed to save. Check DynamoDB permissions and try again." }
  }
}

export async function deletePromoCode(code: string): Promise<{ error?: string }> {
  try {
    const codes = await getPromoCodes()
    delete codes[code]
    await savePromoCodes(codes)
    revalidatePath("/admin/promo-codes")
    return {}
  } catch (err) {
    console.error("deletePromoCode failed:", err)
    return { error: "Failed to delete code." }
  }
}

export async function togglePromoCode(code: string, active: boolean): Promise<{ error?: string }> {
  try {
    const codes = await getPromoCodes()
    if (!codes[code]) return { error: "Code not found." }
    codes[code] = { ...codes[code], active }
    await savePromoCodes(codes)
    revalidatePath("/admin/promo-codes")
    return {}
  } catch (err) {
    console.error("togglePromoCode failed:", err)
    return { error: "Failed to update code." }
  }
}
