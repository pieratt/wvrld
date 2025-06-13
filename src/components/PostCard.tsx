'use client'

import Link from 'next/link'
import { GroupedPost } from '@/hooks/useGroupedPosts'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { useVisitedURLsContext } from '@/contexts/VisitedURLsContext'

type PostCardProps = {
  data: GroupedPost;
  isFront?: boolean;
  pageOwner?: any;
};

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

  const handleSaveAll = async () => {
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
    
    // Use the batch toggle function which handles the logic internally
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
              <h3 className="post-title text-xl font-medium leading-tight">{data.title}</h3>
            </Link>
          </div>
        )}

        {/* Username, timestamp, and save-all button row */}
        <div className="flex items-center justify-between mb-1 text-sm meta-text">
          <div className="flex items-center gap-2">
            <Link 
              href={`/${data.canonicalOwner.username}`} 
              className="user-pill"
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
                onClick={handleSaveAll}
                className="text-sm hover:underline"
                style={{ fontSize: '12px' }}
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
              const saveCount = urlData.saves + (isSaved(urlData.id) ? 1 : 0)
              const visited = isVisited(urlData.id)
              const saved = isSaved(urlData.id)
              
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
                  className={`url-row grid grid-cols-[1fr_auto_auto] gap-3 items-center ${visited ? 'opacity-50' : ''}`}
                  style={rowStyle}
                >
                  {/* URL Title - Inconsolata font */}
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-title truncate hover:underline"
                    style={{ fontFamily: 'Inconsolata, monospace', fontSize: '14px' }}
                    onClick={(e) => {
                      e.preventDefault()
                      handleURLClick(urlData)
                    }}
                  >
                    {urlData.title || urlData.url}
                  </a>

                  {/* Username */}
                  <Link 
                    href={`/${urlData.post.owner.username}`}
                    className="meta-link user-pill text-sm whitespace-nowrap"
                    style={{
                      fontSize: '12px'
                    }}
                  >
                    @{urlData.post.owner.username}
                  </Link>

                  {/* Save button - just number */}
                  <button
                    onClick={() => handleSave({
                      id: urlData.id,
                      url: urlData.url,
                      title: urlData.title,
                      domain: urlData.domain
                    })}
                    className="text-sm hover:underline"
                    style={{ fontSize: '12px' }}
                  >
                    {saveCount}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Show a message for posts with no URLs */}
        {!hasURLs && (
          <div className="text-sm meta-text italic">
            No URLs in this post
          </div>
        )}
      </section>
    </div>
  )
} 