import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"

export const dynamic = "force-dynamic"

const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"
const BUCKET = "amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov"
const REGION = "us-east-2"
const PREFIX = "masterclass-videos/"
const CF_BASE = "https://d3r7fyatqfe18c.cloudfront.net"

function slugFromKey(key: string): string {
  const filename = key.replace(PREFIX, "").replace(/\.[^.]+$/, "")
  return filename.toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

function nameFromKey(key: string): string {
  const filename = key.replace(PREFIX, "").replace(/\.[^.]+$/, "")
  return filename
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export type S3VideoItem = {
  key: string
  slug: string
  name: string
  url: string
}

export async function GET() {
  const email = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (session.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })

  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const s3 = new S3Client({ region: REGION })
  const videos: S3VideoItem[] = []

  let continuationToken: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: PREFIX,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    )
    for (const obj of res.Contents ?? []) {
      const key = obj.Key ?? ""
      if (!key.match(/\.(mp4|mov|webm)$/i)) continue
      const slug = slugFromKey(key)
      if (!slug) continue
      videos.push({
        key,
        slug,
        name: nameFromKey(key),
        url: `${CF_BASE}/${key}`,
      })
    }
    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  return NextResponse.json({ count: videos.length, videos })
}
