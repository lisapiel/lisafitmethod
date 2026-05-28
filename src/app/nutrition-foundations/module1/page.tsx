import type { Metadata } from "next"
import Module1Client from "./page.client"

export const metadata: Metadata = {
  title: "Module 1: Understanding Your Body — Nutrition Foundations | Lisa Fit Method",
}

export default function Module1Page() {
  return <Module1Client />
}
