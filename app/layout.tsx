import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

// Font CSS variables are defined in globals.css using system font stacks
const fontVars = {
  '--font-display': 'Impact, "Arial Narrow", Arial, sans-serif',
  '--font-body': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as React.CSSProperties

export const metadata: Metadata = {
  title: 'Wiff — Wiffle Ball League Manager',
  description: 'Score, manage, and track your wiffle ball league',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wiff',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        style={fontVars}
        className="font-body bg-background text-foreground antialiased min-h-screen"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
