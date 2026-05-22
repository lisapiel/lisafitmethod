import type { Metadata } from "next"
import AdminBlogClient from "./page.client"

export const metadata: Metadata = { title: "Blog — Admin" }

export default function AdminBlogPage() {
  return <AdminBlogClient />
}
