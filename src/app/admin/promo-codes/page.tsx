import { getPromoCodes } from "@/lib/promoCodes"
import { PromoCodesClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Promo Codes — LFM Admin" }

export default async function PromoCodesPage() {
  const codes = await getPromoCodes()
  return <PromoCodesClient initialCodes={codes} />
}
