import type { Metadata } from "next"
import BlogPostFormClient from "../BlogPostForm.client"

export const metadata: Metadata = { title: "New Post — Admin" }

export default function NewBlogPostPage() {
  return <BlogPostFormClient mode="new" />
}
