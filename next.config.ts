import type { NextConfig } from "next"

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
    return CACHED_PAGES.map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
        },
      ],
    }))
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
    ],
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
