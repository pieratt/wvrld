'use client'

import React from 'react'
import Link from 'next/link'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { palette } from '@/lib/palette'

export default function SavedPage() {
  const { savedURLs, toggleSave, isLoading } = useSavedURLsContext()

  // Get system colors for saved page
  const colors = palette({
    cardOwner: { id: 1, username: 'system', title: 'System', color1: '#eeeeee', color2: '#111111', type: 'system' },
    isFront: true,
    pageOwner: undefined
  });

  if (isLoading) {
    return (
      <main 
        className="main-grid"
        style={{ backgroundColor: colors.pageBg, color: colors.pageFont }}
      >
        <aside></aside>
        <section>
          <div>Loading...</div>
        </section>
      </main>
    )
  }

  return (
    <main 
      className="main-grid"
      style={{ backgroundColor: colors.pageBg, color: colors.pageFont }}
    >
      <aside className="sticky top-0 h-screen pt-4">
        <div>
          <h1>Saved URLs</h1>
          <div className="meta-text">
            {savedURLs.length} saved
          </div>
        </div>
      </aside>
      
      <section>
        {savedURLs.length > 0 ? (
          <div className="space-y-4">
            {savedURLs.map((url) => (
              <div key={url.id} className="space-y-1">
                <a 
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:underline"
                >
                  {url.title || url.url}
                </a>
                
                <div className="meta-text flex items-center gap-2">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${url.domain}`}
                    alt=""
                    className="w-4 h-4"
                  />
                  <span>{url.domain}</span>
                  <button
                    onClick={() => toggleSave(url)}
                    className="hover:underline underline"
                  >
                    saved
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No saved URLs yet</div>
        )}
      </section>
    </main>
  )
} 