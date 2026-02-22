import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import 'bootstrap/dist/css/bootstrap.min.css'
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
})

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
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
