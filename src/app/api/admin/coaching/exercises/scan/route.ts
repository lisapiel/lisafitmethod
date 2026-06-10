import { NextRequest, NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"

export const dynamic = "force-dynamic"

const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"
const BUCKET = "ambrisa-video-preset-s3-final"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

function makeS3() {
  return new S3Client({
    region: "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

export type ScannedExercise = {
  name: string
  videoS3Key: string
  thumbnailS3Key: string
  hasFVersion: boolean
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    if (callerEmail !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const s3 = makeS3()
  const mp4Files = new Set<string>()
  const jpgFiles = new Set<string>()

  let continuationToken: string | undefined
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
    }))
    for (const obj of res.Contents ?? []) {
      const key = obj.Key ?? ""
      if (key.endsWith(".mp4")) mp4Files.add(key)
      else if (key.endsWith(".jpg")) jpgFiles.add(key)
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  // Resolve each unique exercise name — prefer "F" version
  const exerciseMap = new Map<string, ScannedExercise>()

  for (const key of mp4Files) {
    const isFVersion = key.endsWith(" F.mp4")
    const exerciseName = isFVersion ? key.replace(" F.mp4", "") : key.replace(".mp4", "")
    const existing = exerciseMap.get(exerciseName)

    if (!existing || isFVersion) {
      const thumbnailKey = key.replace(".mp4", ".jpg")
      exerciseMap.set(exerciseName, {
        name: exerciseName,
        videoS3Key: key,
        thumbnailS3Key: jpgFiles.has(thumbnailKey) ? thumbnailKey : key.replace(".mp4", ".jpg"),
        hasFVersion: isFVersion,
      })
    }
  }

  const exercises = Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json({ exercises, total: exercises.length })
}
