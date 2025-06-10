'use client'

import React, { createContext, useContext } from 'react'
import { useVisitedURLs } from '@/hooks/useVisitedURLs'

interface VisitedURLsContextType {
  isVisited: (urlId: number) => boolean
  markAsVisited: (urlId: number) => void
}

const VisitedURLsContext = createContext<VisitedURLsContextType | undefined>(undefined)

export function VisitedURLsProvider({ children }: { children: React.ReactNode }) {
  const visitedURLsState = useVisitedURLs()

  return (
    <VisitedURLsContext.Provider value={visitedURLsState}>
      {children}
    </VisitedURLsContext.Provider>
  )
}

export function useVisitedURLsContext() {
  const context = useContext(VisitedURLsContext)
  if (context === undefined) {
    throw new Error('useVisitedURLsContext must be used within a VisitedURLsProvider')
  }
  return context
} 