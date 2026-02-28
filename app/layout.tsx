import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { WeatherProvider } from '@/contexts/WeatherContext'

export const metadata: Metadata = {
  title: 'FieldMind — The AI Brain for Field Operations',
  description: 'AI-powered equipment inspection platform. Voice. Vision. 5 Languages. Blockchain verified. Built for the field inspector.',
  keywords: 'CAT inspection, equipment AI, field operations, Caterpillar, inspection AI, voice inspection',
  openGraph: {
    title: 'FieldMind — The AI Brain for Field Operations',
    description: '5 AI agents. Voice. Vision. Any weather. Any language. Blockchain verified.',
    type: 'website',
    url: 'https://fieldmind.tech',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FieldMind — AI Field Inspection',
    description: 'GO / CAUTION / NO-GO in seconds. Blockchain verified.',
  },
  icons: { icon: '/favicon.ico' },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <LanguageProvider>
          <WeatherProvider>
            {children}
          </WeatherProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
