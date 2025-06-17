import React from 'react'
import Link from 'next/link'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'

interface PageLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  metaHeader?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export default function PageLayout({ sidebar, children, metaHeader, style, className = "" }: PageLayoutProps) {
  return (
    <div 
      style={style}
      className={`layout-container ${className}`}
    >
      {/* Header spans full width above both columns */}
      {metaHeader && (
        <header className="layout-header">
          {metaHeader}
        </header>
      )}
      
      {/* Body contains nav and main content side by side */}
      <div className="layout-body">
        <LeftSidebar sidebar={sidebar} />
        <main className="main-content">
          <div className="main-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function LeftSidebar({ sidebar }: { sidebar: React.ReactNode }) {
  const { totalSaved } = useSavedURLsContext()
  
  return (
    <aside className="left-sidebar">
      {/* Navigation content */}
      <div className="sidebar-nav">
        {sidebar}
      </div>
      
      {/* Bottom navigation links */}
      <nav className="sidebar-bottom-nav">
        <Link href="/" className="type-small hover:underline">
          ❤️‍🔥🌐 WVRLD
        </Link>
        <Link href="/saved" className="type-small hover:underline">
          SAVED ({totalSaved})
        </Link>
      </nav>
    </aside>
  )
} 