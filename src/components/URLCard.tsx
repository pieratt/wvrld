'use client'

import Link from 'next/link'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import { useState } from 'react'
import { cleanDomain, getDisplayTitle } from '@/lib/utils'

interface URLData {
  id: number
  url: string
  title: string | null
  description: string | null
  domain: string | null
  saves: number
  clicks: number
}

interface OwnerData {
  id: number
  username: string
  title: string | null
  color1: string
  color2: string
}

interface PostData {
  id: number
  title: string | null
}

interface URLCardProps {
  url: URLData
  owner: OwnerData
  post: PostData
  showOwner?: boolean
}

// Platform icons for common domains
const PlatformIcon = ({ domain }: { domain: string | null }) => {
  if (!domain) return null
  
  const lowerDomain = domain.toLowerCase()
  
  if (lowerDomain.includes('instagram.com')) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </div>
    )
  }
  
  if (lowerDomain.includes('twitter.com') || lowerDomain.includes('x.com')) {
    return (
      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-sm font-bold">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
    )
  }
  
  if (lowerDomain.includes('amazon.com')) {
    return (
      <div className="w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
        <span className="text-xs font-black">a</span>
      </div>
    )
  }
  
  if (lowerDomain.includes('youtube.com')) {
    return (
      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
    )
  }
  
  // Default favicon for other domains
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  return (
    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
      <img 
        src={faviconUrl} 
        alt={`${domain} favicon`}
        className="w-6 h-6"
        onError={(e) => {
          e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-semibold text-gray-600">${domain?.[0]?.toUpperCase() || 'W'}</span>`
        }}
      />
    </div>
  )
}

export default function URLCard({ url, owner, post, showOwner = true }: URLCardProps) {
  const { isSaved, toggleSave } = useSavedURLsContext()
  const [optimisticSaveCount, setOptimisticSaveCount] = useState(url.saves)
  const [isToggling, setIsToggling] = useState(false)

  // Create gradient background from owner colors
  const gradientStyle = {
    background: `linear-gradient(135deg, ${owner.color1}, ${owner.color2})`
  }

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isToggling) return
    
    setIsToggling(true)
    const wasLiked = isSaved(url.id)
    
    // Optimistic UI update
    setOptimisticSaveCount(prev => wasLiked ? prev - 1 : prev + 1)
    
    try {
      await toggleSave({
        id: url.id,
        url: url.url,
        title: url.title,
        domain: url.domain
      })
    } catch {
      // Revert optimistic update on error
      setOptimisticSaveCount(prev => wasLiked ? prev + 1 : prev - 1)
    } finally {
      setIsToggling(false)
    }
  }

  const handleURLClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    window.open(url.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      className="group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={handleURLClick}
    >
      {/* Gradient header bar */}
      <div className="h-1" style={gradientStyle} />
      
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Platform icon */}
          <div className="flex-shrink-0">
            <PlatformIcon domain={url.domain} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-base leading-tight mb-1">
              {getDisplayTitle(url.title, url.url, url.domain)}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                {cleanDomain(url.domain) || cleanDomain(new URL(url.url).hostname)}
              </span>
              {showOwner && (
                <>
                  <span>•</span>
                  <span>@{owner.username}</span>
                </>
              )}
              {optimisticSaveCount > 0 && (
                <>
                  <span>•</span>
                  <span>{optimisticSaveCount} saved</span>
                </>
              )}
            </div>
            
            {url.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {url.description}
              </p>
            )}
          </div>
          
          {/* Save button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleSaveClick}
              disabled={isToggling}
              className={`relative z-20 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isSaved(url.id) 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
              } ${isToggling ? 'opacity-50' : ''}`}
              title={isSaved(url.id) ? 'Unsave this URL' : 'Save this URL'}
            >
              {isSaved(url.id) ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        
        {/* Post info (if showing owner and post has title) */}
        {showOwner && post.title && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link 
              href={`/${owner.username}/${post.id}`}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={gradientStyle}
              />
                             from &ldquo;{post.title}&rdquo;
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 