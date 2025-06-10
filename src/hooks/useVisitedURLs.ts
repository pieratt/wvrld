'use client'

import { useState, useEffect, useCallback } from 'react'

const VISITED_URLS_KEY = 'wvrld_visited_urls'

export function useVisitedURLs() {
  const [visitedURLs, setVisitedURLs] = useState<Set<number>>(new Set())

  // Load visited URLs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(VISITED_URLS_KEY)
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved) as number[]
        setVisitedURLs(new Set(parsedIds))
      } catch (error) {
        console.error('Error loading visited URLs:', error)
      }
    }
  }, [])

  // Save to localStorage whenever visitedURLs changes
  useEffect(() => {
    localStorage.setItem(VISITED_URLS_KEY, JSON.stringify(Array.from(visitedURLs)))
  }, [visitedURLs])

  const isVisited = useCallback((urlId: number) => {
    return visitedURLs.has(urlId)
  }, [visitedURLs])

  const markAsVisited = useCallback((urlId: number) => {
    setVisitedURLs(prev => new Set([...prev, urlId]))
  }, [])

  return {
    isVisited,
    markAsVisited
  }
} 