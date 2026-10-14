import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import type { TestimonialRecord } from "@/app/api/admin/testimonials/route"

export const dynamic = "force-dynamic"
export const revalidate = 60

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
  )
}

export async function GET() {
  try {
    const db = makeDb()
    const result = await db.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix) AND #s = :published",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":prefix": "testimonial_", ":published": "published" },
      })
    )
    const records = (result.Items ?? [])
      .map((item) => item as Record<string, unknown>)
      .filter((item) => typeof item.id === "string")
      .map((item) => ({
        id: item.id as string,
        clientName: (item.clientName as string) ?? "",
        clientDescription: (item.clientDescription as string) ?? "",
        type: (item.type as "transformation" | "experience") ?? "experience",
        headline: (item.headline as string) ?? "",
        writtenTestimonial: (item.writtenTestimonial as string) ?? "",
        featuredQuote: (item.featuredQuote as string) ?? "",
        metrics: (item.metrics as TestimonialRecord["metrics"]) ?? [],
        photoSlotBefore: (item.photoSlotBefore as string) ?? "",
        photoSlotProgress: (item.photoSlotProgress as string) ?? "",
        photoSlotPortrait: (item.photoSlotPortrait as string) ?? "",
        videoSlot: (item.videoSlot as string) ?? "",
        displayOrder: (item.displayOrder as number) ?? 0,
        status: "published" as const,
        createdAt: (item.createdAt as string) ?? "",
        updatedAt: (item.updatedAt as string) ?? "",
      } satisfies TestimonialRecord))
      .sort((a, b) => a.displayOrder - b.displayOrder)
    return NextResponse.json({ testimonials: records })
  } catch {
    return NextResponse.json({ testimonials: [] })
  }
}
