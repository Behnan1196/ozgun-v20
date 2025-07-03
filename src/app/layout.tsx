import type { Metadata, Viewport } from 'next'
import AppThemeProvider from '@/components/ThemeProvider'
import { StreamProvider } from '@/contexts/StreamContext'
import './globals.css'

const iconDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='192' height='192'%3E%3Crect width='24' height='24' fill='%232563eb'/%3E%3Ctext x='12' y='16' font-family='Arial' font-size='14' fill='white' text-anchor='middle'%3ET%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: 'TYT-AYT Koçluk Platformu',
  description: 'TYT ve AYT sınavları için kapsamlı koçluk platformu',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TYT-AYT Koçluk'
  },
  icons: {
    icon: iconDataUrl,
    apple: iconDataUrl
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="TYT ve AYT sınavlarına hazırlık için kapsamlı koçluk platformu" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AppThemeProvider>
          <StreamProvider>
            {children}
          </StreamProvider>
        </AppThemeProvider>
      </body>
    </html>
  )
} 