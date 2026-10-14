import type { Metadata } from "next"
import AdminTestimonialsClient from "./page.client"

export const metadata: Metadata = { title: "Testimonials – Admin" }

export default function AdminTestimonialsPage() {
  return <AdminTestimonialsClient />
}
