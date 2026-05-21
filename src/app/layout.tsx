import type { Metadata } from "next"
import { Playfair_Display, DM_Sans, Cormorant_Garamond, Montserrat } from "next/font/google"
import { AmplifyProvider } from "@/components/AmplifyProvider"
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
  title: "Lisa Fit Method",
  description:
    "A 4-week beginner program built around what actually matters. Proper movement, a real foundation, and a body built to last.",
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
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  )
}
