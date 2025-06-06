'use client'

import React, { createContext, useContext } from 'react'
import { useSavedURLs } from '@/hooks/useSavedURLs'

interface SavedURLsContextType {
  savedURLs: Array<{
    id: number
    url: string
    title: string | null
    domain: string | null
    savedAt: string
  }>
  isSaved: (urlId: number) => boolean
  toggleSave: (url: {
    id: number
    url: string
    title: string | null
    domain: string | null
  }) => Promise<void>
  isLoading: boolean
  totalSaved: number
}

const SavedURLsContext = createContext<SavedURLsContextType | undefined>(undefined)

export function SavedURLsProvider({ children }: { children: React.ReactNode }) {
  const savedURLsState = useSavedURLs()

  return (
    <SavedURLsContext.Provider value={savedURLsState}>
      {children}
    </SavedURLsContext.Provider>
  )
}

export function useSavedURLsContext() {
  const context = useContext(SavedURLsContext)
  if (context === undefined) {
    throw new Error('useSavedURLsContext must be used within a SavedURLsProvider')
  }
  return context
} 