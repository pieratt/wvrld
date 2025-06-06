'use client'

import Link from 'next/link'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'

export default function Header() {
  const { totalSaved } = useSavedURLsContext()

  return (
    <header className="w-full border-b border-black">
      <div className="max-w-[1200px] mx-auto px-8 h-12 flex items-center justify-between">
        <Link href="/" className="hover:underline">
          WVRLD
        </Link>
        
        <nav className="flex gap-8">
          <Link href="/saved" className="hover:underline">
            saved ({totalSaved})
          </Link>
          <button className="hover:underline">
            add
          </button>
        </nav>
      </div>
    </header>
  )
} 