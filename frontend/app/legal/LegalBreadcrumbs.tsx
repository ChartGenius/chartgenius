'use client'

import { usePathname } from 'next/navigation'
import Breadcrumbs from '../components/Breadcrumbs'

const PAGE_NAMES: Record<string, string> = {
  '/legal/terms':      'Terms of Service',
  '/legal/privacy':    'Privacy Policy',
  '/legal/cookies':    'Cookie Policy',
  '/legal/disclaimer': 'Disclaimer',
}

export default function LegalBreadcrumbs() {
  const pathname = usePathname()
  const pageName = PAGE_NAMES[pathname] ?? 'Legal'

  return (
    <Breadcrumbs
      maxWidth="1100px"
      items={[
        { label: 'Home',  href: '/' },
        { label: 'Legal', href: undefined }, // intermediate — not clickable
        { label: pageName },
      ]}
    />
  )
}
