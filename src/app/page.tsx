'use client'

import { ThemeProvider } from 'next-themes'
import { AppLayout } from '@/components/dashboard/AppLayout'

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppLayout />
    </ThemeProvider>
  )
}
