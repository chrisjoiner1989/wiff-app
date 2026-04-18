import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

// Display — condensed vintage-sport face, ideal for scorecards & wordmarks
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
})

// Body — humanist, quiet, readable at every size
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

// Mono — tabular box-score numerals
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
})

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
  themeColor: '#F5EFE4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${barlowCondensed.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-body bg-background text-foreground antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
