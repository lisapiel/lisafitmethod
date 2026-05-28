import type { Metadata } from "next"
import Module3Client from "./page.client"

export const metadata: Metadata = {
  title: "Module 3: Your 4-Week Meal Plan: Nutrition Foundations | Lisa Fit Method",
}

export default function Module3Page() {
  return <Module3Client />
}
