import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Worldpay: Text-to-Pay Demo",
  description: "Worldpay Text-to-Pay Application",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/w-purple-monogram.svg", type: "image/svg+xml" },
      { url: "/w-purple-monogram.svg", sizes: "any" },
    ],
    shortcut: "/w-purple-monogram.svg",
    apple: "/w-purple-monogram.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/w-purple-monogram.svg" type="image/svg+xml" />
        <link rel="icon" href="/w-purple-monogram.svg" sizes="any" />
        <link rel="shortcut icon" href="/w-purple-monogram.svg" />
        <link rel="apple-touch-icon" href="/w-purple-monogram.svg" />
        <meta name="msapplication-TileColor" content="#4C12A1" />
        <meta name="theme-color" content="#1B1B6F" />
      </head>
      <body>{children}</body>
    </html>
  )
}
