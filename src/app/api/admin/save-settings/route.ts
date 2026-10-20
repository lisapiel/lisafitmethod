import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { verifyAdminRequest } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

const BUCKET = "amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov"
const KEY = "media/settings.json"

export async function POST(request: NextRequest) {
  const admin = await verifyAdminRequest(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 })
  }

  const s3 = new S3Client({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(body, null, 2),
        ContentType: "application/json",
      })
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[save-settings] S3 write failed:", err)
    return NextResponse.json({ error: "S3 write failed" }, { status: 500 })
  }
}
