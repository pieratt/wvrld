'use client'

import Link from 'next/link'
import { GroupedPost } from '@/hooks/useGroupedPosts'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { useVisitedURLsContext } from '@/contexts/VisitedURLsContext'
import useSWR from 'swr'

type PostCardProps = {
  data: GroupedPost;
  isFront?: boolean;
  pageOwner?: any;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PostCard({ data, isFront = false, pageOwner }: PostCardProps) {
  const { isSaved, toggleSave } = useSavedURLsContext()
  const { isVisited, markAsVisited } = useVisitedURLsContext()
  
  // Get system user (User ID 1) for default colors
  const { data: systemUser } = useSWR('/api/users/id/1', fetcher)
  
  // Default colors from User ID 1 (system colors)
  const defaultColors = systemUser ? {
    color1: systemUser.color1,
    color2: systemUser.color2
  } : {
    color1: '#111111',
    color2: '#ffffff'
  }
  
  const handleSave = (url: { id: number; url: string; title: string | null; domain: string | null; }) => {
    toggleSave(url)
  }

  const handleURLClick = (urlData: any) => {
    markAsVisited(urlData.id)
    window.open(urlData.url, '_blank', 'noopener,noreferrer')
  }

  const handleSaveAll = () => {
    // Check if all URLs are currently saved
    const allSaved = data.urls.every(urlData => isSaved(urlData.id))
    
    // If all are saved, unsave them all; otherwise save them all
    data.urls.forEach(urlData => {
      const currentlySaved = isSaved(urlData.id)
      
      if (allSaved && currentlySaved) {
        // Unsave all
        handleSave({
          id: urlData.id,
          url: urlData.url,
          title: urlData.title,
          domain: urlData.domain
        })
      } else if (!allSaved && !currentlySaved) {
        // Save all unsaved ones
        handleSave({
          id: urlData.id,
          url: urlData.url,
          title: urlData.title,
          domain: urlData.domain
        })
      }
    })
  }

  // Get the first post ID for the universal post link
  const firstPostId = data.posts[0]?.id;

  // Show posts even if they have no URLs (title-only posts)
  const hasURLs = data.urls && data.urls.length > 0

  return (
    <div className="masonry-item">
      <section 
        className="post-card"
        style={{
          color: defaultColors.color1
        } as React.CSSProperties}
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
              style={{
                color: defaultColors.color1
              }}
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
          {hasURLs && (
            <button
              onClick={handleSaveAll}
              className="text-sm hover:underline"
              style={{ fontSize: '12px' }}
            >
              Saved
            </button>
          )}
        </div>

        {/* URLs section - only show if there are URLs */}
        {hasURLs && (
          <div className="urls-section">
            {data.urls.map((urlData, index) => {
              const saveCount = urlData.saves + (isSaved(urlData.id) ? 1 : 0)
              const visited = isVisited(urlData.id)
              const saved = isSaved(urlData.id)
              
              // Use user's colors ONLY when saved, otherwise use default black/white
              const rowStyle = saved ? {
                backgroundColor: urlData.post.owner.color1,
                color: urlData.post.owner.color2,
                padding: '0.125rem 0.25rem',
                borderRadius: '0.125rem',
                margin: '0.05rem 0'
              } : {
                color: defaultColors.color1,
                padding: '0.125rem 0.25rem',
                margin: '0.05rem 0'
              }
              
              return (
                <div 
                  key={urlData.id} 
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