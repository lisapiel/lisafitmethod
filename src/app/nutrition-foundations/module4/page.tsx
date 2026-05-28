import type { Metadata } from "next"
import Module4Client from "./page.client"

export const metadata: Metadata = {
  title: "Module 4: Making It Stick: Nutrition Foundations | Lisa Fit Method",
}

export default function Module4Page() {
  return <Module4Client />
}
