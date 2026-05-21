"use client"

import { Amplify } from "aws-amplify"
import { amplifyConfig } from "@/lib/amplifyConfig"

try {
  Amplify.configure(amplifyConfig, { ssr: true })
} catch {
  // Config may be missing in some build environments; auth still works via amplify-server.ts
}

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
