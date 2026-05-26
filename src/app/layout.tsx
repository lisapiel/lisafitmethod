import type { Metadata, Viewport } from "next"
import { Playfair_Display, DM_Sans, Cormorant_Garamond, Montserrat } from "next/font/google"
import Script from "next/script"
import { AmplifyProvider } from "@/components/AmplifyProvider"
import SiteHeader from "@/components/SiteHeader"
import SiteFooter from "@/components/SiteFooter"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "Lisa Fit Method",
    template: "%s | Lisa Fit Method",
  },
  description:
    "A 4-week beginner program built around what actually matters. Proper movement, a real foundation, and a body built to last.",
  metadataBase: new URL("https://lisafitmethod.com"),
  openGraph: {
    siteName: "Lisa Fit Method",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "",
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable} ${montserrat.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LFM Tracker" />
        <meta name="theme-color" content="#0a0a0a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Lisa McPherson",
              jobTitle: "Certified Personal Trainer",
              url: "https://lisafitmethod.com/about",
              description: "Certified personal trainer and founder of Lisa Fit Method. Specializes in foundational strength training for beginners.",
              sameAs: ["https://www.instagram.com/lisafitmethod"],
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BZWMNEQ83F"
          strategy="beforeInteractive"
        />
        <Script id="ga4-init" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BZWMNEQ83F');
        `}</Script>
      </head>
      <body>
        <AmplifyProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AmplifyProvider>
      </body>
    </html>
  )
}
