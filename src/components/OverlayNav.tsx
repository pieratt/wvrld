'use client'

import Link from 'next/link'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'

export default function OverlayNav() {
  const { totalSaved } = useSavedURLsContext()

  return (
    <nav 
      className="overlay-nav"
      style={{
        position: 'fixed',
        top: '32px',
        left: 0,
        right: 0,
        zIndex: 999,
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        color: 'var(--c1)',
        fontSize: '14px',
        pointerEvents: 'auto',
      }}
    >
      <Link href="/" className="hover:underline">
      ❤️‍🔥🌐
      </Link>
      
      <Link href="/saved" className="hover:underline">
        saved ({totalSaved})
      </Link>
    </nav>
  )
} 