import type { NextConfig } from "next"
import { allowedImageSources, RESIZE_QUALITY } from "./src/lib/imageSources"
import { MEDIA_BUCKET_DEFAULT } from "./src/lib/mediaKeys"
import { ANALYTICS_EXCLUDED_PREFIXES } from "./src/lib/analyticsPrivacy"

// Amplify WEB_COMPUTE doesn't pass non-NEXT_PUBLIC_ env vars to the SSR Lambda
// runtime. We embed them into the server bundle at build time using DefinePlugin,
// which is safe because these values never appear in client JavaScript — only in
// .next/server/ which runs inside Amplify's private compute environment.
const SERVER_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "COGNITO_AWS_ACCESS_KEY_ID",
  "COGNITO_AWS_SECRET_ACCESS_KEY",
  "COGNITO_REGION",
  "COGNITO_USER_POOL_ID",
  "RESEND_API_KEY",
  "PROMO_CODES",
  "AMBRISA_CDN_URL",
]

// Public pages that must never be served from a stale cache after a deploy.
// Next gives an ISR page Cache-Control: s-maxage=<revalidate>,
// stale-while-revalidate=31535940 — a full year of permitted staleness. Both
// CloudFront and Safari honour that, so a returning visitor got the previous
// build's HTML on first paint and the new one only on a later request. That is
// why the homepage looked old when opened directly but current after
// navigating back to it. These routes keep the same 60s freshness window and
// cap the stale window to a minute.
const CACHED_PAGES = [
  "/",
  "/about",
  "/courses",
  "/nutrition",
  "/coaching",
  "/faq",
  "/contact",
  "/blog",
  "/blog/:slug",
  "/free-guide",
  "/free-guide-nutrition",
]

const nextConfig: NextConfig = {
  async headers() {
    // Later rules override earlier ones for the same header, so the strict
    // policy on sensitive routes wins over the site-wide default. "same-origin"
    // gives other sites no referrer at all, while same-site requests keep a
    // real Origin header; "no-referrer" can make browsers send "Origin: null",
    // which Next.js rejects for server actions.
    return [
      { source: "/:path*", headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      ...ANALYTICS_EXCLUDED_PREFIXES.map((prefix) => ({
        source: `${prefix}/:path*`,
        headers: [{ key: "Referrer-Policy", value: "same-origin" }],
      })),
      ...CACHED_PAGES.map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
          },
        ],
      })),
    ]
  },
  images: {
    remotePatterns: allowedImageSources({
      exerciseCdnUrl: process.env.NEXT_PUBLIC_AMBRISA_CDN_URL || process.env.AMBRISA_CDN_URL,
      mediaBucket: process.env.MEDIA_BUCKET || MEDIA_BUCKET_DEFAULT,
      region: process.env.COGNITO_REGION || "us-east-2",
    }),
    qualities: [RESIZE_QUALITY],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config, { isServer, webpack: wp }: { isServer: boolean; webpack: any }) {
    if (isServer) {
      const defines: Record<string, string> = {}
      for (const key of SERVER_KEYS) {
        if (process.env[key]) defines[`process.env.${key}`] = JSON.stringify(process.env[key])
      }
      if (Object.keys(defines).length > 0) {
        config.plugins.push(new wp.DefinePlugin(defines))
      }
    }
    return config
  },
}

export default nextConfig
