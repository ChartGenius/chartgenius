/**
 * Landing page — Server Component
 *
 * The interactive dashboard is entirely client-driven (watchlist, live quotes,
 * alerts, etc.), so the logic lives in HomeClient.tsx ('use client').
 * This wrapper gives Next.js a proper server-rendered entry point for SEO
 * and metadata, while delegating all rendering to the client component.
 */
import { Suspense } from 'react'
import HomeClient from './HomeClient'

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  )
}
