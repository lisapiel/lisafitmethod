import { CustomersClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Customers — LFM Admin" }

export default function CustomersPage() {
  return <CustomersClient />
}
