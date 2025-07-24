import type { Metadata, Viewport } from 'next'
import AppThemeProvider from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TYT-AYT Koçluk Platformu',
  description: 'TYT ve AYT sınavları için kapsamlı koçluk platformu'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Clean up any existing service workers
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister().then(function(boolean) {
                      console.log('🧹 Unregistered service worker:', boolean);
                    });
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <AppThemeProvider>
          {children}
        </AppThemeProvider>
      </body>
    </html>
  )
} 