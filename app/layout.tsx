import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Lora, Manrope } from 'next/font/google'

import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Angel AI',
  description:
    'Chat-based companion PWA with proactive check-ins, long-term memory, and astral-inspired guidance.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Angel AI',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport = {
  themeColor: '#0F1629',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

type RootLayoutProps = Readonly<{
  children: ReactNode
}>

import { PWAInstallNudge } from '@/components/molecules/PWAInstallNudge'

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${lora.variable} bg-background text-text-primary antialiased`}
      >
        {children}
        <PWAInstallNudge />
      </body>
    </html>
  )
}
