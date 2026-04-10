import type React from "react"
import type { Metadata } from "next"
import 'bootstrap/dist/css/bootstrap.min.css'
import "./globals.css"

export const metadata: Metadata = {
  title: "LearnAI - AI Powered Student Platform",
  description: "Enhance your study habits with AI-powered monitoring and real-time feedback.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
