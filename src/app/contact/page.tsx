import type { Metadata } from "next"
import ContactClient from "./page.client"

export const metadata: Metadata = {
  title: "Contact | Lisa Fit Method",
  description: "Get in touch with Lisa McPherson. Questions about the course, coaching, or anything else.",
}

export default function ContactPage() {
  return <ContactClient />
}
