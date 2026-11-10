import { test } from "node:test"
import assert from "node:assert/strict"
import { presignS3Url, signHeaders, uriEncode } from "./awsSigV4"

// AWS S3 docs, "Authenticating Requests: Using Query Parameters", example presigned GET.
test("presigned GET matches the AWS documented example", () => {
  const url = presignS3Url({
    method: "GET",
    bucket: "examplebucket",
    key: "test.txt",
    region: "us-east-1",
    expiresSeconds: 86400,
    credentials: { accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    now: new Date("2013-05-24T00:00:00Z"),
  })
  assert.equal(
    url,
    "https://examplebucket.s3.amazonaws.com/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
  )
})

// AWS SigV4 test suite "get-vanilla" (AWS General Reference).
test("header signing matches the SigV4 test suite get-vanilla vector", () => {
  const h = signHeaders({
    method: "GET",
    url: "https://example.amazonaws.com/",
    service: "service",
    region: "us-east-1",
    credentials: { accessKeyId: "AKIDEXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY" },
    now: new Date("2015-08-30T12:36:00Z"),
  })
  assert.equal(h["x-amz-date"], "20150830T123600Z")
  assert.equal(
    h.Authorization,
    "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date, Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
  )
})

// AWS S3 docs, "Signature Calculations for the Authorization Header", GET Object example.
test("header signing matches the S3 GET Object example", () => {
  const h = signHeaders({
    method: "GET",
    url: "https://examplebucket.s3.amazonaws.com/test.txt",
    service: "s3",
    region: "us-east-1",
    headers: { range: "bytes=0-9", "x-amz-content-sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    credentials: { accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    now: new Date("2013-05-24T00:00:00Z"),
  })
  assert.equal(
    h.Authorization,
    "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
  )
})

test("presigned PUT uses the regional host, keeps key slashes and lists extra signed headers", () => {
  const url = new URL(presignS3Url({
    method: "PUT",
    bucket: "b",
    key: "media/photos/a b.jpg",
    region: "us-east-2",
    expiresSeconds: 900,
    signedHeaders: { "content-type": "image/jpeg" },
    credentials: { accessKeyId: "AK", secretAccessKey: "SK" },
    now: new Date("2026-01-01T00:00:00Z"),
  }))
  assert.equal(url.host, "b.s3.us-east-2.amazonaws.com")
  assert.equal(url.pathname, "/media/photos/a%20b.jpg")
  assert.equal(url.searchParams.get("X-Amz-SignedHeaders"), "content-type;host")
  assert.equal(url.searchParams.get("X-Amz-Expires"), "900")
  assert.match(url.searchParams.get("X-Amz-Signature") ?? "", /^[0-9a-f]{64}$/)
})

test("uriEncode follows RFC 3986 and only keeps slashes when asked", () => {
  assert.equal(uriEncode("a b/c~d*"), "a%20b%2Fc~d%2A")
  assert.equal(uriEncode("a b/c", false), "a%20b/c")
  assert.equal(uriEncode("é"), "%C3%A9")
})
