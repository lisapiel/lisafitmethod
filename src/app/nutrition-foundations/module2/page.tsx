import type { Metadata } from "next"
import Module2Client from "./page.client"

export const metadata: Metadata = {
  title: "Module 2: Your Nutrition Blueprint — Nutrition Foundations | Lisa Fit Method",
}

export default function Module2Page() {
  return <Module2Client />
}
