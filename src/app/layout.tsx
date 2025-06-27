import type { Metadata } from 'next'
import AppThemeProvider from '@/components/ThemeProvider'
import { StreamProvider } from '@/contexts/StreamContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'TYT AYT Koçluk Sistemi V1.2',
  description: 'Kapsamlı TYT AYT sınav hazırlık koçluk platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
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