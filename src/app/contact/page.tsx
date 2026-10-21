import type { Metadata } from "next"
import { ContactPageD } from "@/components/site/ContactPageD"

export const metadata: Metadata = {
  title: "Contact | Lisa Fit Method",
  description: "Get in touch with Lisa McPherson. Questions about the course, coaching, or anything else.",
}

export default function ContactPage() {
  return <ContactPageD />
}
