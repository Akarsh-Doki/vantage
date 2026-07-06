import type React from "react"
import type { Metadata, Viewport } from "next"
import { Fraunces, Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/providers/auth-provider"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Vantage — Your AI marketing team, in minutes",
  description:
    "Vantage is an AI marketing strategist for small local businesses. Live cited research, a team of agents, and finished, exportable campaigns.",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#FAFAF8",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // `light` class + color-scheme keeps the app on the cream theme regardless of OS dark mode.
    <html
      lang="en"
      className={`light ${fraunces.variable} ${inter.variable} ${geistMono.variable} bg-background`}
      style={{ colorScheme: "light" }}
    >
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
