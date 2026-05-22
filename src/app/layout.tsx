import type { Metadata } from "next"
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
      <body>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}</Script>
          </>
        )}
        <AmplifyProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AmplifyProvider>
      </body>
    </html>
  )
}
