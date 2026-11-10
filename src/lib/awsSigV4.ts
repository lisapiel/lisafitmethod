import { createHash, createHmac } from "node:crypto"

// AWS Signature Version 4, written against node:crypto because the presigner
// package is not a dependency. Server-only: it reads the server IAM user's keys.

export type AwsCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

export function serverAwsCredentials(): AwsCredentials {
  return {
    accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
  }
}

export function serverAwsRegion(): string {
  return process.env.COGNITO_REGION ?? "us-east-2"
}

function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex")
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest()
}

// RFC 3986 encoding as SigV4 defines it: everything except A-Z a-z 0-9 - _ . ~
export function uriEncode(value: string, encodeSlash = true): string {
  let out = ""
  for (const ch of value) {
    if (/[A-Za-z0-9\-_.~]/.test(ch)) out += ch
    else if (ch === "/" && !encodeSlash) out += ch
    else {
      for (const byte of Buffer.from(ch, "utf8")) out += "%" + byte.toString(16).toUpperCase().padStart(2, "0")
    }
  }
  return out
}

function amzDates(now: Date): { amzDate: string; dateStamp: string } {
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  return { amzDate, dateStamp: amzDate.slice(0, 8) }
}

function signingKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac("AWS4" + secret, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, "aws4_request")
}

function canonicalQuery(params: Array<[string, string]>): string {
  return params
    .map(([k, v]) => [uriEncode(k), uriEncode(v)] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")
}

function canonicalHeaders(headers: Record<string, string>): { canonical: string; signed: string } {
  const entries = Object.entries(headers)
    .map(([k, v]) => [k.toLowerCase(), v.trim().replace(/\s+/g, " ")] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  return {
    canonical: entries.map(([k, v]) => `${k}:${v}\n`).join(""),
    signed: entries.map(([k]) => k).join(";"),
  }
}

function stringToSign(amzDate: string, scope: string, canonicalRequest: string): string {
  return ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n")
}

export function s3Host(bucket: string, region: string): string {
  return region === "us-east-1" ? `${bucket}.s3.amazonaws.com` : `${bucket}.s3.${region}.amazonaws.com`
}

export type PresignOptions = {
  method: "PUT" | "GET"
  bucket: string
  key: string
  region?: string
  expiresSeconds: number
  // Each extra signed header must be sent by the browser with exactly this value.
  signedHeaders?: Record<string, string>
  credentials?: AwsCredentials
  now?: Date
}

// Query-string presigned URL, virtual-hosted style, UNSIGNED-PAYLOAD.
export function presignS3Url(opts: PresignOptions): string {
  const region = opts.region ?? serverAwsRegion()
  const creds = opts.credentials ?? serverAwsCredentials()
  const { amzDate, dateStamp } = amzDates(opts.now ?? new Date())
  const host = s3Host(opts.bucket, region)
  const scope = `${dateStamp}/${region}/s3/aws4_request`
  const headers: Record<string, string> = { host, ...(opts.signedHeaders ?? {}) }
  const { canonical, signed } = canonicalHeaders(headers)
  const path = "/" + uriEncode(opts.key, false)

  const params: Array<[string, string]> = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${creds.accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(Math.max(1, Math.min(604800, Math.floor(opts.expiresSeconds))))],
    ["X-Amz-SignedHeaders", signed],
  ]
  if (creds.sessionToken) params.push(["X-Amz-Security-Token", creds.sessionToken])
  const query = canonicalQuery(params)

  const canonicalRequest = [opts.method, path, query, canonical, signed, "UNSIGNED-PAYLOAD"].join("\n")
  const signature = createHmac("sha256", signingKey(creds.secretAccessKey, dateStamp, region, "s3"))
    .update(stringToSign(amzDate, scope, canonicalRequest), "utf8")
    .digest("hex")
  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`
}

export type SignHeadersOptions = {
  method: string
  url: string
  service: string
  region?: string
  headers?: Record<string, string>
  body?: string
  credentials?: AwsCredentials
  now?: Date
}

// Header-based SigV4. Returns the full header set to send, including
// host, x-amz-date and Authorization.
export function signHeaders(opts: SignHeadersOptions): Record<string, string> {
  const region = opts.region ?? serverAwsRegion()
  const creds = opts.credentials ?? serverAwsCredentials()
  const { amzDate, dateStamp } = amzDates(opts.now ?? new Date())
  const url = new URL(opts.url)
  const scope = `${dateStamp}/${region}/${opts.service}/aws4_request`
  const headers: Record<string, string> = { ...(opts.headers ?? {}), host: url.host, "x-amz-date": amzDate }
  if (creds.sessionToken) headers["x-amz-security-token"] = creds.sessionToken
  const { canonical, signed } = canonicalHeaders(headers)

  // S3 keys are encoded once; every other service encodes each path segment twice.
  const segments = url.pathname.split("/").map((s) => decodeURIComponent(s))
  const path = opts.service === "s3"
    ? segments.map((s) => uriEncode(s)).join("/")
    : segments.map((s) => uriEncode(uriEncode(s))).join("/")
  const query = canonicalQuery(Array.from(url.searchParams.entries()))
  const canonicalRequest = [opts.method.toUpperCase(), path || "/", query, canonical, signed, sha256Hex(opts.body ?? "")].join("\n")
  const signature = createHmac("sha256", signingKey(creds.secretAccessKey, dateStamp, region, opts.service))
    .update(stringToSign(amzDate, scope, canonicalRequest), "utf8")
    .digest("hex")
  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
  }
}

export function appSyncUrl(): string {
  return process.env.APPSYNC_URL ?? "https://kcr4zqjknjerveglimvj5ogi2m.appsync-api.us-east-2.amazonaws.com/graphql"
}

// POST a GraphQL request to AppSync signed as the server IAM user.
export async function signedAppSyncFetch(url: string, body: string): Promise<Response> {
  const headers = signHeaders({
    method: "POST",
    url,
    service: "appsync",
    headers: { "content-type": "application/json" },
    body,
  })
  // fetch sets Host itself; sending it explicitly is refused by undici.
  const sendHeaders = Object.fromEntries(Object.entries(headers).filter(([k]) => k !== "host"))
  return fetch(url, { method: "POST", headers: sendHeaders, body, cache: "no-store" })
}
