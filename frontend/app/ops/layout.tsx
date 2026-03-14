import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ops | ApexLogics',
  description: 'Internal operations taskboard for ApexLogics agents.',
  robots: { index: false, follow: false },
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
