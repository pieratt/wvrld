'use client'

import { ReactNode } from 'react'

interface MasonryGridProps {
  children: ReactNode
  className?: string
}

export default function MasonryGrid({ children, className = '' }: MasonryGridProps) {
  return (
    <div className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 ${className}`}>
      {children}
    </div>
  )
}

// Individual item wrapper for masonry
interface MasonryItemProps {
  children: ReactNode
  className?: string
}

export function MasonryItem({ children, className = '' }: MasonryItemProps) {
  return (
    <div className={`break-inside-avoid mb-4 ${className}`}>
      {children}
    </div>
  )
} 