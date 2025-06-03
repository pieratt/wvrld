'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import useSWR from 'swr'
import { UserWithStats } from '../../api/users/[username]/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>
}

interface PostWithDetails {
  id: number
  title: string | null
  createdAt: string
  owner: {
    id: number
    username: string
    title: string | null
    color1: string
    color2: string
  }
  urls: Array<{
    id: number
    url: string
    title: string | null
    description: string | null
    domain: string | null
    order: number | null
  }>
  prompt?: {
    rawText: string
  }
}

export default function PostPage({ params }: PostPageProps) {
  const { slug, postId } = React.use(params)
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: post, error: postError, isLoading } = useSWR<PostWithDetails>(`/api/posts/${postId}`, fetcher)

  // Handle not found
  if (userError && userError.status === 404) {
    notFound()
  }
  
  if (postError && postError.status === 404) {
    notFound()
  }

  if (userError || postError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading content</h1>
            <p className="text-gray-600">Please try refreshing the page.</p>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading || !user || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  // Verify post belongs to this bucket
  if (post.owner.username !== slug) {
    notFound()
  }

  const gradientStyle = {
    background: `linear-gradient(135deg, ${user.color1}, ${user.color2})`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentBucket={{
          id: user.id,
          username: user.username,
          title: user.title,
          description: user.description,
          color1: user.color1,
          color2: user.color2,
          type: user.type || 'user'
        }} 
      />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href={`/${slug}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to {user.title || user.username}
          </Link>
        </nav>

        {/* Post Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-full"
                style={gradientStyle}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {post.title || 'Untitled Post'}
                </h1>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <Link
              href={`/${slug}/${postId}/edit`}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* URLs */}
        {post.urls.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Links ({post.urls.length})
            </h2>
            
            <div className="space-y-3">
              {post.urls
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((url) => (
                  <div key={url.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-4 h-4 mt-1">
                        {url.domain && (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${url.domain}&sz=16`}
                            alt=""
                            className="w-4 h-4"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium break-all"
                        >
                          {url.title || url.url}
                        </a>
                        
                        {url.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {url.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {url.domain}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-500">This post has no URLs.</p>
          </div>
        )}
      </main>
    </div>
  )
} 