import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
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
        className={`${barlowCondensed.variable} ${dmSans.variable} font-body bg-background text-foreground antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
