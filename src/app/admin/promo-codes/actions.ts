"use server"
import { getPromoCodes, savePromoCodes } from "@/lib/promoCodes"
import { revalidatePath } from "next/cache"
import { verifyAdminToken } from "@/lib/adminAuth"

const NOT_ALLOWED = { error: "Only the coach can change promo codes. Sign in again and retry." }

export async function addPromoCode(
  accessToken: string,
  code: string,
  discountPct: number,
  product: "training" | "nutrition" | "all" = "all"
): Promise<{ error?: string }> {
  if (!(await verifyAdminToken(accessToken))) return NOT_ALLOWED
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

export async function deletePromoCode(accessToken: string, code: string): Promise<{ error?: string }> {
  if (!(await verifyAdminToken(accessToken))) return NOT_ALLOWED
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

export async function togglePromoCode(accessToken: string, code: string, active: boolean): Promise<{ error?: string }> {
  if (!(await verifyAdminToken(accessToken))) return NOT_ALLOWED
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
