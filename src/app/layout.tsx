import type { Metadata, Viewport } from "next"
import { Playfair_Display, DM_Sans, Cormorant_Garamond, Montserrat } from "next/font/google"
import Script from "next/script"
import { AmplifyProvider } from "@/components/AmplifyProvider"
import { gaBootstrapScript } from "@/lib/analyticsPrivacy"
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
  themeColor: "#0a0a0a",
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
    url: "/",
    // A static file, not a generated route. The previous og:image was built
    // per request by next/og: a 670KB PNG that Apple's link previewer could
    // time out on, and a card that fails once is cached as a blank card.
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Lisa Fit Method" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LFM Coaching",
    startupImage: [{ url: "/icon-512.png" }],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "@id": "https://lisafitmethod.com/about#lisa-mcpherson",
              name: "Lisa McPherson",
              jobTitle: "NASM Certified Personal Trainer",
              url: "https://lisafitmethod.com/about",
              image: "https://lisafitmethod.com/lisa-about-hero.jpg",
              description: "NASM Certified Personal Trainer and founder of Lisa Fit Method. Specializes in foundational strength training for beginners and returners.",
              sameAs: ["https://www.instagram.com/lisafitmethod"],
              worksFor: { "@type": "Organization", "@id": "https://lisafitmethod.com/#organization", name: "Lisa Fit Method", url: "https://lisafitmethod.com" },
              knowsAbout: ["Strength Training", "Beginner Weightlifting", "Movement Correction", "Corrective Exercise", "Progressive Overload", "Core Stability"],
              hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Certification", name: "NASM Certified Personal Trainer (CPT)" },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Script id="ga4-init" strategy="beforeInteractive">{gaBootstrapScript()}</Script>
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
