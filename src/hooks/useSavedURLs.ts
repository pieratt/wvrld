'use client'

import { useState, useEffect, useCallback } from 'react'

const SAVED_URLS_KEY = 'wvrld_saved_urls'

export interface SavedURL {
  id: number
  url: string
  title: string | null
  domain: string | null
  savedAt: string
}

export function useSavedURLs() {
  const [savedURLs, setSavedURLs] = useState<Set<number>>(new Set())
  const [savedURLsData, setSavedURLsData] = useState<SavedURL[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved URLs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_URLS_KEY)
      if (saved) {
        const data: SavedURL[] = JSON.parse(saved)
        setSavedURLsData(data)
        setSavedURLs(new Set(data.map(url => url.id)))
      }
    } catch (error) {
      console.error('Error loading saved URLs:', error)
    }
    setIsLoading(false)
  }, [])

  // Save to localStorage whenever savedURLsData changes
  const saveToStorage = useCallback((data: SavedURL[]) => {
    try {
      localStorage.setItem(SAVED_URLS_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving URLs to localStorage:', error)
    }
  }, [])

  // Check if a URL is saved
  const isSaved = useCallback((urlId: number) => {
    return savedURLs.has(urlId)
  }, [savedURLs])

  // Toggle save status for a URL
  const toggleSave = useCallback(async (url: {
    id: number
    url: string
    title: string | null
    domain: string | null
  }) => {
    const isCurrentlySaved = savedURLs.has(url.id)
    
    // Optimistic update
    if (isCurrentlySaved) {
      // Remove from saved
      const newSavedURLs = new Set(savedURLs)
      newSavedURLs.delete(url.id)
      setSavedURLs(newSavedURLs)
      
      const newSavedURLsData = savedURLsData.filter(savedUrl => savedUrl.id !== url.id)
      setSavedURLsData(newSavedURLsData)
      saveToStorage(newSavedURLsData)
    } else {
      // Add to saved
      const newSavedURLs = new Set(savedURLs)
      newSavedURLs.add(url.id)
      setSavedURLs(newSavedURLs)
      
      const newSavedURL: SavedURL = {
        id: url.id,
        url: url.url,
        title: url.title,
        domain: url.domain,
        savedAt: new Date().toISOString()
      }
      const newSavedURLsData = [newSavedURL, ...savedURLsData]
      setSavedURLsData(newSavedURLsData)
      saveToStorage(newSavedURLsData)
    }

    // Update database save count
    try {
      await fetch('/api/urls/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urlId: url.id,
          action: isCurrentlySaved ? 'unsave' : 'save'
        })
      })
    } catch (error) {
      console.error('Error updating save count:', error)
      // TODO: Revert optimistic update on error
    }
  }, [savedURLs, savedURLsData, saveToStorage])

  // Batch toggle multiple URLs at once
  const batchToggleSave = useCallback(async (urls: Array<{
    id: number
    url: string
    title: string | null
    domain: string | null
  }>, forceAction?: 'save' | 'unsave') => {
    if (urls.length === 0) return

    // Determine what action to take
    let action: 'save' | 'unsave'
    if (forceAction) {
      action = forceAction
    } else {
      // If all URLs are saved, unsave them; otherwise save them
      const allSaved = urls.every(url => savedURLs.has(url.id))
      action = allSaved ? 'unsave' : 'save'
    }

    // Prepare the new state
    const newSavedURLs = new Set(savedURLs)
    const newSavedURLsData = [...savedURLsData]
    const urlsToProcess = urls.filter(url => {
      const isCurrentlySaved = savedURLs.has(url.id)
      return (action === 'save' && !isCurrentlySaved) || (action === 'unsave' && isCurrentlySaved)
    })

    if (urlsToProcess.length === 0) return

    // Apply optimistic updates
    urlsToProcess.forEach(url => {
      if (action === 'save') {
        newSavedURLs.add(url.id)
        const newSavedURL: SavedURL = {
          id: url.id,
          url: url.url,
          title: url.title,
          domain: url.domain,
          savedAt: new Date().toISOString()
        }
        newSavedURLsData.unshift(newSavedURL)
      } else {
        newSavedURLs.delete(url.id)
        const index = newSavedURLsData.findIndex(savedUrl => savedUrl.id === url.id)
        if (index !== -1) {
          newSavedURLsData.splice(index, 1)
        }
      }
    })

    // Update state
    setSavedURLs(newSavedURLs)
    setSavedURLsData(newSavedURLsData)
    saveToStorage(newSavedURLsData)

    // Update database for all URLs
    try {
      await Promise.allSettled(
        urlsToProcess.map(url =>
          fetch('/api/urls/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              urlId: url.id,
              action: action
            })
          })
        )
      )
    } catch (error) {
      console.error('Error in batch save operation:', error)
      // TODO: Revert optimistic updates on error
    }
  }, [savedURLs, savedURLsData, saveToStorage])

  return {
    savedURLs: savedURLsData,
    isSaved,
    toggleSave,
    batchToggleSave,
    isLoading,
    totalSaved: savedURLsData.length
  }
} 