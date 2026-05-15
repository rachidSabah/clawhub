'use client'

import dynamic from 'next/dynamic'

const AppLayout = dynamic(
  () => import('@/components/dashboard/AppLayout').then((m) => m.AppLayout),
  { ssr: false }
)

export function ClientLayout() {
  return <AppLayout />
}
