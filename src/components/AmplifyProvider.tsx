"use client"

import { Amplify } from "aws-amplify"
import { amplifyConfig } from "@/lib/amplifyConfig"

Amplify.configure(amplifyConfig, { ssr: true })

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
