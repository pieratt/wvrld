'use client'

import { useSavedURLsContext } from '@/contexts/SavedURLsContext'
import Link from 'next/link'

export default function SavedPage() {
  const { savedURLs, isLoading } = useSavedURLsContext()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Saved URLs
          </h1>
          <p className="text-gray-600 mt-2">
            {savedURLs.length} saved item{savedURLs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Saved URLs List */}
        {savedURLs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📌</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              No saved URLs yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start saving URLs by clicking the "saved" button on any URL card.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse URLs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedURLs.map((savedUrl) => (
              <div 
                key={savedUrl.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Favicon */}
                  {savedUrl.domain && (
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${savedUrl.domain}&sz=32`}
                      alt={`${savedUrl.domain} favicon`}
                      className="w-8 h-8 rounded-sm flex-shrink-0 mt-1"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {savedUrl.title || savedUrl.url}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {savedUrl.domain || new URL(savedUrl.url).hostname}
                      </span>
                      <span>
                        Saved {new Date(savedUrl.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Visit Link */}
                  <a 
                    href={savedUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Visit →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 