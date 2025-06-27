import type { Metadata, Viewport } from 'next'
import AppThemeProvider from '@/components/ThemeProvider'
import { StreamProvider } from '@/contexts/StreamContext'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import './globals.css'

export const metadata: Metadata = {
  title: 'TYT-AYT Koçluk Platformu',
  description: 'TYT ve AYT sınavları için kapsamlı koçluk platformu',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TYT-AYT Koçluk'
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png'
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
        {/* PWA meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TYT-AYT Koçluk" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="TYT-AYT Koçluk" />
      </head>
      <body>
        <AppThemeProvider>
          <StreamProvider>
            {children}
            <PWAInstallPrompt />
          </StreamProvider>
        </AppThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
} 