import type { Metadata } from "next"
import BlogPostFormClient from "../../BlogPostForm.client"

export const metadata: Metadata = { title: "Edit Post: Admin" }

export default async function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BlogPostFormClient mode="edit" slug={slug} />
}
