import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'ISPLens — Aspect-Based Sentiment Analysis',
  description:
    'Platform analisis sentimen berbasis aspek untuk layanan Internet Service Provider (ISP) Indonesia.',
  keywords: ['ABSA', 'ISP', 'sentiment analysis', 'NLP', 'IndoBERT', 'ISPSense'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
