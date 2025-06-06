'use client'

import Link from 'next/link'
import { GroupedPost } from '@/hooks/useGroupedPosts'
import { useSavedURLsContext } from '@/contexts/SavedURLsContext'

interface PostCardProps {
  groupedPost: GroupedPost
  showOwner?: boolean
}

export default function PostCard({ groupedPost, showOwner = true }: PostCardProps) {
  const { isSaved, toggleSave } = useSavedURLsContext()

  // Create gradient background from canonical owner colors
  const gradientStyle = {
    background: `linear-gradient(135deg, ${groupedPost.canonicalOwner.color1}, ${groupedPost.canonicalOwner.color2})`
  }

  const handleSaveClick = async (e: React.MouseEvent, url: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    await toggleSave({
      id: url.id,
      url: url.url,
      title: url.title,
      domain: url.domain
    })
  }

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Gradient header bar */}
      <div className="h-1" style={gradientStyle} />
      
      <div className="p-4">
        {/* Post Title */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {groupedPost.title}
          </h3>
          {showOwner && (
            <div className="text-sm text-gray-500">
              @{groupedPost.canonicalOwner.username}
              {groupedPost.posts.length > 1 && (
                <span className="ml-2">
                  +{groupedPost.posts.length - 1} other{groupedPost.posts.length > 2 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* URLs List */}
        <div className="space-y-3 mb-4">
          {groupedPost.urls.map((urlData) => {
            const contributorGradient = {
              background: `linear-gradient(135deg, ${urlData.post.owner.color1}, ${urlData.post.owner.color2})`
            }

            return (
              <div key={`${urlData.post.id}-${urlData.id}`} className="flex items-start gap-3 group/url">
                {/* Contributor avatar */}
                <div 
                  className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                  style={contributorGradient}
                  title={`@${urlData.post.owner.username}`}
                />
                
                {/* URL Content */}
                <div className="flex-1 min-w-0">
                  <a 
                    href={urlData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity"
                  >
                    <h4 className="font-medium text-gray-900 line-clamp-1 text-sm mb-1">
                      {urlData.title || urlData.url}
                    </h4>
                    {urlData.description && (
                      <p className="text-gray-600 text-xs line-clamp-2 mb-1">
                        {urlData.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        {urlData.domain || new URL(urlData.url).hostname}
                      </span>
                      {urlData.saves > 0 && (
                        <span>{urlData.saves} saved</span>
                      )}
                    </div>
                  </a>
                </div>

                {/* Save button */}
                <button
                  onClick={(e) => handleSaveClick(e, urlData)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
                    isSaved(urlData.id) 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                  title={isSaved(urlData.id) ? 'Unsave this URL' : 'Save this URL'}
                >
                  {isSaved(urlData.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            )
          })}
        </div>

        {/* See All footer */}
        <div className="pt-3 border-t border-gray-100">
          <Link 
            href={`/${groupedPost.canonicalOwner.username}/${groupedPost.posts[0].id}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={gradientStyle}
            />
            See All
          </Link>
        </div>
      </div>
    </div>
  )
} 