'use client'

import React from 'react'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MasonryGrid, { MasonryItem } from '@/components/MasonryGrid'
import URLCard from '@/components/URLCard'
import useSWR from 'swr'
import { URLWithPost } from '../api/urls/route'
import { UserWithStats } from '../api/users/[username]/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BucketPageProps {
  params: Promise<{ slug: string }>
}

export default function BucketPage({ params }: BucketPageProps) {
  const { slug } = React.use(params)
  
  const { data: user, error: userError } = useSWR<UserWithStats>(`/api/users/${slug}`, fetcher)
  const { data: urls, error: urlsError, isLoading } = useSWR<URLWithPost[]>(`/api/urls?bucket=${slug}`, fetcher)

  // Handle user not found
  if (userError && userError.status === 404) {
    notFound()
  }

  if (userError || urlsError) {
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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg h-48 shadow-sm"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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
      
      <main className="container mx-auto px-4 py-8">
        {/* Bucket Stats */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-full"
              style={gradientStyle}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.title || user.username}
              </h1>
              {user.description && (
                <p className="text-gray-600">{user.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-600">
            <span><strong>{user.stats.totalURLs}</strong> URLs</span>
            <span><strong>{user.stats.uniqueDomains}</strong> domains</span>
            <span><strong>{user.stats.totalPosts}</strong> posts</span>
          </div>
        </div>

        {/* URLs Grid */}
        {urls && urls.length > 0 ? (
          <MasonryGrid>
            {urls.map((urlData) => (
              <MasonryItem key={`${urlData.post.id}-${urlData.id}`}>
                <URLCard
                  url={{
                    id: urlData.id,
                    url: urlData.url,
                    title: urlData.title,
                    description: urlData.description,
                    domain: urlData.domain,
                    saves: urlData.saves,
                    clicks: urlData.clicks
                  }}
                  owner={{
                    id: urlData.post.owner.id,
                    username: urlData.post.owner.username,
                    title: urlData.post.owner.title,
                    color1: urlData.post.owner.color1,
                    color2: urlData.post.owner.color2
                  }}
                  post={{
                    id: urlData.post.id,
                    title: urlData.post.title
                  }}
                  showOwner={false}
                />
              </MasonryItem>
            ))}
          </MasonryGrid>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              This bucket is empty
            </h2>
            <p className="text-gray-500">
              No URLs have been added to this bucket yet.
            </p>
          </div>
        )}
      </main>
    </div>
  )
} 