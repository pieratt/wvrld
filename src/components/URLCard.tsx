'use client'

import Link from 'next/link'
import { MockURL, MockUser, MockPost } from '@/lib/mockData'

interface URLCardProps {
  url: MockURL
  owner: MockUser
  post: MockPost
  showOwner?: boolean
}

export default function URLCard({ url, owner, post, showOwner = true }: URLCardProps) {
  // Create gradient background from owner colors
  const gradientStyle = {
    background: `linear-gradient(135deg, ${owner.color1}, ${owner.color2})`
  }

  // Get domain favicon (using Google's favicon service)
  const faviconUrl = url.domain ? `https://www.google.com/s2/favicons?domain=${url.domain}&sz=32` : null

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Gradient header bar */}
      <div className="h-1" style={gradientStyle} />
      
      <div className="p-4">
        {/* URL Header */}
        <div className="flex items-start gap-3 mb-3">
          {faviconUrl && (
            <img 
              src={faviconUrl} 
              alt={`${url.domain} favicon`}
              className="w-6 h-6 rounded-sm flex-shrink-0 mt-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-tight">
              {url.title || url.url}
            </h3>
            {url.description && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                {url.description}
              </p>
            )}
          </div>
        </div>

        {/* Domain and Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
            {url.domain || new URL(url.url).hostname}
          </span>
          <div className="flex gap-3">
            <span>♡ {url.saves}</span>
            <span>↗ {url.clicks}</span>
          </div>
        </div>

        {/* Owner info (if showing) */}
        {showOwner && (
          <div className="flex items-center justify-between">
            <Link 
              href={`/${owner.username}`}
              className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={gradientStyle}
              />
              <span className="text-gray-700 font-medium">
                {owner.title || owner.username}
              </span>
            </Link>
            
            {post.title && (
              <Link 
                href={`/${owner.username}/${post.id}`}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                from "{post.title}"
              </Link>
            )}
          </div>
        )}

        {/* Click overlay */}
        <a 
          href={url.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
          aria-label={`Visit ${url.title || url.url}`}
        />
      </div>
    </div>
  )
} 