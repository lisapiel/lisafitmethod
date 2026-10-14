import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { verifyAdminRequest } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

export interface TestimonialMetric {
  label: string
  value: string
}

export interface TestimonialRecord {
  id: string
  clientName: string
  clientDescription: string
  type: "transformation" | "experience"
  headline: string
  writtenTestimonial: string
  featuredQuote: string
  metrics: TestimonialMetric[]
  photoSlotBefore: string
  photoSlotProgress: string
  photoSlotPortrait: string
  videoSlot: string
  displayOrder: number
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
}

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

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "testimonial_" },
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
      metrics: (item.metrics as TestimonialMetric[]) ?? [],
      photoSlotBefore: (item.photoSlotBefore as string) ?? "",
      photoSlotProgress: (item.photoSlotProgress as string) ?? "",
      photoSlotPortrait: (item.photoSlotPortrait as string) ?? "",
      videoSlot: (item.videoSlot as string) ?? "",
      displayOrder: (item.displayOrder as number) ?? 0,
      status: (item.status as "draft" | "published") ?? "draft",
      createdAt: (item.createdAt as string) ?? "",
      updatedAt: (item.updatedAt as string) ?? "",
    } satisfies TestimonialRecord))
    .sort((a, b) => a.displayOrder - b.displayOrder)
  return NextResponse.json({ testimonials: records })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json() as Partial<TestimonialRecord>
  if (!body.clientName?.trim()) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 })
  }
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const now = new Date().toISOString()
  const record: TestimonialRecord = {
    id,
    clientName: body.clientName.trim(),
    clientDescription: body.clientDescription?.trim() ?? "",
    type: body.type ?? "experience",
    headline: body.headline?.trim() ?? "",
    writtenTestimonial: body.writtenTestimonial?.trim() ?? "",
    featuredQuote: body.featuredQuote?.trim() ?? "",
    metrics: body.metrics ?? [],
    photoSlotBefore: body.photoSlotBefore ?? "",
    photoSlotProgress: body.photoSlotProgress ?? "",
    photoSlotPortrait: body.photoSlotPortrait ?? "",
    videoSlot: body.videoSlot ?? "",
    displayOrder: body.displayOrder ?? 0,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  }
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `testimonial_${id}`, ...record },
    })
  )
  return NextResponse.json({ testimonial: record }, { status: 201 })
}
