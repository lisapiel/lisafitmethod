import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { presignS3Url, serverAwsCredentials, serverAwsRegion } from "@/lib/awsSigV4"
import { MEDIA_BUCKET_DEFAULT, s3PublicUrl } from "@/lib/mediaKeys"

// Server-only: every media write and private read goes through here, signed
// as the server IAM user.

export const UPLOAD_URL_TTL_SECONDS = 15 * 60
export const READ_URL_TTL_SECONDS = 60 * 60

export function mediaBucket(): string {
  return process.env.MEDIA_BUCKET || MEDIA_BUCKET_DEFAULT
}

function s3(): S3Client {
  return new S3Client({ region: serverAwsRegion(), credentials: serverAwsCredentials() })
}

export function publicMediaUrl(key: string): string {
  return s3PublicUrl(mediaBucket(), serverAwsRegion(), key)
}

// The browser must send exactly these headers with the PUT. Signing them
// makes S3 refuse a different type or, when size is given, a different length.
export function uploadHeaders(contentType: string, size?: number): Record<string, string> {
  return { "content-type": contentType, ...(size != null ? { "content-length": String(size) } : {}) }
}

export function presignUpload(key: string, contentType: string, size?: number): string {
  return presignS3Url({
    method: "PUT",
    bucket: mediaBucket(),
    key,
    expiresSeconds: UPLOAD_URL_TTL_SECONDS,
    signedHeaders: uploadHeaders(contentType, size),
  })
}

export function presignRead(key: string): string {
  return presignS3Url({ method: "GET", bucket: mediaBucket(), key, expiresSeconds: READ_URL_TTL_SECONDS })
}

export async function putMediaObject(key: string, body: string, contentType: string): Promise<void> {
  await s3().send(new PutObjectCommand({ Bucket: mediaBucket(), Key: key, Body: body, ContentType: contentType }))
}

export async function deleteMediaObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: mediaBucket(), Key: key }))
}
