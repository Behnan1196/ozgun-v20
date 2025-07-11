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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Improved Service Worker Registration - prevents duplicates and "only works once" issues
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async function() {
                  try {
                    // Check if service worker is already registered
                    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
                    
                    if (existingRegistration) {
                      console.log('✅ [SW] Service Worker already registered:', existingRegistration.scope);
                      
                      // Check if it needs updating
                      await existingRegistration.update();
                      console.log('🔄 [SW] Service Worker updated');
                      
                      return;
                    }

                    // Register new service worker
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                      scope: '/',
                      updateViaCache: 'none' // Always check for updates
                    });
                    
                    console.log('✅ [SW] Service Worker registered successfully:', registration.scope);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                      console.log('🔄 [SW] Service Worker update found');
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 [SW] New service worker installed, will activate on next page load');
                          }
                        });
                      }
                    });
                    
                  } catch (err) {
                    console.log('❌ [SW] Service Worker registration failed:', err);
                  }
                });
                
                // Listen for service worker messages
                navigator.serviceWorker.addEventListener('message', (event) => {
                  console.log('💬 [SW] Message received from service worker:', event.data);
                });
                
                // Handle controller changes (service worker updates)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  console.log('🔄 [SW] Service worker controller changed');
                  // Optionally reload the page when a new service worker takes control
                  // window.location.reload();
                });
              } else {
                console.log('❌ [SW] Service workers are not supported in this browser');
              }
            `,
          }}
        />
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