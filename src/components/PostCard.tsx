'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import { GroupedPost } from '@/hooks/useGroupedPosts'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { useVisitedURLsContext } from '@/contexts/VisitedURLsContext'
import { getDisplayTitle } from '@/lib/utils'

type PostCardProps = {
  data: GroupedPost;
  isFront?: boolean;
  pageOwner?: any;
};

// Heart SVG Component
function HeartButton({ saved, onClick }: { saved: boolean, onClick: () => void }) {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    setIsClicked(true)
    onClick()
    // Reset animation state after animation completes
    setTimeout(() => setIsClicked(false), 300)
  }

  return (
    <button
      onClick={handleClick}
      className={`heart-button ${isClicked ? 'clicked' : ''} ${saved ? 'opacity-100' : ''}`}
    >
      <svg viewBox="0 0 29.27 26.62" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.29,0c-2.78,0-5.23,1.43-6.65,3.59C13.2,1.43,10.76,0,7.98,0,3.57,0,.1,3.57,0,7.97c-.21,9.6,14.63,18.65,14.63,18.65,0,0,15.01-8.94,14.63-18.65-.17-4.4-3.57-7.97-7.97-7.97Z"/>
      </svg>
    </button>
  )
}

export default function PostCard({ data, isFront = false, pageOwner }: PostCardProps) {
  const { isSaved, toggleSave, batchToggleSave } = useSavedURLsContext()
  const { isVisited, markAsVisited } = useVisitedURLsContext()
  

  
  // Use CSS variables for colors (set by page-level components)
  // No need to fetch system user colors since page sets --c1 and --c2
  
  const handleSave = (url: { id: number; url: string; title: string | null; domain: string | null; }) => {
    toggleSave(url)
  }

  const handleURLClick = (urlData: any) => {
    markAsVisited(urlData.id)
    window.open(urlData.url, '_blank', 'noopener,noreferrer')
  }

  const handleSaveAll = async (event?: React.MouseEvent) => {
    // Filter URLs based on context:
    // - On front page (isFront=true): save all URLs from all users with this title
    // - On user page (!isFront && pageOwner): save only URLs from the page owner
    const urlsToConsider = !isFront && pageOwner 
      ? data.urls.filter(urlData => urlData.post.owner.id === pageOwner.id)
      : data.urls
    
    // Convert to the format expected by batchToggleSave
    const urlsForBatch = urlsToConsider.map(urlData => ({
      id: urlData.id,
      url: urlData.url,
      title: urlData.title,
      domain: urlData.domain
    }))
    
    // Check if command/ctrl key is pressed
    const isCommandClick = event && (event.metaKey || event.ctrlKey)
    
    // If command-click, open all URLs in new tabs
    if (isCommandClick) {
      urlsToConsider.forEach(urlData => {
        // Mark as visited
        markAsVisited(urlData.id)
        // Open in new tab
        window.open(urlData.url, '_blank', 'noopener,noreferrer')
      })
    }
    
    // Always save the URLs (regardless of command-click)
    await batchToggleSave(urlsForBatch)
  }

  // Get the first post ID for the universal post link
  const firstPostId = data.posts[0]?.id;

  // Show posts even if they have no URLs (title-only posts)
  const hasURLs = data.urls && data.urls.length > 0

  return (
    <div className="masonry-item">
      <section 
        className="post-card"
      >
        {/* Post title - moved above username/timestamp row */}
        {data.title && (
          <div className="post-title-section mb-2">
            <Link 
              href={`/post/${firstPostId}`} 
              className="hover:underline block"
            >
              <h3 className="post-title type-large">{data.title}</h3>
            </Link>
          </div>
        )}

        {/* Username, timestamp, and save-all button row */}
        <div className="flex items-center justify-between mb-1 type-small state-inactive">
          <div className="flex items-center gap-2">
            <Link 
              href={`/${data.canonicalOwner.username}`} 
              className="user-link type-small"
              style={{
                '--user-color1': data.canonicalOwner.color1,
                '--user-color2': data.canonicalOwner.color2,
              } as React.CSSProperties}
            >
              @{data.canonicalOwner.username}
            </Link>
            <span>
              {hasURLs 
                ? new Date(Math.max(...data.urls.map(url => new Date(url.createdAt).getTime()))).toLocaleDateString()
                : new Date(data.posts[0]?.id ? new Date().toISOString() : new Date().toISOString()).toLocaleDateString()
              }
            </span>
          </div>
          
          {/* Save All button */}
          {hasURLs && (() => {
            // Filter URLs based on context for button display
            const urlsToConsider = !isFront && pageOwner 
              ? data.urls.filter(urlData => urlData.post.owner.id === pageOwner.id)
              : data.urls
            // Only show button if there are URLs to consider
            return urlsToConsider.length > 0 && (
              <button
                onClick={(e) => handleSaveAll(e)}
                className="save-button type-small hover:underline"
              >
                {urlsToConsider.every(urlData => isSaved(urlData.id)) ? 'Unsave Post' : 'Save Post'}
              </button>
            )
          })()}
        </div>

        {/* URLs section - only show if there are URLs */}
        {hasURLs && (
          <div className="urls-section">
            {data.urls.map((urlData, index) => {
              const saved = isSaved(urlData.id)
              const visited = isVisited(urlData.id)
              
              // Use user's colors ONLY when saved, otherwise use CSS variables
              const rowStyle = saved ? {
                backgroundColor: urlData.post.owner.color1,
                color: urlData.post.owner.color2,
                padding: '0.125rem 0.25rem',
                borderRadius: '0.125rem',
                margin: '0.05rem 0'
              } : {
                padding: '0.125rem 0.25rem',
                margin: '0.05rem 0'
              }
              
              return (
                <div 
                  key={`${urlData.id}-${urlData.post.id}-${index}`} 
                  className={`url-row grid grid-cols-[1fr_auto_auto] gap-3 items-center type-small ${visited ? 'state-visited' : 'state-active'}`}
                  style={rowStyle}
                >
                  {/* URL Title - Uses CSS typography class */}
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-title truncate hover:underline"
                    onClick={(e) => {
                      e.preventDefault()
                      handleURLClick(urlData)
                    }}
                  >
                    {getDisplayTitle(urlData.title, urlData.url, urlData.domain)}
                  </a>

                  {/* Username - Changed to left-aligned */}
                  <div className="username-column">
                    <Link 
                      href={`/${urlData.post.owner.username}`}
                      className="user-link type-small whitespace-nowrap"
                      style={{
                        '--user-color1': urlData.post.owner.color1,
                        '--user-color2': urlData.post.owner.color2,
                      } as React.CSSProperties}
                    >
                      @{urlData.post.owner.username}
                    </Link>
                  </div>

                  {/* Heart button instead of count */}
                  <HeartButton 
                    saved={saved}
                    onClick={() => handleSave({
                      id: urlData.id,
                      url: urlData.url,
                      title: urlData.title,
                      domain: urlData.domain
                    })}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Show a message for posts with no URLs */}
        {!hasURLs && (
          <div className="type-small state-inactive italic">
            No URLs in this post
          </div>
        )}
      </section>
    </div>
  )
} 