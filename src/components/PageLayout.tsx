import React from 'react'

interface PageLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export default function PageLayout({ sidebar, children, style, className = "" }: PageLayoutProps) {
  return (
    <div 
      style={style}
      className={className}
    >
      <main className="main-grid">
        <section>
          {children}
        </section>
        
        <aside className="sticky top-0 h-screen pt-0">
          {sidebar}
        </aside>
      </main>
    </div>
  )
} 